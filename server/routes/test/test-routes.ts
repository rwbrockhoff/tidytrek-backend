import express from 'express';
import { resetTestDatabase, resetPackData } from './test-controller.js';

const router = express.Router();

// Endpoints for resetting test database for E2E testing
router.post('/reset', resetTestDatabase);
router.post('/reset-packs', resetPackData);

export default router;
