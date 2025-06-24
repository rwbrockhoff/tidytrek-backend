import express from 'express';
import { resetTestDatabase } from './testController.js';

const router = express.Router();

// POST /api/test/reset - Reset test database
router.post('/reset', resetTestDatabase);

export default router;