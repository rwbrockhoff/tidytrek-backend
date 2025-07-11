import { z } from 'zod';

export const PackUpdateSchema = z.object({
	pack_name: z.string().min(1).max(100).optional(),
	pack_description: z.string().max(500).optional(),
	pack_location_tag: z.string().max(50).optional(),
	pack_duration_tag: z.string().max(50).optional(),
	pack_season_tag: z.string().max(50).optional(),
	pack_distance_tag: z.string().max(50).optional(),
	pack_public: z.boolean().optional(),
	pack_affiliate: z.boolean().optional(),
	pack_affiliate_description: z.string().max(500).optional(),
	pack_url_name: z.string().max(100).optional(),
	pack_url: z.string().url().optional(),
	pack_views: z.number().int().min(0).optional(),
}).strict();

export const PackImportSchema = z.object({
	pack_url: z.string().url(),
	palette_list: z.array(z.string()).optional(),
}).strict();

export const PackMoveSchema = z.object({
	prev_pack_index: z.string().optional(),
	next_pack_index: z.string().optional(),
}).strict();

export type PackUpdate = z.infer<typeof PackUpdateSchema>;
export type PackImport = z.infer<typeof PackImportSchema>;
export type PackMove = z.infer<typeof PackMoveSchema>;