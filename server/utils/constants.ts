export const DEFAULT_PALETTE_COLOR = 'palette-01';
export const DEFAULT_PALETTE = 'tidytrek';

export const cookieName = 'tidytrek_token';
export const supabaseCookieName = 'supabase_refresh';

export const domainName =
	process.env.NODE_ENV === 'production' ? '.tidytrek.co' : undefined;

export const cookieOptions = {
	httpOnly: true,
	maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days with rolling expiration
	signed: true,
	domain: domainName,
};

export const supabaseCookieOptions = {
	httpOnly: true,
	maxAge: 1000 * 60 * 60 * 24 * 14, // 14 days (shorter for security)
	signed: true,
	domain: domainName,
};
