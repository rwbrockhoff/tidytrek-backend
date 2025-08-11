import knex from '../../db/connection.js';
import { Tables } from '../../db/tables.js';
import { DEFAULT_PALETTE_COLOR } from '../../utils/constants.js';
import { Request, Response } from 'express';
import { MulterS3File } from '../../types/multer.js';
import {
	errorResponse,
	successResponse,
	badRequest,
	notFound,
	internalError,
	HTTP_STATUS,
	ErrorCode,
} from '../../utils/error-response.js';
import { createCloudfrontUrlForPhoto, s3DeletePhoto } from '../../utils/s3.js';
import { packScraper } from './pack-scraper.js';
import { isError } from '../../utils/validation.js';
import {
	DEFAULT_INCREMENT,
	getNextAppendIndex,
	moveWithFractionalIndex,
	bulkMoveToGearCloset,
} from '../../utils/fractional-indexing/fractional-indexing.js';
import { logError, logger } from '../../config/logger.js';
import {
	hasEmptyValidatedBody,
	NO_VALID_FIELDS_MESSAGE,
	ValidatedRequest,
} from '../../utils/validation.js';
import {
	PackUpdate,
	PackMigration,
	PackMove,
	PackItemCreate,
	PackItemUpdate,
	PackItemMove,
	PackCategoryCreate,
	PackCategoryUpdate,
	PackCategoryMove,
	packFields,
	packItemFields,
	packCategoryFields,
} from './pack-schemas.js';

async function getDefaultPack(req: Request, res: Response) {
	try {
		const { userId } = req;

		const pack = await knex(Tables.Pack)
			.select(packFields) // zod schema fields
			.where({ user_id: userId })
			.orderByRaw('pack_index::NUMERIC')
			.first();

		if (pack) {
			// Gets categories for the pack ordered by category index
			// Groups all pack items for each category ordered by pack item index
			// Build pack item JSON object for aggregation
			const packItemJson = packItemFields.map((f) => `'${f}', pi.${f}`).join(', ');

			const { rows: categories = [] } = await knex.raw(
				`select 
					pc.*, 
					COALESCE(
						json_agg(
							json_build_object(${packItemJson})
							ORDER BY pi.pack_item_index::NUMERIC
						) FILTER (WHERE pi.pack_item_id IS NOT NULL),
						'[]'::json
					) as pack_items 
					from pack_category pc
					left outer join pack_item pi on pi.pack_category_id = pc.pack_category_id	
				where pc.user_id = ? and pc.pack_id = ?
				group by pc.pack_category_id
				order by pc.pack_category_index::NUMERIC`,
				[userId, pack.pack_id],
			);

			return successResponse(res, { pack, categories });
		} else {
			// UI can handle not having a default pack.
			return successResponse(res, null, 'No default pack found');
		}
	} catch (err) {
		logError('Failed to load default pack', err, { userId: req?.userId });
		return internalError(res, "We're having trouble loading your packs right now.");
	}
}

async function getPack(req: Request, res: Response) {
	try {
		const { userId } = req;
		const { packId } = req.params;

		const { pack, categories } = await getPackById(userId, Number(packId));

		if (!pack) {
			return notFound(res, 'Pack not found.');
		}

		return successResponse(res, { pack, categories });
	} catch (err) {
		logError('Failed to load pack', err, {
			userId: req.userId,
			packId: req.params.packId,
		});
		return internalError(res, 'There was an error loading your pack right now.');
	}
}

async function getPackById(userId: string, packId: number) {
	const pack = await knex(Tables.Pack)
		.select(packFields)
		.where({ user_id: userId, pack_id: packId })
		.orderBy('created_at')
		.first();

	// Gets categories for a pack ordered by category index
	// Groups all pack items for each category ordered by pack item index
	// Build pack item JSON object for aggregation
	const packItemJson = packItemFields.map((f) => `'${f}', pi.${f}`).join(', ');

	const { rows: categories = [] } = await knex.raw(
		`select 
			pc.*, 
			COALESCE(
				json_agg(
					json_build_object(${packItemJson})
					ORDER BY pi.pack_item_index::NUMERIC
				) FILTER (WHERE pi.pack_item_id IS NOT NULL),
				'[]'::json
			) as pack_items 
			from pack_category pc
			left outer join pack_item pi on pi.pack_category_id = pc.pack_category_id	
		where pc.user_id = ? and pc.pack_id = ?
		group by pc.pack_category_id
		order by pc.pack_category_index::NUMERIC`,
		[userId, packId],
	);

	return { pack: pack || null, categories };
}

async function getPackList(req: Request, res: Response) {
	try {
		const { userId } = req;
		const packList = await getAvailablePacks(userId);

		return successResponse(res, { packList });
	} catch (err) {
		logError('Getting pack list failed', err, { userId: req?.userId });
		return internalError(res, 'There was an error getting your pack list.');
	}
}

async function addNewPack(req: Request, res: Response) {
	const errorMessage = 'There was an error adding a new pack.';
	try {
		const { userId } = req;
		const newPack = await createNewPack(userId);

		const newPackError = isError(newPack);
		if (newPackError) return internalError(res, errorMessage);

		const { pack, categories } = newPack;

		logger.info('Pack created successfully', {
			userId: req.userId,
			packId: pack.pack_id,
			packName: pack.pack_name,
			timestamp: new Date(),
		});

		return successResponse(res, { pack, categories });
	} catch (err) {
		logError('New pack creation failed', err, { userId: req?.userId });
		return internalError(res, errorMessage);
	}
}

async function createNewPack(userId: string) {
	// Calculate index for new pack (append to end of user's pack list)
	const packIndex = await getNextAppendIndex(Tables.Pack, 'pack_index', {
		user_id: userId,
	});

	const trx = await knex.transaction();
	try {
		const [pack] = await trx(Tables.Pack)
			.insert({
				user_id: userId,
				pack_name: 'New Pack',
				pack_index: packIndex,
			})
			.returning(packFields);

		const categories = await trx(Tables.PackCategory)
			.insert({
				user_id: userId,
				pack_id: pack.pack_id,
				pack_category_name: '',
				pack_category_index: DEFAULT_INCREMENT.toString(),
				pack_category_color: DEFAULT_PALETTE_COLOR,
			})
			.returning(packCategoryFields);

		const packItems = await trx(Tables.PackItem)
			.insert({
				user_id: userId,
				pack_id: pack.pack_id,
				pack_category_id: categories[0].pack_category_id,
				pack_item_name: '',
				pack_item_index: DEFAULT_INCREMENT.toString(),
			})
			.returning(packItemFields);

		categories[0].pack_items = packItems;

		await trx.commit();
		return { pack, categories };
	} catch (err) {
		await trx.rollback();
		throw new Error('There was an error creating a new pack.');
	}
}

async function importNewPack(req: ValidatedRequest<PackMigration>, res: Response) {
	const importErrorMessage = 'There was an error importing your pack.';
	try {
		const { userId } = req;
		const { pack_url, palette_list } = req.validatedBody;
		const importedPack = await packScraper(pack_url);

		// handle error
		const isPackError = isError(importedPack);
		if (isPackError) {
			logger.warn('Pack import failed - invalid pack data', {
				userId,
				packUrl: pack_url,
				error: 'Pack scraper returned error or invalid data',
				scrapedData: importedPack,
			});
			return badRequest(res, importErrorMessage);
		}

		// save new pack to db
		const { pack_name, pack_description, pack_categories } = importedPack;

		// Calculate index for new imported pack (append to end of user's pack list)
		const packIndex = await getNextAppendIndex(Tables.Pack, 'pack_index', {
			user_id: userId,
		});

		const trx = await knex.transaction();
		try {
			// insert pack
			const [{ pack_id }] = await trx(Tables.Pack)
				.insert({
					user_id: userId,
					pack_name,
					pack_description,
					pack_index: packIndex,
				})
				.returning('pack_id');

			// insert categories and pack items sequentially
			for (const category of pack_categories) {
				const { pack_category_name, pack_category_index, pack_items } = category;

				// get theme color based on index
				const themeColor = palette_list?.[pack_category_index % palette_list.length];

				// assign provided palette or default
				const pack_category_color = isError(themeColor)
					? DEFAULT_PALETTE_COLOR
					: themeColor;

				// insert pack category
				const [{ pack_category_id }] = await trx(Tables.PackCategory)
					.insert({
						user_id: userId,
						pack_id,
						pack_category_name,
						pack_category_index,
						pack_category_color,
					})
					.returning('pack_category_id');

				// insert pack items
				if (pack_items.length > 0) {
					const packItemsWithIds = pack_items.map((item) => ({
						...item,
						user_id: userId,
						pack_id,
						pack_category_id,
					}));
					await trx(Tables.PackItem).insert(packItemsWithIds);
				}
			}

			await trx.commit();
		} catch (error) {
			await trx.rollback();
			throw new Error('Failed to import pack');
		}

		logger.info('User imported external pack successfully', {
			userId,
			packUrl: pack_url,
		});

		return successResponse(res, null, 'Pack imported successfully');
	} catch (err) {
		logError("Importing user's external pack failed", err, {
			userId: req.userId,
			packUrl: req.validatedBody?.pack_url,
		});
		return internalError(res, importErrorMessage);
	}
}

async function uploadPackPhoto(req: Request, res: Response) {
	try {
		const { userId } = req;
		const { packId } = req.params;

		const s3Key = (req.file as MulterS3File)?.key;
		const defaultPosition = { x: 0, y: 0, zoom: 1.0 };
		const newPackPhotoUrl = createCloudfrontUrlForPhoto(s3Key, 'packPhotoBucket');

		// check for previous pack photo url
		const { pack_photo_url: prevPackPhotoUrl } = await knex(Tables.Pack)
			.select('pack_photo_url')
			.where({ user_id: userId, pack_id: packId })
			.first();

		// Delete previous pack photo from S3
		if (prevPackPhotoUrl) await s3DeletePhoto(prevPackPhotoUrl);

		// Update pack with new S3 URL and positioning data
		await knex(Tables.Pack)
			.update({
				pack_photo_url: newPackPhotoUrl,
				pack_photo_s3_key: s3Key,
				pack_photo_position: defaultPosition,
			})
			.where({ user_id: userId, pack_id: packId });

		return successResponse(res, { packPhotoUrl: newPackPhotoUrl }, 'Pack photo uploaded successfully');
	} catch (err) {
		logError('Upload pack photo failed', err, {
			userId: req.userId,
			packId: req.params?.packId,
			// @ts-expect-error: key value exists for File type
			file: req.file?.key,
		});
		return errorResponse(
			res,
			HTTP_STATUS.INTERNAL_SERVER_ERROR,
			'There was an error uploading your pack photo.',
			ErrorCode.FILE_UPLOAD_ERROR,
		);
	}
}

async function deletePackPhoto(req: Request, res: Response) {
	try {
		const { userId } = req;
		const { packId } = req.params;

		const { pack_photo_url } = await knex(Tables.Pack)
			.select('pack_photo_url')
			.where({ user_id: userId, pack_id: packId })
			.first();

		// Delete from S3
		await s3DeletePhoto(pack_photo_url);

		// Delete from DB
		await knex(Tables.Pack)
			.update({
				pack_photo_url: null,
				pack_photo_s3_key: null,
				pack_photo_position: null,
			})
			.where({ user_id: userId, pack_id: packId });

		return successResponse(res, null, 'Pack photo deleted successfully');
	} catch (err) {
		logError('Delete pack photo failed', err, {
			userId: req.userId,
			packId: req.params.packId,
		});
		return errorResponse(
			res,
			HTTP_STATUS.INTERNAL_SERVER_ERROR,
			'There was an error deleting your pack photo.',
			ErrorCode.FILE_UPLOAD_ERROR,
		);
	}
}

async function editPack(req: ValidatedRequest<PackUpdate>, res: Response) {
	try {
		const { userId } = req;
		const { packId } = req.params;

		if (hasEmptyValidatedBody(req)) {
			return badRequest(res, NO_VALID_FIELDS_MESSAGE);
		}

		const [updatedPack] = await knex(Tables.Pack)
			.update(req.validatedBody)
			.where({ user_id: userId, pack_id: packId })
			.returning(packFields);

		if (!updatedPack) {
			return notFound(res, 'Pack not found.');
		}

		return successResponse(res, updatedPack, 'Pack updated successfully');
	} catch (err) {
		return internalError(res, 'There was an error editing your pack.');
	}
}

async function movePack(req: ValidatedRequest<PackMove>, res: Response) {
	try {
		const { userId } = req;
		const { packId } = req.params;
		const { prev_pack_index, next_pack_index } = req.validatedBody;

		const { newIndex, rebalanced } = await moveWithFractionalIndex(
			Tables.Pack,
			'pack_index',
			'pack_id',
			packId,
			prev_pack_index,
			next_pack_index,
			{ user_id: userId }, // WHERE conditions
		);

		return successResponse(
			res,
			{
				packId,
				newIndex,
				rebalanced,
			},
			'Pack moved successfully',
		);
	} catch (err) {
		return internalError(res, 'There was an error changing your pack order.');
	}
}

async function deletePack(req: Request, res: Response) {
	try {
		const { userId } = req;
		const { packId } = req.params;

		// Get all items from the pack to move to gear closet
		const packItems = await knex(Tables.PackItem)
			.select(`${Tables.PackItem}.*`)
			.join(
				Tables.PackCategory,
				`${Tables.PackItem}.pack_category_id`,
				`${Tables.PackCategory}.pack_category_id`,
			)
			.where({ [`${Tables.PackItem}.user_id`]: userId, [`${Tables.PackItem}.pack_id`]: packId })
			.orderByRaw(
				`${Tables.PackCategory}.pack_category_index::NUMERIC, ${Tables.PackItem}.pack_item_index::NUMERIC`,
			);

		await bulkMoveToGearCloset(packItems, userId);

		// DELETE ON CASCADE: pack -> pack_category -> pack_item
		await knex(Tables.Pack).del().where({ user_id: userId, pack_id: packId });

		//if no packs left, create default pack
		const response = await knex(Tables.Pack)
			.select('pack_id')
			.where({ user_id: userId })
			.first();
		if (!response) await createNewPack(userId);

		return successResponse(res, { deletedPackId: packId }, 'Pack deleted successfully');
	} catch (err) {
		return internalError(res, 'There was an error deleting your pack.');
	}
}

async function deletePackAndItems(req: Request, res: Response) {
	try {
		const { userId } = req;
		const { packId } = req.params;

		// DELETE ON CASCADE: pack -> pack_category -> pack_item
		await knex(Tables.Pack).del().where({ user_id: userId, pack_id: packId });

		// if no packs left, ensure user has default pack
		const response = await knex(Tables.Pack)
			.select('pack_id')
			.where({ user_id: userId })
			.first();
		if (!response) await createNewPack(userId);

		return successResponse(
			res,
			{ deletedPackId: packId },
			'Pack and items deleted successfully',
		);
	} catch (err) {
		return internalError(res, 'There was an error deleting your pack.');
	}
}

async function addPackItem(req: ValidatedRequest<PackItemCreate>, res: Response) {
	try {
		const { userId } = req;
		const { pack_id, pack_category_id } = req.validatedBody;

		// Calculate index for new item
		const pack_item_index = await getNextAppendIndex(Tables.PackItem, 'pack_item_index', {
			user_id: userId,
			pack_id,
			pack_category_id,
		});

		const [packItem] =
			(await knex(Tables.PackItem)
				.insert({
					user_id: userId,
					pack_id,
					pack_category_id,
					pack_item_name: '',
					pack_item_index,
				})
				.returning(packItemFields)) || [];

		return successResponse(res, { packItem }, 'Pack item added successfully');
	} catch (err) {
		return internalError(res, 'There was an error adding a new pack item.');
	}
}

async function editPackItem(req: ValidatedRequest<PackItemUpdate>, res: Response) {
	try {
		const { userId } = req;
		const { packItemId } = req.params;

		if (hasEmptyValidatedBody(req)) {
			return badRequest(res, NO_VALID_FIELDS_MESSAGE);
		}

		const [updatedItem = {}] = await knex(Tables.PackItem)
			.update(req.validatedBody)
			.where({ pack_item_id: packItemId, user_id: userId })
			.returning(packItemFields);

		return successResponse(res, updatedItem, 'Pack item updated successfully');
	} catch (err) {
		return internalError(res, 'There was an error saving your pack item.');
	}
}

async function movePackItem(req: ValidatedRequest<PackItemMove>, res: Response) {
	try {
		const { userId } = req;
		const { packItemId } = req.params;

		const { pack_category_id, prev_pack_category_id, prev_item_index, next_item_index } =
			req.validatedBody;

		const { newIndex, rebalanced } = await moveWithFractionalIndex(
			Tables.PackItem,
			'pack_item_index',
			'pack_item_id',
			packItemId,
			prev_item_index,
			next_item_index,
			{ user_id: userId, pack_category_id: prev_pack_category_id }, // WHERE conditions - use PREVIOUS category to find the item
			{ pack_category_id }, // Additional fields to update (can change category on drag/drop)
		);

		return successResponse(
			res,
			{
				newIndex,
				rebalanced,
				categoryChanged: prev_pack_category_id !== pack_category_id,
			},
			'Pack item moved successfully',
		);
	} catch (err) {
		logError('Move pack item failed', err, {
			userId: req.userId,
			body: req.validatedBody,
		});
		return internalError(res, 'There was an error moving your pack item.');
	}
}

async function moveItemToCloset(req: Request, res: Response) {
	try {
		const { userId } = req;
		const { packItemId } = req.params;

		// Calculate index for item moving to gear closet
		const newGearClosetIndex = await getNextAppendIndex(Tables.PackItem, 'pack_item_index', {
			user_id: userId,
			pack_id: null,
			pack_category_id: null,
		});

		await knex(Tables.PackItem)
			.update({
				pack_id: null,
				pack_category_id: null,
				pack_item_index: newGearClosetIndex,
			})
			.where({ user_id: userId, pack_item_id: packItemId });

		return successResponse(res, null, 'Item moved to gear closet successfully');
	} catch (err) {
		return internalError(res, 'There was an error moving your item to your gear closet.');
	}
}

async function deletePackItem(req: Request, res: Response) {
	try {
		const { userId } = req;
		const { packItemId } = req.params;

		await knex(Tables.PackItem).delete().where({ user_id: userId, pack_item_id: packItemId });

		return successResponse(res, null, 'Pack item deleted successfully');
	} catch (err) {
		return internalError(res, 'There was an error deleting your pack item.');
	}
}

async function addPackCategory(req: ValidatedRequest<PackCategoryCreate>, res: Response) {
	try {
		const { userId } = req;
		const { packId } = req.params;
		const { category_color } = req.validatedBody;

		// Calculate index for new category
		const packCategoryIndex = await getNextAppendIndex(
			Tables.PackCategory,
			'pack_category_index',
			{ user_id: userId, pack_id: packId },
		);

		const [packCategory] = await knex(Tables.PackCategory)
			.insert({
				pack_category_name: '',
				user_id: userId,
				pack_id: packId,
				pack_category_index: packCategoryIndex,
				pack_category_color: category_color,
			})
			.returning(packCategoryFields);

		// add default pack item (can be default index for first item)
		const [packItem] = await knex(Tables.PackItem)
			.insert({
				user_id: userId,
				pack_id: packId,
				pack_category_id: packCategory.pack_category_id,
				pack_item_name: '',
				pack_item_index: DEFAULT_INCREMENT.toString(),
			})
			.returning(packItemFields);

		packCategory.pack_items = [packItem];

		return successResponse(res, { packCategory }, 'Pack category added successfully');
	} catch (err) {
		return internalError(res, 'There was an error adding a new category.');
	}
}

async function editPackCategory(
	req: ValidatedRequest<PackCategoryUpdate>,
	res: Response,
) {
	try {
		const { userId } = req;
		const { categoryId } = req.params;

		if (hasEmptyValidatedBody(req)) {
			return badRequest(res, NO_VALID_FIELDS_MESSAGE);
		}

		await knex(Tables.PackCategory)
			.update(req.validatedBody)
			.where({ user_id: userId, pack_category_id: categoryId });

		return successResponse(res, null, 'Pack category updated successfully');
	} catch (err) {
		return internalError(res, 'There was an error editing your pack category.');
	}
}

async function movePackCategory(req: ValidatedRequest<PackCategoryMove>, res: Response) {
	try {
		const { userId } = req;
		const { categoryId } = req.params;
		const { prev_category_index, next_category_index } = req.validatedBody;

		const { newIndex, rebalanced } = await moveWithFractionalIndex(
			Tables.PackCategory,
			'pack_category_index',
			'pack_category_id',
			categoryId,
			prev_category_index,
			next_category_index,
			{ user_id: userId }, // WHERE conditions
		);

		return successResponse(
			res,
			{
				newIndex,
				rebalanced,
			},
			'Pack category moved successfully',
		);
	} catch (err) {
		logError('Move pack category failed', err, {
			userId: req.userId,
			body: req.validatedBody,
		});
		return internalError(res, 'There was an error changing your pack order.');
	}
}

async function moveCategoryToCloset(req: Request, res: Response) {
	try {
		const { userId } = req;
		const { categoryId } = req.params;

		// Get all items from the category to move to gear closet
		const categoryItems = await knex(Tables.PackItem)
			.select('*')
			.where({ user_id: userId, pack_category_id: categoryId })
			.orderByRaw('pack_item_index::NUMERIC');

		// Bulk move all category items to gear closet
		await bulkMoveToGearCloset(categoryItems, userId);

		await deleteCategory(userId, categoryId);

		return successResponse(
			res,
			{ deletedId: categoryId },
			'Category moved to gear closet successfully',
		);
	} catch (err) {
		return internalError(res, 'There was an error deleting your category.');
	}
}

async function deleteCategoryAndItems(req: Request, res: Response) {
	try {
		const { userId } = req;
		const { categoryId } = req.params;

		const trx = await knex.transaction();
		try {
			await trx(Tables.PackItem)
				.del()
				.where({ user_id: userId, pack_category_id: categoryId });
			await trx(Tables.PackCategory)
				.del()
				.where({ user_id: userId, pack_category_id: categoryId });
			await trx.commit();
		} catch (error) {
			await trx.rollback();
			throw new Error('Failed to delete category and items');
		}

		return successResponse(
			res,
			{ deletedId: categoryId },
			'Category and items deleted successfully',
		);
	} catch (err) {
		return internalError(res, 'There was an error deleting your pack items.');
	}
}

async function getAvailablePacks(userId: string) {
	try {
		const { rows = [] } = await knex.raw(
			`select 
			pack.pack_id, pack_name, pack_index,
			coalesce(array_remove(array_agg(to_jsonb(pc) order by pc.pack_category_index::NUMERIC), NULL), '{}') as pack_categories from pack
			left outer join pack_category pc on pc.pack_id = pack.pack_id	
		where pack.user_id = ?
		group by pack.pack_id
		order by pack.pack_index::NUMERIC`,
			[userId],
		);
		return rows;
	} catch (err) {
		return new Error('Error getting available packs.');
	}
}

async function deleteCategory(user_id: string, pack_category_id: number | string) {
	try {
		// Delete ON CASCADE: pack_category -> pack_item
		await knex(Tables.PackCategory).del().where({ user_id, pack_category_id });
	} catch (err) {
		throw new Error('Failed to delete category');
	}
}

export default {
	getDefaultPack,
	getPack,
	getPackList,
	addNewPack,
	importNewPack,
	uploadPackPhoto,
	editPack,
	movePack,
	deletePackPhoto,
	deletePack,
	deletePackAndItems,
	addPackItem,
	editPackItem,
	movePackItem,
	moveItemToCloset,
	deletePackItem,
	deleteCategoryAndItems,
	addPackCategory,
	editPackCategory,
	movePackCategory,
	moveCategoryToCloset,
};
