import express from 'express';
import guestsController from './guestsController.js';

const router = express.Router();

router.get('/pack/:packId', guestsController.getPack);

export default router;
