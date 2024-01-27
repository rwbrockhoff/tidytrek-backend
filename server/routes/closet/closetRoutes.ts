import express from 'express';
import closetController from './closetController.js';

const router = express.Router();

router.get('/', closetController.getGearCloset);
router.post('/items', closetController.addGearClosetItem);
router.put('/items/:packItemId', closetController.editGearClosetItem);
router.put('/items/index/:packItemId', closetController.moveGearClosetItem);
router.put('/packs/:packItemId', closetController.moveItemToPack);
router.delete('/items/:packItemId', closetController.deleteGearClosetItem);

export default router;
