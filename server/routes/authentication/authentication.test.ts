import server from '../../server.js';
import initialRequest from 'supertest';
const request = initialRequest(server);
import knex from '../../db/connection.js';
import { loginMockUser, registerNewUser } from '../../utils/testUtils.js';
import { mockUser, notSeededUser } from '../../db/mock/mockData.js';

beforeEach(async () => {
	await knex.migrate.rollback();
	await knex.migrate.latest();
	await knex.seed.run();
});

afterAll(async () => {
	await knex.migrate.rollback().then(() => knex.destroy());
});

describe('Auth Routes: ', () => {
	it('GET /status -> Should get auth status', async () => {
		const response = await request.get('/auth/status').send();

		expect(response.statusCode).toEqual(200);
	});

	it('POST /register -> Should register new user', async () => {
		const response = await request.post('/auth/register').send(notSeededUser);

		expect(response.statusCode).toEqual(200);
	});

	it('POST /register -> Should create a default pack for new user', async () => {
		const userAgent = await registerNewUser();
		const response = await userAgent.get('/packs/').send();

		expect(response.status).toBe(200);
		expect(response.body).toHaveProperty('pack');
	});

	it('POST /register -> Should create a default category and pack item', async () => {
		const userAgent = await registerNewUser();
		const response = await userAgent.get('/packs/').send();
		const { categories } = response.body;

		expect(response.status).toBe(200);
		expect(response.body).toHaveProperty('categories');
		expect(categories[0].packItems).toHaveLength(1);
	});

	it('POST /register -> Should NOT allow existing user to register', async () => {
		const userAgent = await loginMockUser();
		const response = await userAgent.post('/auth/register').send(mockUser);

		expect(response.statusCode).toEqual(409);
		expect(response.body).toHaveProperty('error');
	});

	it('POST /register -> Should NOT allow existing username to be registered', async () => {
		notSeededUser.username = mockUser.username;
		const response = await request.post('/auth/register').send(notSeededUser);

		expect(response.statusCode).toEqual(409);
		expect(response.body).toHaveProperty('error');
	});

	it('POST /login -> Should allow registered users to log in', async () => {
		const userAgent = await loginMockUser();
		const response = await userAgent.post('/auth/login').send(mockUser);

		expect(response.statusCode).toEqual(200);
	});

	it('POST /login -> Should have error message for invalid email', async () => {
		const userAgent = await loginMockUser();
		const mockUserInvalidEmail = {
			email: 'invalidemail@tidytrek.co',
		};
		const response = await userAgent.post('/auth/login').send(mockUserInvalidEmail);

		expect(response.statusCode).toEqual(400);
		expect(response.body).toHaveProperty('error');
	});

	it('POST /logout -> Should allow user to logout', async () => {
		const userAgent = await loginMockUser();
		const response = await userAgent.post('/auth/logout');

		expect(response.statusCode).toEqual(200);
		expect(response.body).toHaveProperty('message');
	});

	it.skip('DELETE /account -> Should allow user to delete account', async () => {
		const userAgent = await loginMockUser();
		const response = await userAgent.delete('/auth/account');

		expect(response.statusCode).toEqual(200);
		expect(response.body).toHaveProperty('message');
	});
});
