import { Knex } from 'knex';
import { mockUser } from '../mock/mockData.js';
import { themeColors, themeColorNames, socialLinkList } from '../../utils/constraints.js';
import { tables as t } from '../../../knexfile.js';

const { email } = mockUser;

export async function seed(knex: Knex): Promise<void> {
	await knex(t.userProfile).del();
	await knex(t.userSettings).del();
	await knex(t.theme).del();
	await knex(t.themeColor).del();
	await knex(t.socialLinkList).del();

	// create user settings
	const { userId } = await knex(t.user).select('user_id').where({ email }).first();

	await knex(t.userProfile).insert({ user_id: userId });

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

	// create social media link options
	const dbReadyLinks = socialLinkList.map((link) => ({
		social_link_name: link,
	}));
	await knex(t.socialLinkList).insert(dbReadyLinks);

	// create default user settings
	await knex(t.userSettings).insert({ user_id: userId, theme_id: themeId });
}
