import { Knex } from 'knex';
import { tables as t } from '../../../knexfile.js';
import bcrypt from 'bcrypt';
import {
	mockUser,
	mockPack,
	mockPack2,
	mockPackCategory,
	mockPackItems,
	mockGearClosetItems,
} from '../mock/mockData.js';
import { PackItem } from '../../types/packs/packTypes.js';

const { first_name, last_name, email, password } = mockUser;
const mockUserHashedPassword = await bcrypt.hash(password, 10);

export async function seed(knex: Knex): Promise<void> {
	await knex(t.user).del();
	await knex(t.pack).del();
	await knex(t.packCategory).del();
	await knex(t.packItem).del();

	const [dummyUser] = await knex(t.user)
		.insert({ first_name, last_name, email, password: mockUserHashedPassword })
		.returning('*');

	const [pack] = await knex(t.pack)
		.insert({ ...mockPack, user_id: dummyUser.userId })
		.returning('*');

	const [packCategory] = await knex(t.packCategory)
		.insert({
			...mockPackCategory,
			user_id: dummyUser.userId,
			pack_id: pack.packId,
			pack_category_color: 'primary',
		})
		.returning('*');

	const packItemsWithIds = mockPackItems.map((item: PackItem) => {
		item['user_id'] = dummyUser.userId;
		item['pack_id'] = pack.packId;
		item['pack_category_id'] = packCategory.packCategoryId;
		return item;
	});

	const closetItemsWithIds = mockGearClosetItems.map((item: PackItem) => {
		item['user_id'] = dummyUser.userId;
		return item;
	});

	await knex(t.packItem).insert([...packItemsWithIds, ...closetItemsWithIds]);

	await knex(t.pack)
		.insert({ ...mockPack2, user_id: dummyUser.userId })
		.returning('*');
}
