import { Request, Response } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const resetTestDatabase = async (_req: Request, res: Response) => {
	try {
		// Only allow in test environment
		if (process.env.NODE_ENV !== 'test') {
			return res.status(403).json({
				error: 'Test reset only available in test environment',
			});
		}

		console.log('Resetting test database...');

		// Run the test setup script
		const { stdout, stderr } = await execAsync('npm run test:setup');

		console.log('Test database reset completed');
		if (stdout) console.log('stdout:', stdout);
		if (stderr) console.log('stderr:', stderr);

		res.status(200).json({
			message: 'Test database reset successfully',
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error('Error resetting test database:', error);
		res.status(500).json({
			error: 'Failed to reset test database',
			details: error instanceof Error ? error.message : 'Unknown error',
		});
	}
};
