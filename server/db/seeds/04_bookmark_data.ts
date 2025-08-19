import { Knex } from 'knex';
import { Tables } from '../tables.js';
import { e2eTestUser } from '../test/test-data.js';
import { mockUser, mockPrivateUser } from '../mock/mock-data.js';

export async function seed(knex: Knex): Promise<void> {
	await knex(Tables.PackBookmarks).del();

	const mockUserPacks = await knex(Tables.Pack)
		.select('pack_id')
		.where('user_id', mockUser.userId)
		.limit(1);

	const privateUserPacks = await knex(Tables.Pack)
		.select('pack_id')
		.where('user_id', mockPrivateUser.userId)
		.limit(1);

	const bookmarks = [];

	if (mockUserPacks.length > 0) {
		bookmarks.push({
			user_id: e2eTestUser.userId,
			pack_id: mockUserPacks[0].pack_id,
		});
	}

	if (privateUserPacks.length > 0) {
		bookmarks.push({
			user_id: e2eTestUser.userId,
			pack_id: privateUserPacks[0].pack_id,
		});
	}

	if (bookmarks.length > 0) {
		await knex(Tables.PackBookmarks).insert(bookmarks);

		for (const bookmark of bookmarks) {
			await knex(Tables.Pack)
				.where({ pack_id: bookmark.pack_id })
				.increment('pack_bookmark_count', 1);
		}
	}
}