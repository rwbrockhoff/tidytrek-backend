import knex from '../../db/connection.js';
import { tables as t } from '../../../knexfile.js';
import { Response } from 'express';
import { hasEmptyValidatedBody, NO_VALID_FIELDS_MESSAGE, ValidatedRequest } from '../../utils/validation.js';
import { UserSettingsUpdate } from './user-settings-schemas.js';


async function updateUserSettings(req: ValidatedRequest<UserSettingsUpdate>, res: Response) {
	try {
		const { userId } = req;

		if (hasEmptyValidatedBody(req)) {
			return res.status(400).json({ error: NO_VALID_FIELDS_MESSAGE });
		}

		await knex(t.userSettings).update(req.validatedBody).where({ user_id: userId });

		return res.status(200).json({ message: 'Settings updated successfully.' });
	} catch (err) {
		return res.status(400).json({ error: 'There was an error updating your settings.' });
	}
}

// Helper function for other controllers to get settings
export async function getUserSettingsData(userId: string) {
	return await knex(t.userSettings)
		.select('public_profile', 'palette', 'dark_mode', 'weight_unit', 'currency_unit')
		.where({ user_id: userId })
		.first();
}

export default {
	updateUserSettings,
};
