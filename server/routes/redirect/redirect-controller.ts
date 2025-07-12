import { Response } from 'express';
import { ValidatedRequest } from '../../utils/validation.js';
import { RedirectRequest } from './redirect-schemas.js';

const TRUSTED_DOMAINS = [
	'amazon.com',
	'rei.com',
	'patagonia.com',
	'backcountry.com',
	'cotopaxi.com',
	'garagegrowngear.com',
	'youtube.com',
	'instagram.com',
	'alltrails.com',
	'lighterpack.com',
	'decathalon.com',
];

async function handleRedirect(req: ValidatedRequest<RedirectRequest>, res: Response) {
	try {
		const { url, confirmed } = req.validatedBody;

		const parsedUrl = new URL(url);
		const domain = parsedUrl.hostname.replace('www.', '');
		const isTrusted = TRUSTED_DOMAINS.some(
			(trusted) => domain === trusted || domain.endsWith(`.${trusted}`),
		);

		if (confirmed === 'true' || isTrusted) {
			return res.status(200).json({
				trusted: true,
				redirectUrl: url,
			});
		}

		return res.status(200).json({
			warning: true,
			message: `You're about to leave TidyTrek and visit ${domain}`,
			destination: domain,
			continueUrl: url,
		});
	} catch (err) {
		return res.status(400).json({ error: 'Invalid URL provided' });
	}
}

export default { handleRedirect };
