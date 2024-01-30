import server from '../../server.js';
import initialRequest from 'supertest';
const request = initialRequest(server);
import knex from '../../db/connection.js';
import {
	loginMockUser,
	registerNewUser,
	mockUser,
	notSeededUser,
} from '../../utils/testUtils.js';

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
		expect(response.body).toHaveProperty('user');
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
		expect(response.body).toHaveProperty('user');
	});

	it('POST /login -> Should NOT allow wrong password', async () => {
		const userAgent = await loginMockUser();
		const mockUserBadPassword = {
			email: mockUser.email,
			password: 'wrongpassword',
		};
		const response = await userAgent.post('/auth/login').send(mockUserBadPassword);

		expect(response.statusCode).toEqual(400);
		expect(response.body).toHaveProperty('error');
	});

	it('POST /login -> Should have error message for invalid email', async () => {
		const userAgent = await loginMockUser();
		const mockUserInvalidEmail = {
			email: 'invalidemail@tidytrek.co',
			password: mockUser.password,
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

	it('PUT /password -> Should let user change password', async () => {
		const userAgent = await loginMockUser();
		const newPass = 'Pizza123!';
		const passwordInfo = {
			currentPassword: mockUser.password,
			newPassword: newPass,
			confirmNewPassword: newPass,
		};
		const changePasswordResponse = await userAgent
			.put('/auth/password')
			.send(passwordInfo);
		expect(changePasswordResponse.statusCode).toEqual(200);

		const loginResponse = await userAgent
			.post('/auth/login')
			.send({ email: mockUser.email, password: newPass });
		expect(loginResponse.statusCode).toEqual(200);
		expect(loginResponse.body).toHaveProperty('user');
	});

	it('PUT /password -> Passwords should match', async () => {
		const userAgent = await loginMockUser();
		const passwordInfo = {
			currentPassword: mockUser.password,
			newPassword: 'Pizza123!',
			confirmNewPassword: 'Calzones123!',
		};
		const response = await userAgent.put('/auth/password').send(passwordInfo);

		expect(response.statusCode).toEqual(400);
		expect(response.body).toHaveProperty('error');
	});

	it('PUT /password -> Must provide correct current password', async () => {
		const userAgent = await loginMockUser();
		const passwordInfo = {
			currentPassword: 'wrongPassword345',
			newPassword: 'Pizza123!',
			confirmNewPassword: 'Pizza123!',
		};
		const response = await userAgent.put('/auth/password').send(passwordInfo);

		expect(response.statusCode).toEqual(400);
		expect(response.body).toHaveProperty('error');
	});

	// This test is skipped to avoid hitting our Postmark API repeatedly
	it.skip('POST /reset-password -> Should allow user to reset password', async () => {
		const response = await request
			.post('/auth/reset-password/request')
			.send({ email: mockUser.email });

		expect(response.statusCode).toEqual(200);
	});

	it('POST /reset-password -> Should error for unknown email', async () => {
		const response = await request
			.post('/auth/reset-password/request')
			.send({ email: notSeededUser.email });

		expect(response.statusCode).toEqual(400);
		expect(response.body).toHaveProperty('error');
	});
	it('DELETE /account -> Should allow user to delete account', async () => {
		const userAgent = await loginMockUser();
		const response = await userAgent.delete('/auth/account');

		expect(response.statusCode).toEqual(200);
		expect(response.body).toHaveProperty('message');
	});
});
