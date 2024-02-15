import { Knex } from 'knex';
import { mockUser } from '../mock/mockData.js';
import { themeColors, themeColorNames } from '../../utils/themeColors.js';

const { email, username } = mockUser;

export async function seed(knex: Knex): Promise<void> {
	await knex('user_settings').del();
	await knex('themes').del();
	await knex('theme_colors').del();

	// create default theme
	const [{ themeId }] = await knex('themes')
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
	await knex('theme_colors').insert(dbReadyThemeColors);

	// create default user settings
	const { userId } = await knex('users')
		.select('user_id')
		.where({ email, username })
		.first();
	await knex('user_settings').insert({ user_id: userId, theme_id: themeId });
}
