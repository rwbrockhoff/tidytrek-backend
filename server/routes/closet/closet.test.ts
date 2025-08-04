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

describe('Gear Closet Routes: ', () => {
	it('GET / -> Should get gear closet list', async () => {
		const userAgent = await loginMockUser();
		const response = await userAgent.get('/closet');

		expect(response.statusCode).toEqual(200);
		expect(response.body.data).toHaveProperty('gearClosetList');
	});

	it('GET / -> Should be a user-only protected route', async () => {
		const response = await request.get('/closet').send();
		expect(response.statusCode).toEqual(401);
	});

	it('POST / -> Should post an item to gear closet', async () => {
		const userAgent = await loginMockUser();
		const defaultClosetResponse = await userAgent.get('/closet').send();
		const { gearClosetList } = defaultClosetResponse.body.data;
		const defaultLength = gearClosetList.length;
		const response = await userAgent.post('/closet/items');
		const getItemsResponse = await userAgent.get('/closet');

		expect(response.statusCode).toEqual(200);
		expect(response.body.data).toHaveProperty('gearClosetItem');
		expect(response.body.data.gearClosetItem).toHaveProperty('packItemId');
		expect(response.body.data.gearClosetItem).toHaveProperty('packItemName');
		expect(getItemsResponse.statusCode).toEqual(200);
		expect(getItemsResponse.body.data.gearClosetList).toHaveLength(defaultLength + 1);
	});

	it('PUT / -> Should edit an item in gear closet', async () => {
		const userAgent = await loginMockUser();
		const getItemsResponse = await userAgent.get('/closet');
		const { gearClosetList } = getItemsResponse.body.data;
		const firstClosetItem = gearClosetList[0];

		const editItemResponse = await userAgent
			.put(`/closet/items/${firstClosetItem.packItemId}`)
			.send({ packItemName: 'Osprey Exos 55L' });

		expect(editItemResponse.statusCode).toEqual(200);
	});

	it('DELETE / -> Should delete a posted item from gear closet', async () => {
		const userAgent = await loginMockUser();
		await userAgent.post('/closet/items');
		const getItemsResponse = await userAgent.get('/closet');

		const { packItemId } = getItemsResponse.body.data.gearClosetList[0];
		const deleteItemResponse = await userAgent.delete(`/closet/items/${packItemId}`);

		expect(deleteItemResponse.statusCode).toEqual(200);
	});
});
