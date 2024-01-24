import server from '../../server.js';
import initialRequest from 'supertest';
const request = initialRequest(server);
import knex from '../../db/connection.js';
import { loginMockUser } from '../../utils/testUtils.js';

beforeEach(async () => {
	await knex.migrate.rollback();
	await knex.migrate.latest();
	await knex.seed.run();
});

afterAll(async () => {
	await knex.migrate.rollback().then(() => knex.destroy());
});

describe('Pack Routes: Pack ', () => {
	it('GET / -> Should get default pack', async () => {
		const userAgent = await loginMockUser();
		const response = await userAgent.get('/packs/').send();

		expect(response.statusCode).toEqual(200);
		expect(response.body).toHaveProperty('pack');
		expect(response.body).toHaveProperty('categories');
	});

	it('GET / -> Should be a user-only protected route', async () => {
		const response = await request.get('/packs/').send();
		expect(response.statusCode).toEqual(400);
	});

	it('GET /:packId -> Should get a pack by packId', async () => {
		const userAgent = await loginMockUser();
		const packListResponse = await userAgent.get('/packs/pack-list').send();
		const { packList } = packListResponse.body;
		const packId = packList[0].packId;
		const response = await userAgent.get(`/packs/${packId}`).send();

		expect(response.statusCode).toEqual(200);
		expect(response.body).toHaveProperty('pack');
	});

	it('GET /pack-list -> Should get pack list', async () => {
		const userAgent = await loginMockUser();
		const response = await userAgent.get('/packs/pack-list').send();

		expect(response.statusCode).toEqual(200);
		expect(response.body).toHaveProperty('packList');
	});

	it('POST / -> Should add a new pack', async () => {
		const userAgent = await loginMockUser();
		const response = await userAgent.post('/packs/').send();
		expect(response.status).toEqual(200);
		expect(response.body).toHaveProperty('pack');
		expect(response.body).toHaveProperty('categories');
	});

	it('PUT /:packId / -> Should edit a pack', async () => {
		const userAgent = await loginMockUser();
		const packResponse = await userAgent.get('/packs/').send();
		const { packId } = packResponse.body.pack;
		const response = await userAgent
			.put(`/packs/${packId}`)
			.send({ modified_pack: { packName: 'Updated Pack Name' } });
		expect(response.status).toEqual(200);
	});

	it('PUT /index/:packId -> Should move a pack', async () => {
		const userAgent = await loginMockUser();
		const packResponse = await userAgent.get('/packs/pack-list').send();
		const { packList } = packResponse.body;
		const packId = packList[0].packId;

		const response = await userAgent.put(`/packs/index/${packId}`).send({ newIndex: 1 });

		expect(response.status).toBe(200);
	});

	it('DELETE /:packId -> Should delete a pack', async () => {
		// deletes pack but keeps pack items in "pack garage"
		const userAgent = await loginMockUser();
		const newPackResponse = await userAgent.post('/packs/').send();
		const { packId } = newPackResponse.body.pack;

		const response = await userAgent.delete(`/packs/${packId}`).send();
		expect(response.status).toEqual(200);
		expect(response.body).toHaveProperty('deletedPackId');
	});

	it('DELETE /items/:packId -> Should delete pack and related items', async () => {
		// deletes pack and included items
		const userAgent = await loginMockUser();
		const newPackResponse = await userAgent.post('/packs/').send();
		const { packId } = newPackResponse.body.pack;

		const response = await userAgent.delete(`/packs/items/${packId}`).send();
		expect(response.status).toEqual(200);
		expect(response.body).toHaveProperty('deletedPackId');
	});
});

describe('Pack Routes: Pack Items', () => {
	it('POST /pack-items -> Should add pack item', async () => {
		const userAgent = await loginMockUser();
		const packResponse = await userAgent.get('/packs/').send();
		const { packId } = packResponse.body.pack;
		const { packCategoryId } = packResponse.body.categories[0];

		const response = await userAgent
			.post('/packs/pack-items')
			.send({ packId, packCategoryId });
		expect(response.statusCode).toEqual(200);
		expect(response.body).toHaveProperty('packItem');
	});

	it('PUT /pack-items/:packItemId -> Should edit pack item', async () => {
		const userAgent = await loginMockUser();
		const packResponse = await userAgent.get('/packs/').send();
		const { packItems } = packResponse.body.categories[0];
		const { packItemId } = packItems[0];

		const response = await userAgent.put(`/packs/pack-items/${packItemId}`).send({
			packItemName: 'New Item Name',
			favorite: true,
			wornWeight: false,
		});

		expect(response.status).toEqual(200);
	});

	it('DELETE /pack-items/:packItemId -> Should delete pack item', async () => {
		const userAgent = await loginMockUser();
		const packResponse = await userAgent.get('/packs/').send();
		const { packItems } = packResponse.body.categories[0];
		const { packItemId } = packItems[0];

		const response = await userAgent.delete(`/packs/pack-items/${packItemId}`);

		expect(response.status).toEqual(200);
	});
});

describe('Pack Items: Categories', () => {
	it('POST /categories/:packId -> Should add pack category', async () => {
		const userAgent = await loginMockUser();
		const packResponse = await userAgent.get('/packs/').send();
		const { packId } = packResponse.body.pack;

		const response = await userAgent.post(`/packs/categories/${packId}`);

		expect(response.statusCode).toEqual(200);
		expect(response.body).toHaveProperty('packCategory');
	});

	it('PUT /categories/:categoryId -> Should edit pack category', async () => {
		const userAgent = await loginMockUser();
		const packResponse = await userAgent.get('/packs/').send();
		const { packCategoryId } = packResponse.body.categories[0];

		const response = await userAgent
			.put(`/packs/categories/${packCategoryId}`)
			.send({ packCategoryName: 'New Category Name' });

		expect(response.statusCode).toEqual(200);
		expect(response.body).toHaveProperty('packCategory');
	});

	it('DELETE /categories/:categoryId -> Should delete pack category', async () => {
		// this route deletes categories but pack items go into pack garage
		const userAgent = await loginMockUser();
		const packResponse = await userAgent.get('/packs/').send();
		const { packCategoryId } = packResponse.body.categories[0];

		const response = await userAgent.delete(`/packs/categories/${packCategoryId}`);

		expect(response.statusCode).toEqual(200);
		expect(response.body).toHaveProperty('deletedId');
	});

	it('DELETE /categories/items/:categoryId -> Should delete pack category', async () => {
		// this route deletes categories AND included pack items
		const userAgent = await loginMockUser();
		const packResponse = await userAgent.get('/packs/').send();
		const { packCategoryId } = packResponse.body.categories[0];

		const response = await userAgent.delete(`/packs/categories/items/${packCategoryId}`);

		expect(response.statusCode).toEqual(200);
		expect(response.body).toHaveProperty('deletedId');
	});
});
