import { Knex } from 'knex';
import bcrypt from 'bcrypt';
import {
	mockUser,
	mockPack,
	mockPack2,
	mockPackCategory,
	mockPackItems,
} from '../../utils/testUtils.js';
import { PackItem } from '../../types/packs/packTypes.js';

const { name, email, password, username } = mockUser;
const mockUserHashedPassword = await bcrypt.hash(password, 10);

export async function seed(knex: Knex): Promise<void> {
	await knex('users').del();
	await knex('packs').del();
	await knex('pack_categories').del();
	await knex('pack_items').del();

	const [dummyUser] = await knex('users')
		.insert({ name, email, password: mockUserHashedPassword, username })
		.returning('*');

	const [pack] = await knex('packs')
		.insert({ ...mockPack, user_id: dummyUser.userId })
		.returning('*');

	const [packCategory] = await knex('pack_categories')
		.insert({
			...mockPackCategory,
			user_id: dummyUser.userId,
			pack_id: pack.packId,
		})
		.returning('*');

	const packItemsWithIds = mockPackItems.map((item: PackItem) => {
		item['user_id'] = dummyUser.userId;
		item['pack_id'] = pack.packId;
		item['pack_category_id'] = packCategory.packCategoryId;
		return item;
	});

	await knex('pack_items').insert(packItemsWithIds);

	await knex('packs')
		.insert({ ...mockPack2, user_id: dummyUser.userId })
		.returning('*');

	await knex('users').insert({
		name: 'Justin Hill',
		email: 'jhill@tidytrek.co',
		password: mockUserHashedPassword,
	});
}
