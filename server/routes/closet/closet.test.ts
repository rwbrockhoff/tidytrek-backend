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

describe('Gear Closet Routes: ', () => {
	it('GET / -> Should get gear closet list', async () => {
		const userAgent = await loginMockUser();
		const response = await userAgent.get('/closet');

		expect(response.statusCode).toEqual(200);
		expect(response.body).toHaveProperty('gearClosetList');
		expect(response.body).toHaveProperty('availablePacks');
	});

	it('GET / -> Should be a user-only protected route', async () => {
		const response = await request.get('/closet').send();
		expect(response.statusCode).toEqual(400);
	});
});
