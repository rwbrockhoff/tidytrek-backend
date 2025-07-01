import server from '../../server.js';
import initialRequest from 'supertest';
const request = initialRequest(server);
import knex from '../../db/connection.js';
import { loginMockUser, registerNewUser } from '../../utils/testUtils.js';

beforeEach(async () => {
	await knex.migrate.rollback();
	await knex.migrate.latest();
	await knex.seed.run();
});

afterAll(async () => {
	await knex.migrate.rollback().then(() => knex.destroy());
});

const getPackId = async () => {
	const userAgent = await loginMockUser();
	const { body: packResponse } = await userAgent.get('/packs/').send();
	const { packId } = packResponse.pack;
	return { packId, userAgent };
};

describe('Guests Routes: Pack ', () => {
	it('GET / -> Should get a publicly accessible pack', async () => {
		const { packId } = await getPackId();
		const response = await request.get(`/guests/pack/${packId}`).send();

		expect(response.statusCode).toEqual(200);
		expect(response.body).toHaveProperty('pack');
		expect(response.body).toHaveProperty('categories');
	});

	it('GET / -> Should not be able to access a private pack', async () => {
		const response = await request.get(`/guests/pack/2`).send();
		// Should provide a 200 response with empty data
		expect(response.statusCode).toEqual(200);
		expect(response.body).toEqual({
			pack: null,
			categories: [],
			settings: null,
			userProfile: null,
		});
	});

	it('GET / -> Should update pack view count when non-users view pack', async () => {
		const { packId, userAgent } = await getPackId();
		await request.get(`/guests/pack/${packId}`).send();

		const { body: packResponse } = await userAgent.get('/packs/').send();
		const { packViews } = packResponse.pack;
		expect(packViews).toEqual(1);
	});

	it('GET / -> Should update pack view count when different user views', async () => {
		const { packId, userAgent } = await getPackId();
		const newUser = await registerNewUser();
		await newUser.get(`/guests/pack/${packId}`).send();

		const { body: packResponse } = await userAgent.get('/packs/').send();
		const { packViews } = packResponse.pack;
		expect(packViews).toEqual(1);
	});

	it('GET / -> Should not update view count when user views their own pack', async () => {
		const { packId, userAgent } = await getPackId();
		await userAgent.get(`/guests/pack/${packId}`).send();

		const { body: packResponse } = await userAgent.get('/packs/').send();
		const { packViews } = packResponse.pack;
		expect(packViews).toEqual(0);
	});
});
