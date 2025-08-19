import express from 'express';
import controller from './authentication-controller.js';
import { validateRequestBody as validate } from '../../middleware/validation-middleware.js';
import { withTypes } from '../../utils/validation.js';
import { protectedRoute } from '../../middleware/auth-middleware.js';
import {
	RegisterSchema,
	LoginSchema,
	RegisterData,
	LoginData,
} from './authentication-schemas.js';

import { RequestHandler } from 'express';

export function createAuthRoutes(authRateLimit: RequestHandler) {
	const router = express.Router();

	router.get('/status', controller.getAuthStatus);
	router.post('/register', authRateLimit, validate(RegisterSchema), withTypes<RegisterData>(controller.register));
	router.post('/login', authRateLimit, validate(LoginSchema), withTypes<LoginData>(controller.login));
	router.post('/logout', controller.logout);
	router.delete('/account', protectedRoute, controller.deleteAccount);

	return router;
}
