import knex from '../../db/connection.js';
import { tables as t } from '../../../knexfile.js';
import { Response } from 'express';
import {
	successResponse,
	badRequest,
	internalError,
} from '../../utils/error-response.js';
import {
	hasEmptyValidatedBody,
	NO_VALID_FIELDS_MESSAGE,
	ValidatedRequest,
} from '../../utils/validation.js';
import { UserSettingsUpdate } from './user-settings-schemas.js';

async function updateUserSettings(
	req: ValidatedRequest<UserSettingsUpdate>,
	res: Response,
) {
	try {
		const { userId } = req;

		if (hasEmptyValidatedBody(req)) {
			return badRequest(res, NO_VALID_FIELDS_MESSAGE);
		}

		await knex(t.userSettings).update(req.validatedBody).where({ user_id: userId });

		return successResponse(res, null, 'Settings updated successfully.');
	} catch (err) {
		return internalError(res, 'There was an error updating your settings.');
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
