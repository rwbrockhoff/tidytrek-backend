import db from '../../db/connection.js';
import { Tables } from '../../db/tables.js';
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
import { s3DeletePhoto } from '../../utils/s3.js';
import {
	createQuickPhotoUrl,
	updateToOptimizedPhoto,
} from '../../utils/photo-processing.js';
import { isError } from '../../utils/validation.js';
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
} from './pack-schemas.js';

import {
	getPackWithCategories,
	createNewPack,
	importPackFromUrl,
	movePackInList,
	deletePackAndMoveItems,
	deletePackCompletely,
	createPackItem,
	movePackItemBetweenCategories,
	moveItemToGearCloset,
	createPackCategory,
	movePackCategory as movePackCategoryService,
	moveCategoryItemsToCloset,
	deleteCategoryAndAllItems,
	getAvailablePacks as getAvailablePacksService,
} from './pack-service.js';

async function getDefaultPack(req: Request, res: Response) {
	try {
		const { userId } = req;

		const pack = await db<PackUpdate>('pack')
			.select(packFields)
			.where('user_id', userId)
			.orderByRaw('pack_index::NUMERIC')
			.first();

		if (pack) {
			const { categories } = await getPackWithCategories(userId, pack.pack_id!);
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

		const { pack, categories } = await getPackWithCategories(userId, Number(packId));

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

async function getPackList(req: Request, res: Response) {
	try {
		const { userId } = req;
		const packList = await getAvailablePacksService(userId);

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
		});

		return successResponse(res, { pack, categories });
	} catch (err) {
		logError('New pack creation failed', err, { userId: req?.userId });
		return internalError(res, errorMessage);
	}
}

async function importNewPack(req: ValidatedRequest<PackMigration>, res: Response) {
	const importErrorMessage = 'There was an error importing your pack.';
	try {
		const { userId } = req;
		const { pack_url, palette_list } = req.validatedBody;

		await importPackFromUrl(userId, pack_url, palette_list);

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
		const quickPhotoUrl = createQuickPhotoUrl(s3Key, 'packPhotoBucket');

		// check for previous pack photo url
		const packPhotoResult = await db(Tables.Pack)
			.select('pack_photo_url')
			.where('user_id', userId)
			.where('pack_id', packId)
			.first();
		const prevPackPhotoUrl = packPhotoResult?.pack_photo_url;

		// Delete previous pack photo from S3
		if (prevPackPhotoUrl) await s3DeletePhoto(prevPackPhotoUrl);

		await db(Tables.Pack)
			.update({
				pack_photo_url: quickPhotoUrl,
				pack_photo_s3_key: s3Key,
			})
			.where('user_id', userId)
			.where('pack_id', packId);

		const response = successResponse(
			res,
			{ packPhotoUrl: quickPhotoUrl },
			'Pack photo uploaded successfully',
		);

		setImmediate(async () => {
			try {
				await updateToOptimizedPhoto(
					Tables.Pack,
					'pack_photo_url',
					{ user_id: userId, pack_id: packId },
					s3Key,
					'packPhotoBucket',
				);
			} catch (optimizationError) {
				logError('Background photo optimization failed', optimizationError, {
					userId,
					packId,
					s3Key,
				});
			}
		});

		return response;
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

		const packPhotoResult = await db(Tables.Pack)
			.select('pack_photo_url')
			.where('user_id', userId)
			.where('pack_id', packId)
			.first();
		const pack_photo_url = packPhotoResult?.pack_photo_url;

		// Delete from S3
		if (pack_photo_url) {
			await s3DeletePhoto(pack_photo_url);
		}

		// Delete from DB
		await db(Tables.Pack)
			.update({
				pack_photo_url: null,
				pack_photo_s3_key: null,
				pack_photo_position: null,
			})
			.where('user_id', userId)
			.where('pack_id', packId);

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

		const updateData = Object.fromEntries(
			Object.entries(req.validatedBody).filter(([, value]) => value !== null),
		);

		const [updatedPack] = await db(Tables.Pack)
			.update(updateData)
			.where('user_id', userId)
			.where('pack_id', packId)
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

		const result = await movePackInList(userId, packId, prev_pack_index, next_pack_index);

		return successResponse(res, result, 'Pack moved successfully');
	} catch (err) {
		return internalError(res, 'There was an error changing your pack order.');
	}
}

async function deletePack(req: Request, res: Response) {
	try {
		const { userId } = req;
		const { packId } = req.params;

		const result = await deletePackAndMoveItems(userId, packId);

		return successResponse(res, result, 'Pack deleted successfully');
	} catch (err) {
		return internalError(res, 'There was an error deleting your pack.');
	}
}

async function deletePackAndItems(req: Request, res: Response) {
	try {
		const { userId } = req;
		const { packId } = req.params;

		const result = await deletePackCompletely(userId, packId);

		return successResponse(res, result, 'Pack and items deleted successfully');
	} catch (err) {
		return internalError(res, 'There was an error deleting your pack.');
	}
}

async function addPackItem(req: ValidatedRequest<PackItemCreate>, res: Response) {
	try {
		const { userId } = req;
		const { pack_id, pack_category_id } = req.validatedBody;

		const result = await createPackItem(userId, pack_id, pack_category_id);

		return successResponse(res, result, 'Pack item added successfully');
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

		const [updatedItem = {}] = await db(Tables.PackItem)
			.update(req.validatedBody)
			.where('pack_item_id', packItemId)
			.where('user_id', userId)
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

		const result = await movePackItemBetweenCategories(
			userId,
			packItemId,
			pack_category_id,
			prev_pack_category_id,
			prev_item_index,
			next_item_index,
		);

		return successResponse(res, result, 'Pack item moved successfully');
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

		await moveItemToGearCloset(userId, packItemId);

		return successResponse(res, null, 'Item moved to gear closet successfully');
	} catch (err) {
		return internalError(res, 'There was an error moving your item to your gear closet.');
	}
}

async function deletePackItem(req: Request, res: Response) {
	try {
		const { userId } = req;
		const { packItemId } = req.params;

		await db(Tables.PackItem)
			.delete()
			.where('user_id', userId)
			.where('pack_item_id', packItemId);

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

		const result = await createPackCategory(userId, packId, category_color);

		return successResponse(res, result, 'Pack category added successfully');
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

		await db(Tables.PackCategory)
			.update(req.validatedBody)
			.where('user_id', userId)
			.where('pack_category_id', categoryId);

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

		const result = await movePackCategoryService(
			userId,
			categoryId,
			prev_category_index,
			next_category_index,
		);

		return successResponse(res, result, 'Pack category moved successfully');
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

		const result = await moveCategoryItemsToCloset(userId, categoryId);

		return successResponse(res, result, 'Category moved to gear closet successfully');
	} catch (err) {
		return internalError(res, 'There was an error deleting your category.');
	}
}

async function deleteCategoryAndItems(req: Request, res: Response) {
	try {
		const { userId } = req;
		const { categoryId } = req.params;

		const result = await deleteCategoryAndAllItems(userId, categoryId);

		return successResponse(res, result, 'Category and items deleted successfully');
	} catch (err) {
		return internalError(res, 'There was an error deleting your pack items.');
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
