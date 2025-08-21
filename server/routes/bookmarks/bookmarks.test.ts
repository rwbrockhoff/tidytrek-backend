import knex from '../../db/connection.js';
import { getTestRequest, loginMockUser } from '../../utils/test-utils.js';
import { mockPrivateUser } from '../../db/mock/mock-data.js';
import { Tables } from '../../db/tables.js';
import { Pack } from '../../types/packs/pack-types.js';

const request = await getTestRequest();

const getValidPackId = async () => {
	const privateUserPack = await knex<Pack>(Tables.Pack)
		.select('pack_id')
		.where('user_id', mockPrivateUser.userId)
		.first();

	return privateUserPack?.pack_id;
};

beforeEach(async () => {
	await knex.migrate.rollback();
	await knex.migrate.latest();
	await knex.seed.run();
});

afterAll(async () => {
	await knex.migrate.rollback().then(() => knex.destroy());
});

describe('Bookmarks Routes: ', () => {
	it('GET / -> Should get user bookmarks', async () => {
		const userAgent = await loginMockUser();
		const response = await userAgent.get('/bookmarks');

		expect(response.statusCode).toEqual(200);
		expect(response.body.data).toHaveProperty('bookmarks');
		expect(response.body.data.bookmarks).toBeDefined();
	});

	it('GET / -> Should be a user-only protected route', async () => {
		const response = await request.get('/bookmarks').send();
		expect(response.statusCode).toEqual(401);
	});

	it('POST / -> Should bookmark a pack', async () => {
		const userAgent = await loginMockUser();
		const validPackId = await getValidPackId();
		const response = await userAgent.post('/bookmarks').send({ pack_id: validPackId });

		expect(response.statusCode).toEqual(200);
		expect(response.body.message).toEqual('Pack bookmarked successfully.');
	});

	it('POST / -> Should not be able to bookmark their own pack', async () => {
		const userAgent = await loginMockUser();
		const response = await userAgent.post('/bookmarks').send({ pack_id: 1 });

		expect(response.statusCode).toEqual(400);
		expect(response.body.error.message).toEqual('Cannot bookmark your own pack.');
	});

	it('POST / -> Should not bookmark same pack twice', async () => {
		const userAgent = await loginMockUser();
		const validPackId = await getValidPackId();
		await userAgent.post('/bookmarks').send({ pack_id: validPackId });

		const response = await userAgent.post('/bookmarks').send({ pack_id: validPackId });

		expect(response.statusCode).toEqual(409);
		expect(response.body.error.message).toEqual('Pack is already bookmarked.');
	});

	it('DELETE / -> Should delete a bookmark', async () => {
		const userAgent = await loginMockUser();
		const validPackId = await getValidPackId();
		await userAgent.post('/bookmarks').send({ pack_id: validPackId });

		const response = await userAgent.delete('/bookmarks').send({ pack_id: validPackId });

		expect(response.statusCode).toEqual(200);
		expect(response.body.message).toEqual('Bookmark deleted successfully.');
	});

	it('DELETE / -> Should return 200 even for non-bookmarked pack', async () => {
		const userAgent = await loginMockUser();
		const response = await userAgent.delete('/bookmarks').send({ pack_id: 999 });

		expect(response.statusCode).toEqual(200);
		expect(response.body.message).toEqual('Bookmark deleted successfully.');
	});
});
