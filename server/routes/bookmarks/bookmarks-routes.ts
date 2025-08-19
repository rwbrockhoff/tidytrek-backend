import express from 'express';
import controller from './bookmarks-controller.js';

const router = express.Router();

router.get('/', controller.getUserBookmarks);

export default router;
