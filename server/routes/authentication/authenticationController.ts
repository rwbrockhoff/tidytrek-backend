import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import knex from '../../db/connection.js';
import { randomBytes } from 'node:crypto';
import postmark from 'postmark';
import { Request, Response } from 'express';
import { tables as t } from '../../../knexfile.js';

const cookieOptions = {
	httpOnly: true,
	maxAge: 1000 * 60 * 60 * 24 * 180, // 180 days
	signed: true,
};

const saltRounds = 10;

const tokenExpirationWindow = 7200000; // 2 hours

async function register(req: Request, res: Response) {
	try {
		const { email, password, first_name, last_name, username } = req.body;

		const { unique, message } = await isUniqueAccount(email, username);

		if (!unique) return res.status(409).json({ error: message });

		const hash = await bcrypt.hash(password, saltRounds);

		const [user] = await knex(t.user).insert(
			{ email, first_name, last_name, password: hash, username: username || null },
			['user_id', 'first_name', 'last_name', 'email', 'username'],
		);

		// set up defaults
		await createDefaultPack(user.userId);
		await createUserSettings(user.userId);

		// add jwt + signed cookie
		const token = createWebToken(user.userId);
		res.cookie('token', token, cookieOptions);

		// just an extra precaution, password should never exist on user object in register fn()
		if (user.password) delete user.password;
		res.status(200).json({ user });
	} catch (err) {
		res.status(400).json({ error: err });
	}
}

async function login(req: Request, res: Response) {
	const errorText = 'Invaid login information.';
	try {
		const { email, password } = req.body;

		if (!email && !password) return res.status(400).json({ error: errorText });

		const user = await knex(t.user)
			.select('user_id', 'first_name', 'last_name', 'email', 'username', 'password')
			.where({ email })
			.first();

		if (user === undefined)
			return res.status(400).json({ error: 'No account found. Feel free to sign up.' });

		const passwordsMatch = await bcrypt.compare(password, user.password);

		if (passwordsMatch) {
			// create token + cookie
			const token = createWebToken(user.userId);
			res.cookie('token', token, cookieOptions);
			// send back user, no password attached
			delete user.password;
			if (!user.password) res.status(200).json({ user });
			else res.status(400).json({ error: errorText });
		} else {
			res.status(400).json({ error: errorText });
		}
	} catch (err) {
		res.status(400).json({ error: errorText });
	}
}

async function logout(_req: Request, res: Response) {
	return res.status(200).clearCookie('token').json({
		message: 'User has been logged out.',
	});
}

async function getAuthStatus(req: Request, res: Response) {
	try {
		if (req.user && req.userId) {
			// attach settings
			const settings = await getUserSettings(req.userId);
			res.status(200).json({ isAuthenticated: true, user: req.user, settings });
		} else {
			res.status(200).json({ isAuthenticated: req.userId !== undefined });
		}
	} catch (err) {
		res.status(400).json({ error: 'There was an error checking your log in status.' });
	}
}

export async function getUserSettings(userId: number) {
	const [settings] = await knex.raw(`
		select us.public_profile, us.topo_background, us.dark_theme, us.weight_unit, 
		theme_info.theme_name, theme_info.theme_colors from user_settings us
			left outer join (
				select th.theme_id, th.theme_name, th.tidytrek_theme, 
				array_agg(to_jsonb(theme_colors)) as theme_colors from theme th
				left outer join 
				(select tc.theme_id, tc.theme_color, tc.theme_color_name from theme_color tc
				) theme_colors on th.theme_id = theme_colors.theme_id
			group by th.theme_id
			) theme_info on us.theme_id = theme_info.theme_id
			where us.user_id = ${userId} AND us.theme_id = theme_info.theme_id;
	`);
	return settings;
}

async function changePassword(req: Request, res: Response) {
	try {
		const { userId } = req;
		const { current_password, new_password, confirm_new_password } = req.body;

		if (new_password !== confirm_new_password) {
			return res.status(400).json({ error: 'Passwords do not match. Please try again.' });
		}
		const { password } = await knex(t.user)
			.select('password')
			.where({ user_id: userId })
			.first();
		const correctPassword = await bcrypt.compare(current_password, password);
		if (!correctPassword) {
			return res.status(400).json({ error: 'Incorrect password. Please try again.' });
		}

		if (correctPassword) {
			const hash = await bcrypt.hash(new_password, saltRounds);
			await knex(t.user).update({ password: hash }).where({ user_id: userId });
		}

		return res.status(200).send();
	} catch (err) {
		res.status(400).json({ error: 'There was an error changing your password.' });
	}
}

async function requestResetPassword(req: Request, res: Response) {
	try {
		const errorMessage = 'We could not verify your account information at this time.';
		const { email } = req.body;
		const [user] = await knex(t.user).select('first_name', 'email').where({ email });

		if (!user.email) {
			return res.status(400).json({
				error: errorMessage,
			});
		}
		const token = await createRandomId();
		const expiration = Date.now() + tokenExpirationWindow;

		const updateUserResponse = await knex(t.user)
			.update({
				reset_password_token: token,
				reset_password_token_expiration: expiration,
			})
			.where({ email });

		if (updateUserResponse) {
			await createResetPasswordEmail(user.firstName, user.email, token);
			return res.status(200).send();
		} else {
			return res.status(400).json({ error: errorMessage });
		}
	} catch (err) {
		res.status(400).json({ error: 'There was an error reseting your password.' });
	}
}

async function confirmResetPassword(req: Request, res: Response) {
	try {
		const { password, confirm_password, reset_token } = req.body;

		if (password !== confirm_password)
			return res.status(400).json({ error: 'Passwords do not match.' });

		const resetTokenInfo = await knex(t.user)
			.select('reset_password_token_expiration')
			.where({ reset_password_token: reset_token })
			.first();

		if (!resetTokenInfo) {
			return res.status(400).json({
				error: 'We could not confirm your password reset. Please try again.',
			});
		}
		// if token is expired
		const { resetPasswordTokenExpiration } = resetTokenInfo;
		const current = Date.now();
		const diff = tokenExpirationWindow - Math.abs(current - resetPasswordTokenExpiration);
		if (diff <= 0)
			return res.status(400).json({
				error: 'Your request has expired. Reset your password and try again.',
			});

		const hash = await bcrypt.hash(password, saltRounds);

		const [user] = await knex(t.user)
			.update(
				{
					password: hash,
					reset_password_token: null,
					reset_password_token_expiration: null,
				},
				['user_id', 'first_name', 'last_name', 'email', 'username'],
			)
			.where({ reset_password_token: reset_token });

		// add jwt + signed cookie
		const jwtToken = createWebToken(user.userId);
		res.cookie('token', jwtToken, cookieOptions);

		return res.status(200).json({ user });
	} catch (err) {
		return res.status(400).json({ error: 'There was an error reseting your password.' });
	}
}

async function deleteAccount(req: Request, res: Response) {
	try {
		const { userId } = req;

		await knex(t.user).del().where({ user_id: userId });

		return res.status(200).clearCookie('token').json({
			message: 'User has been logged out.',
		});
	} catch (err) {
		return res.status(400).json({ error: 'There was an error deleting your account.' });
	}
}

function createWebToken(userId: number) {
	if (process.env.APP_SECRET) {
		return jwt.sign({ userId }, process.env.APP_SECRET);
	} else {
		return new Error('Invalid app secret when creating JWT.');
	}
}

async function createRandomId(): Promise<string> {
	return await randomBytes(16).toString('hex');
}

async function createResetPasswordEmail(name: string, email: string, token: string) {
	try {
		const client = new postmark.ServerClient(`${process.env.POSTMARK_TOKEN}`);

		await client.sendEmailWithTemplate({
			From: 'info@tidytrek.co',
			To: email,
			TemplateId: 34543255,
			MessageStream: 'transaction-emails-password-re',
			TemplateModel: {
				name: name || 'friend',
				product_name: 'Tidytrek',
				action_url: `${process.env.FRONTEND_URL}/reset-password/${token}`,
				support_url: 'https://tidytrek.co',
			},
		});
	} catch (err) {
		if (typeof err === 'string') return new Error(err);
		else
			return new Error('There was an error sending reset password email via postmark.');
	}
}

async function createUserSettings(userId: number) {
	const { themeId } = await knex(t.theme)
		.select('theme_id')
		.where({ tidytrek_theme: true })
		.first();
	await knex(t.userSettings).insert({ user_id: userId, theme_id: themeId });
}

async function createDefaultPack(userId: number) {
	try {
		const [{ packId }] = await knex(t.pack)
			.insert({
				user_id: userId,
				pack_name: 'Default Pack',
				pack_index: 0,
			})
			.returning('pack_id');

		const [{ packCategoryId }] = await knex(t.packCategory)
			.insert({
				user_id: userId,
				pack_id: packId,
				pack_category_name: 'Default Category',
				pack_category_index: 0,
				pack_category_color: 'primary',
			})
			.returning('pack_category_id');

		await knex(t.packItem).insert({
			user_id: userId,
			pack_id: packId,
			pack_category_id: packCategoryId,
			pack_item_name: '',
			pack_item_index: 0,
		});
	} catch (err) {
		return new Error('Error creating default pack for user');
	}
}

async function isUniqueAccount(email: string, username: string) {
	const existingEmail = await knex(t.user).select('email').where({ email }).first();

	if (existingEmail) {
		return {
			unique: false,
			message: 'Account is already registered. Please log in.',
		};
	}

	if (username && username.length) {
		const existingUsername = await knex(t.user)
			.select('username')
			.where({ username })
			.first();

		if (existingUsername)
			return {
				unique: false,
				message: 'That username is already taken. Good choice but try again!',
			};
	}
	return { unique: true };
}

export default {
	register,
	login,
	logout,
	getAuthStatus,
	changePassword,
	requestResetPassword,
	confirmResetPassword,
	deleteAccount,
};
