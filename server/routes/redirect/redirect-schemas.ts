import { z } from 'zod';

export const RedirectRequestSchema = z
	.object({
		url: z.url(),
		confirmed: z.string().optional(),
	})
	.strict();

export type RedirectRequest = z.infer<typeof RedirectRequestSchema>;
