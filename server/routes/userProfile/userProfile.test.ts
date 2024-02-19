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

const validSocialLink = {
	service: 'instagram',
	social_link: 'www.instagram.com/@tidytrek',
};

const invalidSocialLink = {
	service: 'mobysocial',
	social_link: 'www.mobysocialisfake.com/@tidytrek',
};

describe('User Profile Routes ', () => {
	it('GET / -> Should get profile settings', async () => {
		const userAgent = await loginMockUser();
		const response = await userAgent.get('/user-profile/');

		expect(response.statusCode).toEqual(200);
		expect(response.body).toHaveProperty('profileSettings');
	});

	it('GET / -> Should be a user-only protected route', async () => {
		const response = await request.get('/closet').send();
		expect(response.statusCode).toEqual(400);
	});

	it('POST / -> Should add a valid social link', async () => {
		const userAgent = await loginMockUser();
		const response = await userAgent
			.post('/user-profile/social-link')
			.send(validSocialLink);

		expect(response.statusCode).toEqual(200);
	});

	it('POST / -> Should reject unknown social media name', async () => {
		const userAgent = await loginMockUser();
		const response = await userAgent
			.post('/user-profile/social-link')
			.send(invalidSocialLink);

		expect(response.statusCode).toEqual(400);
	});
});
