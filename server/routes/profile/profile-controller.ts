import { Request, Response } from 'express';
import { getProfileAndPacks } from '../../services/profile-service.js';
import { successResponse, internalError } from '../../utils/error-response.js';

async function getProfile(req: Request, res: Response) {
	try {
		const { userId } = req;

		const profile = await getProfileAndPacks(userId, true);

		return successResponse(res, profile);
	} catch (err) {
		return internalError(res, 'There was an error loading your profile.');
	}
}

export default { getProfile };
