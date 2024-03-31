import { Knex } from 'knex';
import { tables as t } from '../../../knexfile.js';
import {
	mockUser,
	mockPack,
	mockPack2,
	mockPackCategory,
	mockPackItems,
	mockGearClosetItems,
} from '../mock/mockData.js';
import { type MockPackItem } from '../../types/packs/packTypes.js';

const { first_name, last_name, email, userId: user_id } = mockUser;

export async function seed(knex: Knex): Promise<void> {
	await knex(t.user).del();
	await knex(t.pack).del();
	await knex(t.packCategory).del();
	await knex(t.packItem).del();

	await knex(t.user).insert({ user_id, first_name, last_name, email }).returning('*');

	const [pack] = await knex(t.pack)
		.insert({ ...mockPack, user_id })
		.returning('*');

	const [packCategory] = await knex(t.packCategory)
		.insert({
			...mockPackCategory,
			user_id,
			pack_id: pack.packId,
			pack_category_color: 'primary',
		})
		.returning('*');

	const packItemsWithIds = mockPackItems.map((item: MockPackItem) => {
		item['pack_id'] = pack.packId;
		item['pack_category_id'] = packCategory.packCategoryId;
		return item;
	});

	await knex(t.packItem).insert([...packItemsWithIds, ...mockGearClosetItems]);

	await knex(t.pack)
		.insert({ ...mockPack2, user_id: user_id })
		.returning('*');
}
