import { z } from 'zod';

export const PackBookmarkSchema = z
	.object({
		pack_bookmark_id: z.number().int().positive().optional(),
		user_id: z.string().optional(),
		pack_id: z.number().int().positive(),
		created_at: z.string().optional(),
		updated_at: z.string().optional(),
	})
	.strict();

export const AddPackBookmarkSchema = z
	.object({
		pack_id: z.number().int().positive(),
	})
	.strict();

export const PackBookmarkFields = Object.keys(PackBookmarkSchema.shape);

export type PackBookmark = z.infer<typeof PackBookmarkSchema>;
export type AddPackBookmark = z.infer<typeof AddPackBookmarkSchema>;