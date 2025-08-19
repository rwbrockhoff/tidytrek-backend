import knex from '../../db/connection.js';
import { Tables } from '../../db/tables.js';
import { Request, Response } from 'express';
import { successResponse, internalError } from '../../utils/error-response.js';
import { logError } from '../../config/logger.js';

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

export default {
	getUserBookmarks,
};
