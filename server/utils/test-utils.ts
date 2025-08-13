import server from '../server.js';
import supertest, { type Test } from 'supertest';
import type TestAgent from 'supertest/lib/agent.js';
import { mockUser, notSeededUser } from '../db/mock/mock-data.js';

const { userId, email, supabaseRefreshToken } = mockUser;

type UserAgent = TestAgent<Test>;

const errorMessage = 'Could not register user for testing';

export const getTestRequest = async () => {
	const app = await server;
	return supertest(app);
};

export const loginMockUser = async (): Promise<UserAgent> => {
	const app = await server;
	const agent = supertest.agent(app);

	const res = await agent.post('/auth/login').send({ 
		user_id: userId, 
		email,
		supabase_refresh_token: supabaseRefreshToken
	});

	if (res.status !== 200) throw new Error(errorMessage, res.body);

	return agent;
};

export const registerNewUser = async (): Promise<UserAgent> => {
	const app = await server;
	const agent = supertest.agent(app);
	const res = await agent.post('/auth/register').send(notSeededUser);

	if (res.status !== 200) throw new Error(errorMessage, res.body);

	return agent;
};
