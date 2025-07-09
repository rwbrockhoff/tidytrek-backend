import knex from '../../db/connection.js';
import { tables as t } from '../../../knexfile.js';
import { Request, Response } from 'express';

type UserSettingsUpdate = {
	public_profile?: boolean;
	palette?: string;
	dark_mode?: boolean;
	weight_unit?: string;
	currency_unit?: string;
};


async function updateUserSettings(req: Request, res: Response) {
	try {
		const { userId } = req;
		const allowedFields: (keyof UserSettingsUpdate)[] = [
			'public_profile',
			'palette',
			'dark_mode',
			'weight_unit',
			'currency_unit',
		];

		// Filter request body to only include allowed fields
		console.log('Request body:', req.body);
		console.log('Allowed fields:', allowedFields);
		
		const updates = Object.keys(req.body)
			.filter((key): key is keyof UserSettingsUpdate => allowedFields.includes(key as keyof UserSettingsUpdate))
			.reduce((obj, key) => {
				obj[key] = req.body[key];
				return obj;
			}, {} as UserSettingsUpdate);

		console.log('Filtered updates:', updates);
		console.log('Updates length:', Object.keys(updates).length);

		if (Object.keys(updates).length === 0) {
			return res.status(400).json({ error: 'No valid settings provided to update.' });
		}

		const result = await knex(t.userSettings).update(updates).where({ user_id: userId });
		console.log('Database update result:', result);

		return res.status(200).json({ message: 'Settings updated successfully.' });
	} catch (err) {
		console.error('Error in updateUserSettings:', err);
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
