import express from 'express';
import controller from './redirect-controller.js';
import { validateRequestBody as validate, withTypes } from '../../utils/validation.js';
import { RedirectRequestSchema, RedirectRequest } from './redirect-schemas.js';

const router = express.Router();

router.post('/', validate(RedirectRequestSchema), withTypes<RedirectRequest>(controller.handleRedirect));

export default router;