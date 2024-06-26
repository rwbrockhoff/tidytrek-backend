import express from 'express';
import guestsController from './guestsController.js';

const router = express.Router();

router.get('/pack/:packId', guestsController.getPack);
router.get('/user/:username', guestsController.getUserProfile);

export default router;
