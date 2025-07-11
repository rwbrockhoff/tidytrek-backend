import express from 'express';
import controller from './pack-controller.js';
import { s3UploadPhoto } from '../../utils/s3.js';
import { uploadRateLimit, importRateLimit } from '../../config/rate-limiting.js';
import { validateRequestBody as validate, withTypes } from '../../utils/validation.js';
import { 
	PackUpdateSchema, 
	PackImportSchema, 
	PackMoveSchema, 
	PackItemCreateSchema,
	PackItemUpdateSchema,
	PackItemMoveSchema,
	PackCategoryCreateSchema,
	PackCategoryUpdateSchema,
	PackCategoryMoveSchema,
	PackUpdate, 
	PackImport, 
	PackMove,
	PackItemCreate,
	PackItemUpdate,
	PackItemMove,
	PackCategoryCreate,
	PackCategoryUpdate,
	PackCategoryMove
} from './pack-schemas.js';

const router = express.Router();

router.get('/', controller.getDefaultPack);
router.get('/pack-list', controller.getPackList);
router.get('/:packId', controller.getPack);
router.post('/', controller.addNewPack);
router.post(
	'/:packId/pack-photo',
	uploadRateLimit,
	s3UploadPhoto('packPhotoBucket').single('packPhoto'),
	controller.uploadPackPhoto,
);
router.post('/import', importRateLimit, validate(PackImportSchema), withTypes<PackImport>(controller.importNewPack));
router.put('/:packId', validate(PackUpdateSchema), withTypes<PackUpdate>(controller.editPack));
router.put('/index/:packId', validate(PackMoveSchema), withTypes<PackMove>(controller.movePack));
router.delete('/:packId', controller.deletePack);
router.delete('/:packId/pack-photo', controller.deletePackPhoto);
router.delete('/items/:packId', controller.deletePackAndItems);
router.post('/pack-items', validate(PackItemCreateSchema), withTypes<PackItemCreate>(controller.addPackItem));
router.put('/pack-items/:packItemId', validate(PackItemUpdateSchema), withTypes<PackItemUpdate>(controller.editPackItem));
router.put('/pack-items/index/:packItemId', validate(PackItemMoveSchema), withTypes<PackItemMove>(controller.movePackItem));
router.put('/pack-items/closet/:packItemId', controller.moveItemToCloset);
router.delete('/pack-items/:packItemId', controller.deletePackItem);
router.post('/categories/:packId', validate(PackCategoryCreateSchema), withTypes<PackCategoryCreate>(controller.addPackCategory));
router.put('/categories/:categoryId', validate(PackCategoryUpdateSchema), withTypes<PackCategoryUpdate>(controller.editPackCategory));
router.put('/categories/index/:categoryId', validate(PackCategoryMoveSchema), withTypes<PackCategoryMove>(controller.movePackCategory));
router.delete('/categories/:categoryId', controller.moveCategoryToCloset);
router.delete('/categories/items/:categoryId', controller.deleteCategoryAndItems);

export default router;
