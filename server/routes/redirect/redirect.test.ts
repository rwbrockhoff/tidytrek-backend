import server from '../../server.js';
import initialRequest from 'supertest';
const request = initialRequest(server);
import knex from '../../db/connection.js';

beforeEach(async () => {
	await knex.migrate.rollback();
	await knex.migrate.latest();
	await knex.seed.run();
});

afterAll(async () => {
	await knex.migrate.rollback().then(() => knex.destroy());
});

describe('Redirect Routes:', () => {
	it('POST /redirect -> Should return redirect URL for trusted domain', async () => {
		// youtube is on our whitelist of trusted domains
		const response = await request
			.post('/redirect')
			.send({ url: 'https://youtube.com/watch?v=test' });

		expect(response.statusCode).toEqual(200);
		expect(response.body.data.trusted).toBe(true);
		expect(response.body.data.redirectUrl).toBe('https://youtube.com/watch?v=test');
	});

	it('POST /redirect -> Should return warning for untrusted site', async () => {
		const response = await request.post('/redirect').send({ url: 'https://badsite.com' });

		expect(response.statusCode).toEqual(200);
		expect(response.body.data.warning).toBe(true);
		expect(response.body.data.destination).toBe('badsite.com');
	});

	it('POST /redirect -> Should handle invalid URL', async () => {
		const response = await request.post('/redirect').send({ url: 'not-a-url' });

		expect(response.statusCode).toEqual(400);
		expect(response.body.error.message).toBe('Request validation failed');
	});
});
