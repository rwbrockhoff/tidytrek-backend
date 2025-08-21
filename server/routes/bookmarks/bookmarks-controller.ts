import knex from '../../db/connection.js';
import { Tables } from '../../db/tables.js';
import { Request, Response } from 'express';
import {
	successResponse,
	internalError,
	badRequest,
	conflict,
	notFound,
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
				'pack_name',
				'pack_description',
				'pack_photo_url',
				'username',
				'profile_photo_url',
			)
			.where(`${Tables.PackBookmarks}.user_id`, userId)
			.where(`${Tables.Pack}.pack_public`, true)
			.orderBy(`${Tables.PackBookmarks}.created_at`, 'desc');

		return successResponse(res, { bookmarks });
	} catch (err) {
		console.log(err);
		logError('Get user bookmarks failed', err, { userId: req.userId });
		return internalError(res, 'There was an error getting your saved packs.');
	}
}

async function addBookmark(req: ValidatedRequest<AddBookmarkRequest>, res: Response) {
	try {
		const { userId } = req;
		const { pack_id } = req.validatedBody;

		const pack = await knex(Tables.Pack)
			.select('pack_id', 'user_id', 'pack_public')
			.where({ pack_id })
			.first();

		if (!pack) return notFound(res, 'Pack not found.');
		if (!pack.pack_public) return badRequest(res, 'Cannot bookmark a private pack.');
		if (pack.user_id === userId) return badRequest(res, 'Cannot bookmark your own pack.');

		const existingBookmark = await knex(Tables.PackBookmarks)
			.where({ user_id: userId, pack_id })
			.first();

		if (existingBookmark) {
			return conflict(res, 'Pack is already bookmarked.');
		}

		const trx = await knex.transaction();
		try {
			await trx(Tables.PackBookmarks).insert({
				user_id: userId,
				pack_id,
			});

			await trx(Tables.Pack).where({ pack_id }).increment('pack_bookmark_count', 1);

			await trx.commit();
		} catch (error) {
			await trx.rollback();
			logError('Bookmark creation failed', error, { userId, pack_id });
			return internalError(res, 'There was an error bookmarking this pack.');
		}

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
