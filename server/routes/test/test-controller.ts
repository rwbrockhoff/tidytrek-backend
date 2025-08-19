import { Request, Response } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import {
	errorResponse,
	successResponse,
	forbidden,
	HTTP_STATUS,
	ErrorCode,
} from '../../utils/error-response.js';
import { validateEnvironment } from '../../config/environment.js';

const env = validateEnvironment();

const execAsync = promisify(exec);

export const resetTestDatabase = async (_req: Request, res: Response) => {
	try {
		if (env.NODE_ENV !== 'test') {
			return forbidden(res, 'Test reset only available in test environment');
		}

		console.log('Resetting test database...');

		// Run the test setup script
		const setupScript =
			process.env.DOCKER === 'true' ? 'docker:test:db-setup' : 'test:setup';
		await execAsync(`npm run ${setupScript}`);

		console.log('Test database reset completed');

		return successResponse(res, null, 'Test database reset successfully');
	} catch (error) {
		console.error('Error resetting test database:', error);
		return errorResponse(
			res,
			HTTP_STATUS.INTERNAL_SERVER_ERROR,
			'Failed to reset test database',
			ErrorCode.INTERNAL_ERROR,
			error instanceof Error ? error.message : 'Unknown error',
		);
	}
};

export const resetPackData = async (_req: Request, res: Response) => {
	try {
		if (env.NODE_ENV !== 'test') {
			return forbidden(res, 'Test reset only available in test environment');
		}

		console.log('Resetting pack data for test user...');

		// Run the pack-specific seed script
		const seedScript =
			process.env.DOCKER === 'true' ? 'docker:test:seed-packs' : 'test:seed-packs';
		await execAsync(`npm run ${seedScript}`);

		console.log('Pack data reset completed');

		return successResponse(res, null, 'Pack data reset successfully');
	} catch (error) {
		console.error('Error resetting pack data:', error);
		return errorResponse(
			res,
			HTTP_STATUS.INTERNAL_SERVER_ERROR,
			'Failed to reset pack data',
			ErrorCode.INTERNAL_ERROR,
			error instanceof Error ? error.message : 'Unknown error',
		);
	}
};
