import server from '../../server.js';
import initialRequest from 'supertest';
const request = initialRequest(server);
import knex from '../../db/connection.js';
import { loginMockUser } from '../../utils/test-utils.js';

beforeEach(async () => {
	await knex.migrate.rollback();
	await knex.migrate.latest();
	await knex.seed.run();
});

afterAll(async () => {
	await knex.migrate.rollback().then(() => knex.destroy());
});

const validBookmark = {
	pack_id: 3,
};

describe('Bookmarks Routes: ', () => {
	it('GET / -> Should get user bookmarks', async () => {
		const userAgent = await loginMockUser();
		const response = await userAgent.get('/pack-bookmarks');

		expect(response.statusCode).toEqual(200);
		expect(response.body.data).toHaveProperty('bookmarks');
		expect(response.body.data.bookmarks).toBeDefined();
	});

	it('GET / -> Should be a user-only protected route', async () => {
		const response = await request.get('/pack-bookmarks').send();
		expect(response.statusCode).toEqual(401);
	});

	it('POST / -> Should bookmark a pack', async () => {
		const userAgent = await loginMockUser();
		const response = await userAgent.post('/pack-bookmarks').send(validBookmark);

		expect(response.statusCode).toEqual(200);
		expect(response.body.data).toHaveProperty('packId');
		expect(response.body.data.packId).toEqual(validBookmark.pack_id);
	});

	it('POST / -> Should not be able to bookmark their own pack', async () => {
		const userAgent = await loginMockUser();
		const response = await userAgent.post('/pack-bookmarks').send({ pack_id: 1 });

		expect(response.statusCode).toEqual(400);
	});

	it('POST / -> Should not bookmark same pack twice', async () => {
		const userAgent = await loginMockUser();
		await userAgent.post('/pack-bookmarks').send(validBookmark);

		const response = await userAgent.post('/pack-bookmarks').send(validBookmark);

		expect(response.statusCode).toEqual(409);
	});

	it('DELETE /:packId -> Should unbookmark a pack', async () => {
		const userAgent = await loginMockUser();
		await userAgent.post('/pack-bookmarks').send(validBookmark);

		const response = await userAgent.delete(`/pack-bookmarks/${validBookmark.pack_id}`);

		expect(response.statusCode).toEqual(200);
		expect(response.body.data).toHaveProperty('packId');
		expect(response.body.data.packId).toEqual(validBookmark.pack_id.toString());
	});

	it('DELETE /:packId -> Should return 404 for non-bookmarked pack', async () => {
		const userAgent = await loginMockUser();
		const response = await userAgent.delete('/pack-bookmarks/999');

		expect(response.statusCode).toEqual(404);
	});
});
