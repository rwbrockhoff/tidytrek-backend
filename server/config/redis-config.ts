import { createClient, type RedisClientType } from 'redis';
import { validateEnvironment } from './environment.js';

const env = validateEnvironment();

const redisClient: RedisClientType = createClient({
	url: `redis://${env.REDIS_HOST}:6379`,
});

redisClient.on('error', (err) => console.error('Redis Error:', err));

redisClient.on('ready', () => console.log('Redis Ready'));

export default redisClient;
