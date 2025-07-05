import { Router } from 'express';

const router = Router();

// Route to test Sentry
router.get('/test-error', () => {
	throw new Error('Test error for Sentry');
});

export default router;
