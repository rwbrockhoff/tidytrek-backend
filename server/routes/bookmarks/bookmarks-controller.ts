import knex from '../../db/connection.js';
import { Tables } from '../../db/tables.js';
import { Request, Response } from 'express';
import {
	successResponse,
	internalError,
	badRequest,
} from '../../utils/error-response.js';
import { logError } from '../../config/logger.js';
import { ValidatedRequest } from '../../utils/validation.js';
import { AddBookmarkRequest } from './bookmarks-schemas.js';

async function getUserBookmarks(req: Request, res: Response) {
	try {
		const { userId } = req;

		const bookmarks = await knex(Tables.PackBookmarks)
			.join(Tables.Pack, `${Tables.PackBookmarks}.pack_id`, `${Tables.Pack}.pack_id`)
			.join(Tables.User, `${Tables.Pack}.user_id`, `${Tables.User}.user_id`)
			.join(Tables.UserProfile, `${Tables.User}.user_id`, `${Tables.UserProfile}.user_id`)
			.select(
				`${Tables.Pack}.pack_id`,
				`${Tables.Pack}.pack_name`,
				`${Tables.Pack}.pack_description`,
				`${Tables.Pack}.pack_photo_url`,
				`${Tables.Pack}.pack_views`,
				`${Tables.Pack}.pack_bookmark_count`,
				`${Tables.UserProfile}.username`,
				`${Tables.UserProfile}.trail_name`,
				`${Tables.PackBookmarks}.created_at as bookmarked_at`,
			)
			.where(`${Tables.PackBookmarks}.user_id`, userId)
			.where(`${Tables.Pack}.pack_public`, true)
			.orderBy(`${Tables.PackBookmarks}.created_at`, 'desc');

		return successResponse(res, { bookmarks });
	} catch (err) {
		logError('Get user bookmarks failed', err, { userId: req.userId });
		return internalError(res, 'There was an error getting your saved packs.');
	}
}

async function addBookmark(req: ValidatedRequest<AddBookmarkRequest>, res: Response) {
	try {
		const { userId } = req;
		const { pack_id } = req.validatedBody;

		const existingBookmark = await knex(Tables.PackBookmarks)
			.where({ user_id: userId, pack_id })
			.first();

		if (existingBookmark) {
			return badRequest(res, 'Pack is already bookmarked.');
		}

		await knex(Tables.PackBookmarks).insert({
			user_id: userId,
			pack_id,
		});

		return successResponse(res, null, 'Pack bookmarked successfully.');
	} catch (err) {
		logError('Add bookmark failed', err, { userId: req.userId });
		return internalError(res, 'There was an error bookmarking this pack.');
	}
}

async function deleteBookmark(req: ValidatedRequest<AddBookmarkRequest>, res: Response) {
	try {
		const { userId } = req;
		const { pack_id } = req.validatedBody;

		await knex(Tables.PackBookmarks).where({ user_id: userId, pack_id }).delete();

		return successResponse(res, null, 'Bookmark deleted successfully.');
	} catch (err) {
		logError('Delete bookmark failed', err, { userId: req.userId });
		return internalError(res, 'There was an error deleting this bookmark.');
	}
}

export default {
	getUserBookmarks,
	addBookmark,
	deleteBookmark,
};
