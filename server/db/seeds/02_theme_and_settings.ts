import { Knex } from 'knex';
import { mockUser } from '../mock/mockData.js';
import { themeColors, themeColorNames } from '../../utils/themeColors.js';
import { tables as t } from '../../../knexfile.js';

const { email, username } = mockUser;

export async function seed(knex: Knex): Promise<void> {
	await knex(t.userSettings).del();
	await knex(t.theme).del();
	await knex(t.themeColor).del();

	// create default theme
	const [{ themeId }] = await knex(t.theme)
		.insert({
			tidytrek_theme: true,
			theme_name: 'Earth Tones',
		})
		.returning('theme_id');

	const dbReadyThemeColors = themeColors.earthTones.map((color, index) => {
		return {
			theme_id: themeId,
			theme_color: color,
			theme_color_name: themeColorNames[index],
		};
	});
	// create default theme colors
	await knex(t.themeColor).insert(dbReadyThemeColors);

	// create default user settings
	const { userId } = await knex(t.user)
		.select('user_id')
		.where({ email, username })
		.first();

	await knex(t.userSettings).insert({ user_id: userId, theme_id: themeId });
}
