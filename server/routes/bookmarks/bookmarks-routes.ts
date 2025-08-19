import express from 'express';
import controller from './bookmarks-controller.js';
import { validateRequestBody as validate } from '../../middleware/validation-middleware.js';
import { withTypes } from '../../utils/validation.js';
import { AddBookmarkSchema, AddBookmarkRequest } from './bookmarks-schemas.js';

const router = express.Router();

router.get('/', controller.getUserBookmarks);
router.post('/', validate(AddBookmarkSchema), withTypes<AddBookmarkRequest>(controller.addBookmark));

export default router;
