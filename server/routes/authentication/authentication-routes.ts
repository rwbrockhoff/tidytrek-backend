import express from 'express';
import controller from './authentication-controller.js';
import { authRateLimit } from '../../config/rate-limiting.js';
import { validateRequestBody as validate } from '../../middleware/validation-middleware.js';
import { withTypes } from '../../utils/validation.js';
import {
	RegisterSchema,
	LoginSchema,
	RegisterData,
	LoginData,
} from './authentication-schemas.js';

const router = express.Router();

router.get('/status', controller.getAuthStatus);
router.post('/register', authRateLimit, validate(RegisterSchema), withTypes<RegisterData>(controller.register));
router.post('/login', authRateLimit, validate(LoginSchema), withTypes<LoginData>(controller.login));
router.post('/logout', controller.logout);
router.post('/refresh', controller.refreshSupabaseSession);
router.delete('/account', controller.deleteAccount);

export default router;
