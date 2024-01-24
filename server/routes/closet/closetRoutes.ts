import express from 'express';
import closetController from './closetController.js';

const router = express.Router();

router.get('/', closetController.getGearCloset);

export default router;
