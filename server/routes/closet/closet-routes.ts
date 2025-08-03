import express from 'express';
import controller from './closet-controller.js';
import { validateRequestBody as validate, withTypes } from '../../utils/validation.js';
import {
	GearClosetItemUpdateSchema,
	GearClosetItemMoveSchema,
	MoveItemToPackSchema,
	GearClosetItemUpdate,
	GearClosetItemMove,
	MoveItemToPack,
} from './closet-schemas.js';

const router = express.Router();

router.get('/', controller.getGearCloset);
router.post('/items', controller.addGearClosetItem);
router.put('/items/:packItemId', validate(GearClosetItemUpdateSchema), withTypes<GearClosetItemUpdate>(controller.editGearClosetItem));
router.put('/items/index/:packItemId', validate(GearClosetItemMoveSchema), withTypes<GearClosetItemMove>(controller.moveGearClosetItem));
router.put('/packs/:packItemId', validate(MoveItemToPackSchema), withTypes<MoveItemToPack>(controller.moveItemToPack));
router.delete('/items/:packItemId', controller.deleteGearClosetItem);

export default router;
