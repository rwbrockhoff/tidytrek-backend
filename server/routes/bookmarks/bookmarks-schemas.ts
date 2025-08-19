import { z } from 'zod';

export const AddBookmarkSchema = z
	.object({
		pack_id: z.number().int().positive(),
	})
	.strict();

export type AddBookmarkRequest = z.infer<typeof AddBookmarkSchema>;