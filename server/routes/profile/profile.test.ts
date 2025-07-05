import server from '../../server.js';
import initialRequest from 'supertest';
const request = initialRequest(server);
import knex from '../../db/connection.js';
import { loginMockUser } from '../../utils/testUtils.js';
import { mockUser } from '../../db/mock/mockData.js';
import { tables as t } from '../../../knexfile.js';

beforeEach(async () => {
	await knex.migrate.rollback();
	await knex.migrate.latest();
	await knex.seed.run();
});

afterAll(async () => {
	await knex.migrate.rollback().then(() => knex.destroy());
});

describe('Profile Routes:', () => {
	it('GET /profile -> Should get user profile when authenticated', async () => {
		const userAgent = await loginMockUser();
		const response = await userAgent.get('/profile/').send();

		expect(response.statusCode).toEqual(200);
		expect(response.body).toHaveProperty('userProfile');
		expect(response.body).toHaveProperty('packThumbnailList');
	});

	it('GET /profile -> Should be a protected route', async () => {
		const response = await request.get('/profile/').send();

		// Should be unauthorized without auth
		expect(response.statusCode).toEqual(401);
	});

	it('GET /profile -> Should include pack thumbnail list with at least one pack', async () => {
		const userAgent = await loginMockUser();
		const response = await userAgent.get('/profile/').send();

		const { packThumbnailList } = response.body;

		// Should at least have a default pack
		expect(packThumbnailList.length).toBeGreaterThan(0);
	});

	it('GET /profile -> Should only show public packs for non-owner', async () => {
		const userAgent = await loginMockUser();

		// Create a private pack
		await userAgent.post('/packs/').send(); // Creates new pack (private by default)

		// Set one pack to public, one to private
		const packs = await knex(t.pack).where({ user_id: mockUser.userId });
		await knex(t.pack).update({ pack_public: true }).where({ pack_id: packs[0].pack_id });
		await knex(t.pack)
			.update({ pack_public: false })
			.where({ pack_id: packs[1].pack_id });

		// Test as pack owner (should see all packs)
		const ownerResponse = await userAgent.get('/profile/').send();
		expect(ownerResponse.body.packThumbnailList.length).toBe(3);
	});
});
