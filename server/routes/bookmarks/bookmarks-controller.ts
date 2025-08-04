import knex from '../../db/connection.js';
import { Tables } from '../../db/tables.js';
import { Request, Response } from 'express';
import {
	successResponse,
	badRequest,
	internalError,
	conflict,
	notFound,
} from '../../utils/error-response.js';
import { logError } from '../../config/logger.js';
import { ValidatedRequest } from '../../utils/validation.js';
import { AddPackBookmark } from './bookmarks-schemas.js';

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
		return internalError(res, 'There was an error getting your bookmarked packs.');
	}
}

async function bookmarkPack(req: ValidatedRequest<AddPackBookmark>, res: Response) {
	try {
		const { userId } = req;
		const { pack_id } = req.validatedBody;

		const pack = await knex(Tables.Pack)
			.select('pack_id', 'user_id', 'pack_public')
			.where({ pack_id })
			.first();

		// Pack must exist, be public, and from another user
		if (!pack) return notFound(res, 'Pack not found.');

		if (!pack.pack_public) return badRequest(res, 'Cannot bookmark private packs.');

		if (pack.user_id === userId) return badRequest(res, 'Cannot bookmark your own pack.');

		// Handle bookmark already exists
		const existingBookmark = await knex(Tables.PackBookmarks)
			.where({ user_id: userId, pack_id })
			.first();

		if (existingBookmark) return conflict(res, 'Pack is already bookmarked.');

		// Save bookmark, increment user's bookmark count
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
			logError('Transaction failed during bookmark creation', error, {
				userId,
				pack_id,
			});
			return internalError(res, 'There was an error bookmarking this pack.');
		}

		return successResponse(res, { pack_id }, 'Pack bookmarked successfully');
	} catch (err) {
		logError('Bookmark pack failed', err, {
			userId: req.userId,
			packId: req.validatedBody?.pack_id,
		});
		return internalError(res, 'There was an error bookmarking this pack.');
	}
}

async function unbookmarkPack(req: Request, res: Response) {
	try {
		const { userId } = req;
		const { packId } = req.params;

		const existingBookmark = await knex(Tables.PackBookmarks)
			.where({ user_id: userId, pack_id: packId })
			.first();

		// Ensure bookmark exists so we can unbookmark it
		if (!existingBookmark) return notFound(res, 'Bookmark not found.');

		// Remove pack, and decrement user's bookmark count
		const trx = await knex.transaction();
		try {
			await trx(Tables.PackBookmarks).where({ user_id: userId, pack_id: packId }).del();

			await trx(Tables.Pack)
				.where({ pack_id: packId })
				.decrement('pack_bookmark_count', 1);

			await trx.commit();
		} catch (error) {
			await trx.rollback();
			logError('Transaction failed during bookmark removal', error, {
				userId,
				packId,
			});
			return internalError(res, 'There was an error removing this bookmark.');
		}

		return successResponse(res, { pack_id: packId }, 'Pack unbookmarked successfully');
	} catch (err) {
		logError('Unbookmark pack failed', err, {
			userId: req.userId,
			packId: req.params?.packId,
		});
		return internalError(res, 'There was an error removing this bookmark.');
	}
}

export default {
	getUserBookmarks,
	bookmarkPack,
	unbookmarkPack,
};
