import { Request, Response } from 'express';
import { getProfileAndPacks } from '../../services/profile-service.js';

async function getProfile(req: Request, res: Response) {
	try {
		const { userId } = req;

		const profile = await getProfileAndPacks(userId, true);

		return res.status(200).json(profile);
	} catch (err) {
		return res.status(400).json({ error: 'There was an error loading your profile.' });
	}
}

export default { getProfile };
