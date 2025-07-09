import server from '../server.js';
import supertest, { type Test } from 'supertest';
import type TestAgent from 'supertest/lib/agent.js';
import { mockUser, notSeededUser } from '../db/mock/mock-data.js';

const { userId, email } = mockUser;

type UserAgent = TestAgent<Test>;

const errorMessage = 'Could not register user for testing';

export const loginMockUser = async (): Promise<UserAgent> => {
	const agent = supertest.agent(server);

	const res = await agent.post('/auth/login').send({ userId, email });

	if (res.status !== 200) throw new Error(errorMessage, res.body);

	return agent;
};

export const registerNewUser = async (): Promise<UserAgent> => {
	const agent = supertest.agent(server);
	const res = await agent.post('/auth/register').send(notSeededUser);

	if (res.status !== 200) throw new Error(errorMessage, res.body);

	return agent;
};
