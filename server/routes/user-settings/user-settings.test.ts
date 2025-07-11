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

const validSettingsUpdate = {
	dark_mode: true,
	palette: 'earth-tones',
	weight_unit: 'metric',
};

const invalidSettingsUpdate = {
	malicious_field: 'bad attempt',
	another_bad_field: 'should be filtered',
};

describe('User Settings Routes', () => {
	it('PUT / -> Should update user settings with valid settings', async () => {
		const userAgent = await loginMockUser();
		const response = await userAgent.put('/user-settings/').send(validSettingsUpdate);

		expect(response.statusCode).toEqual(200);
		expect(response.body).toHaveProperty('message');
	});

	it('PUT / -> Should be a user-only protected route', async () => {
		const response = await request.put('/user-settings/').send(validSettingsUpdate);
		expect(response.statusCode).toEqual(401);
	});

	it('PUT / -> Should error with empty user settings update', async () => {
		const userAgent = await loginMockUser();
		const response = await userAgent.put('/user-settings/').send({});

		expect(response.statusCode).toEqual(400);
		expect(response.body).toHaveProperty('error');
		expect(response.body.error).toContain('No valid fields provided');
	});

	it('PUT / -> Should update only provided fields (partial update)', async () => {
		const userAgent = await loginMockUser();
		const partialUpdate = { dark_mode: false };

		const response = await userAgent.put('/user-settings/').send(partialUpdate);

		expect(response.statusCode).toEqual(200);
		expect(response.body).toHaveProperty('message');
	});

	it('PUT / -> Should reject requests with invalid fields', async () => {
		const userAgent = await loginMockUser();
		const mixedUpdate = {
			...validSettingsUpdate,
			...invalidSettingsUpdate,
		};

		const response = await userAgent.put('/user-settings/').send(mixedUpdate);

		expect(response.statusCode).toEqual(400);
		expect(response.body).toHaveProperty('error');
		expect(response.body.error).toContain('Request validation failed');
	});
});
