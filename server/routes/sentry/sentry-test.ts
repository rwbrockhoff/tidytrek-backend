import { Router } from 'express';

const router = Router();

// Route to test Sentry (enable Sentry in dev config to test this route)
router.get('/test-error', () => {
	throw new Error('Test error for Sentry');
});

export default router;
