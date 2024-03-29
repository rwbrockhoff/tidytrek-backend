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

const updatedProfileInfo = {
	user_location: 'Seattle, WA',
	user_bio: 'Just your average backpacker exploring the PNW!',
};

describe('User Profile Routes ', () => {
	it('GET / -> Should get profile settings', async () => {
		const userAgent = await loginMockUser();
		const response = await userAgent.get('/profile-settings/');

		expect(response.statusCode).toEqual(200);
		expect(response.body).toHaveProperty('profileInfo');
		expect(response.body).toHaveProperty('socialLinks');
	});

	it('GET / -> Should be a user-only protected route', async () => {
		const response = await request.get('/profile-settings/').send();
		expect(response.statusCode).toEqual(400);
	});

	it('POST / -> Should add a valid social link', async () => {
		const userAgent = await loginMockUser();
		const response = await userAgent
			.post('/profile-settings/social-link')
			.send(validSocialLink);

		expect(response.statusCode).toEqual(200);
	});

	it('POST / -> Should reject unknown social media name', async () => {
		const userAgent = await loginMockUser();
		const response = await userAgent
			.post('/profile-settings/social-link')
			.send(invalidSocialLink);

		expect(response.statusCode).toEqual(400);
	});

	it('POST / -> Should only allow four social links', async () => {
		const userAgent = await loginMockUser();

		await userAgent.post('/profile-settings/social-link').send(validSocialLink);
		await userAgent.post('/profile-settings/social-link').send(validSocialLink);
		await userAgent.post('/profile-settings/social-link').send(validSocialLink);
		const fourthLink = await userAgent
			.post('/profile-settings/social-link')
			.send(validSocialLink);
		const fifthLink = await userAgent
			.post('/profile-settings/social-link')
			.send(validSocialLink);

		expect(fourthLink.statusCode).toEqual(200);
		expect(fifthLink.statusCode).toEqual(400);
	});

	it('DELETE / -> Should delete social link', async () => {
		const userAgent = await loginMockUser();
		await userAgent.post('/profile-settings/social-link').send(validSocialLink);
		const {
			body: { socialLinks },
		} = await userAgent.get('/profile-settings/');

		const socialLinkId = socialLinks[0].socialLinkId;
		const deleteResponse = await userAgent.delete(
			`/profile-settings/social-link/${socialLinkId}`,
		);

		expect(socialLinks).toHaveLength(1);
		expect(deleteResponse.statusCode).toEqual(200);
	});

	it('PUT / -> Should allow user to update profile info', async () => {
		const userAgent = await loginMockUser();
		const response = await userAgent.put('/profile-settings/').send(updatedProfileInfo);

		expect(response.statusCode).toEqual(200);
	});
});
