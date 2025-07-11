import express from 'express';
import packController from './pack-controller.js';
import { s3UploadPhoto } from '../../utils/s3.js';
import { uploadRateLimit, importRateLimit } from '../../config/rate-limiting.js';
import { validateRequestBody as validate, withTypes } from '../../utils/validation.js';
import { PackUpdateSchema, PackImportSchema, PackMoveSchema, PackUpdate, PackImport, PackMove } from './pack-schemas.js';

const router = express.Router();

router.get('/', packController.getDefaultPack);
router.get('/pack-list', packController.getPackList);
router.get('/:packId', packController.getPack);
router.post('/', packController.addNewPack);
router.post(
	'/:packId/pack-photo',
	uploadRateLimit,
	s3UploadPhoto('packPhotoBucket').single('packPhoto'),
	packController.uploadPackPhoto,
);
router.post('/import', importRateLimit, validate(PackImportSchema), withTypes<PackImport>(packController.importNewPack));
router.put('/:packId', validate(PackUpdateSchema), withTypes<PackUpdate>(packController.editPack));
router.put('/index/:packId', validate(PackMoveSchema), withTypes<PackMove>(packController.movePack));
router.delete('/:packId', packController.deletePack);
router.delete('/:packId/pack-photo', packController.deletePackPhoto);
router.delete('/items/:packId', packController.deletePackAndItems);
router.post('/pack-items', packController.addPackItem);
router.put('/pack-items/:packItemId', packController.editPackItem);
router.put('/pack-items/index/:packItemId', packController.movePackItem);
router.put('/pack-items/closet/:packItemId', packController.moveItemToCloset);
router.delete('/pack-items/:packItemId', packController.deletePackItem);
router.post('/categories/:packId', packController.addPackCategory);
router.put('/categories/:categoryId', packController.editPackCategory);
router.put('/categories/index/:categoryId', packController.movePackCategory);
router.delete('/categories/:categoryId', packController.moveCategoryToCloset);
router.delete('/categories/items/:categoryId', packController.deleteCategoryAndItems);

export default router;
