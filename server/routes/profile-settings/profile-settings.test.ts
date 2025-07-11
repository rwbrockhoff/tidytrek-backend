import server from '../../server.js';
import initialRequest from 'supertest';
const request = initialRequest(server);
import knex from '../../db/connection.js';
import { loginMockUser, registerNewUser } from '../../utils/test-utils.js';
import { mockUser } from '../../db/mock/mock-data.js';

beforeEach(async () => {
	await knex.migrate.rollback();
	await knex.migrate.latest();
	await knex.seed.run();
});

afterAll(async () => {
	await knex.migrate.rollback().then(() => knex.destroy());
});

const validSocialLink = {
	platform_name: 'instagram',
	social_link_url: 'https://www.instagram.com/@tidytrek',
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
		expect(response.statusCode).toEqual(401);
	});

	it('POST / -> Should add a valid social link', async () => {
		const userAgent = await loginMockUser();
		const response = await userAgent
			.post('/profile-settings/social-link')
			.send(validSocialLink);

		expect(response.statusCode).toEqual(200);
	});

	it('POST / -> Should only allow four social links', async () => {
		const userAgent = await loginMockUser();

		// Get current count of social links from seed data
		const { userId } = mockUser;
		const existingLinksCount = await knex('social_link')
			.where('user_id', userId)
			.count('* as count')
			.first();

		const currentCount = parseInt(String(existingLinksCount?.count || 0));
		const linksToAdd = 4 - currentCount;

		// Loop and insert max allowed social links
		for (let i = 0; i < linksToAdd; i++) {
			const response = await userAgent
				.post('/profile-settings/social-link')
				.send(validSocialLink);
			expect(response.statusCode).toEqual(200);
		}

		// The next link (5th total) should be rejected
		const fifthLink = await userAgent
			.post('/profile-settings/social-link')
			.send(validSocialLink);

		expect(fifthLink.statusCode).toEqual(400);
	});

	it('DELETE / -> Should delete social link', async () => {
		const userAgent = await loginMockUser();

		// Get current social links from seed data
		const {
			body: { socialLinks: initialLinks },
		} = await userAgent.get('/profile-settings/');

		const initialCount = initialLinks.length;
		expect(initialCount).toBeGreaterThan(0); // Should have links from seed data

		// Delete the first existing social link
		const socialLinkId = initialLinks[0].socialLinkId;
		const deleteResponse = await userAgent.delete(
			`/profile-settings/social-link/${socialLinkId}`,
		);

		expect(deleteResponse.statusCode).toEqual(200);

		// Verify the link was deleted
		const {
			body: { socialLinks: updatedLinks },
		} = await userAgent.get('/profile-settings/');

		expect(updatedLinks).toHaveLength(initialCount - 1);
	});

	it('PUT / -> Should allow user to update profile info', async () => {
		const userAgent = await loginMockUser();
		const response = await userAgent.put('/profile-settings/').send(updatedProfileInfo);

		expect(response.statusCode).toEqual(200);
	});

	it('POST / -> Should allow unique username to be registered', async () => {
		const userInput = { username: 'uniqueTestUser123', trailName: '' };
		const newUser = await registerNewUser();

		const response = await newUser.put('/profile-settings/username').send(userInput);

		expect(response.statusCode).toEqual(200);
	});

	it('POST / -> Should NOT allow existing username to be registered', async () => {
		const userInput = { username: mockUser.username, trailName: '' };
		const newUser = await registerNewUser();

		const response = await newUser.put('/profile-settings/username').send(userInput);

		expect(response.statusCode).toEqual(409);
		expect(response.body).toHaveProperty('error');
	});
});
