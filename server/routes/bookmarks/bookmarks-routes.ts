import express from 'express';
import controller from './bookmarks-controller.js';
import { validateRequestBody as validate, withTypes } from '../../utils/validation.js';
import { AddPackBookmarkSchema, AddPackBookmark } from './bookmarks-schemas.js';

const router = express.Router();

router.get('/', controller.getUserBookmarks);
router.post('/', validate(AddPackBookmarkSchema), withTypes<AddPackBookmark>(controller.bookmarkPack));
router.delete('/:packId', controller.unbookmarkPack);

export default router;