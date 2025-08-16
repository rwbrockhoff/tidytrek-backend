import knex from '../../db/connection.js';
import { Tables } from '../../db/tables.js';
import { Request, Response } from 'express';
import {
	successResponse,
	badRequest,
	internalError,
} from '../../utils/error-response.js';
import {
	getNextAppendIndex,
	moveWithFractionalIndex,
} from '../../utils/fractional-indexing/index.js';
import {
	hasEmptyValidatedBody,
	NO_VALID_FIELDS_MESSAGE,
	ValidatedRequest,
} from '../../utils/validation.js';
import {
	GearClosetItemUpdate,
	GearClosetItemMove,
	MoveItemToPack,
	gearClosetItemFields,
} from './closet-schemas.js';

async function getGearCloset(req: Request, res: Response) {
	try {
		const { userId } = req;

		// Build closet items JSON object for aggregation
		const gearClosetItemJson = gearClosetItemFields
			.map((f) => `'${f}', pi.${f}`)
			.join(', ');

		const {
			rows: [{ gear_closet_list }],
		} = await knex.raw(
			`
		select COALESCE(
			json_agg(
				json_build_object(${gearClosetItemJson})
				ORDER BY pi.pack_item_index::NUMERIC
			) FILTER (WHERE pi.pack_item_id IS NOT NULL),
			'[]'::json
		) as gear_closet_list 
			from pack_item pi
			where pi.user_id = ? and pi.pack_id IS NULL
	`,
			[userId],
		);

		return successResponse(res, { gear_closet_list });
	} catch (err) {
		return internalError(res, 'There was an error accessing your gear closet.');
	}
}

async function addGearClosetItem(req: Request, res: Response) {
	try {
		const { userId } = req;

		// Calculate index for new gear closet item (append to end)
		const pack_item_index = await getNextAppendIndex(Tables.PackItem, 'pack_item_index', {
			user_id: userId,
			pack_id: null,
			pack_category_id: null,
		});

		const [gearClosetItem] = await knex(Tables.PackItem)
			.insert({
				user_id: userId,
				pack_item_name: '',
				pack_item_index,
			})
			.returning(gearClosetItemFields);

		return successResponse(res, { gearClosetItem }, 'Item added to gear closet successfully');
	} catch (err) {
		return internalError(res, 'There was an error adding your item to your gear closet.');
	}
}

async function editGearClosetItem(
	req: ValidatedRequest<GearClosetItemUpdate>,
	res: Response,
) {
	try {
		const { userId } = req;
		const { packItemId } = req.params;

		if (hasEmptyValidatedBody(req)) {
			return badRequest(res, NO_VALID_FIELDS_MESSAGE);
		}

		await knex(Tables.PackItem)
			.update(req.validatedBody)
			.where('pack_item_id', packItemId)
			.where('user_id', userId);

		return successResponse(res, null, 'Gear closet item updated successfully');
	} catch (err) {
		return internalError(res, 'There was an error editing your item.');
	}
}

async function moveGearClosetItem(
	req: ValidatedRequest<GearClosetItemMove>,
	res: Response,
) {
	try {
		const { userId } = req;
		const { packItemId } = req.params;
		const { prev_item_index, next_item_index } = req.validatedBody;

		const { newIndex, rebalanced } = await moveWithFractionalIndex(
			Tables.PackItem,
			'pack_item_index',
			'pack_item_id',
			packItemId,
			prev_item_index,
			next_item_index,
			{ user_id: userId, pack_id: null, pack_category_id: null }, // WHERE conditions for gear closet
		);

		return successResponse(
			res,
			{
				newIndex,
				rebalanced,
			},
			'Gear closet item moved successfully',
		);
	} catch (err) {
		return internalError(res, 'There was an error editing your item.');
	}
}

async function moveItemToPack(req: ValidatedRequest<MoveItemToPack>, res: Response) {
	try {
		const { userId } = req;
		const { packItemId } = req.params;
		const { pack_id, pack_category_id } = req.validatedBody;

		// Calculate index for item moving to pack (append to end of category)
		const newPackItemIndex = await getNextAppendIndex(Tables.PackItem, 'pack_item_index', {
			user_id: userId,
			pack_id,
			pack_category_id,
		});

		await knex(Tables.PackItem)
			.update({ 
				pack_id: Number(pack_id), 
				pack_category_id: Number(pack_category_id), 
				pack_item_index: newPackItemIndex 
			})
			.where('user_id', userId)
			.where('pack_item_id', packItemId);

		return successResponse(res, null, 'Item moved to pack successfully');
	} catch (err) {
		return internalError(res, 'There was an error moving your item to a pack.');
	}
}
async function deleteGearClosetItem(req: Request, res: Response) {
	try {
		const { userId } = req;
		const { packItemId } = req.params;

		await knex(Tables.PackItem)
		.delete()
		.where('pack_item_id', packItemId)
		.where('user_id', userId);

		return successResponse(res, null, 'Gear closet item deleted successfully');
	} catch (err) {
		return internalError(res, 'There was an error deleting your item.');
	}
}

export default {
	getGearCloset,
	addGearClosetItem,
	editGearClosetItem,
	moveGearClosetItem,
	moveItemToPack,
	deleteGearClosetItem,
};
