import server from '../server.js';
import supertest from 'supertest';
import { mockUser, notSeededUser } from '../db/mock/mockData.js';

export const loginMockUser = async () => {
	try {
		const agent = supertest.agent(server);
		await agent.post('/auth/login').send(mockUser);
		return agent;
	} catch (err) {
		return { error: 'Could not register user for testing.' };
	}
};

export const registerNewUser = async () => {
	try {
		const agent = supertest.agent(server);
		await agent.post('/auth/register').send(notSeededUser);
		return agent;
	} catch (err) {
		return { error: 'Could not register user for testing.' };
	}
};
