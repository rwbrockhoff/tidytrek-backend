import { validateEnvironment } from '../config/environment.js';

const env = validateEnvironment();

export const DEFAULT_PALETTE_COLOR = 'palette-01';
export const DEFAULT_PALETTE = 'tidytrek';

export const supabaseCookieName = 'supabase_refresh';

export const domainName = env.NODE_ENV === 'production' ? '.tidytrek.co' : undefined;

export const supabaseCookieOptions = {
	httpOnly: true,
	maxAge: 1000 * 60 * 60 * 24 * 14, // 14 days
	signed: true,
	domain: domainName,
};
