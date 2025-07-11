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

export const PackItemCreateSchema = z.object({
	pack_id: z.number().int().positive(),
	pack_category_id: z.number().int().positive(),
}).strict();

export const PackItemUpdateSchema = z.object({
	pack_item_name: z.string().max(100).optional(),
	pack_item_description: z.string().max(500).optional(),
	pack_item_quantity: z.number().int().min(1).optional(),
	pack_item_weight: z.number().min(0).optional(),
	pack_item_unit: z.string().max(10).optional(),
	pack_item_price: z.number().min(0).optional(),
	pack_item_url: z.string().url().optional(),
	worn_weight: z.boolean().optional(),
	consumable: z.boolean().optional(),
	favorite: z.boolean().optional(),
}).strict();

export const PackItemMoveSchema = z.object({
	pack_category_id: z.number().int().positive(),
	prev_pack_category_id: z.number().int().positive(),
	prev_item_index: z.string().optional(),
	next_item_index: z.string().optional(),
}).strict();

export const PackCategoryCreateSchema = z.object({
	category_color: z.string().max(50),
}).strict();

export const PackCategoryUpdateSchema = z.object({
	pack_category_name: z.string().max(100).optional(),
	pack_category_color: z.string().max(50).optional(),
}).strict();

export const PackCategoryMoveSchema = z.object({
	prev_category_index: z.string().optional(),
	next_category_index: z.string().optional(),
}).strict();

export type PackUpdate = z.infer<typeof PackUpdateSchema>;
export type PackImport = z.infer<typeof PackImportSchema>;
export type PackMove = z.infer<typeof PackMoveSchema>;
export type PackItemCreate = z.infer<typeof PackItemCreateSchema>;
export type PackItemUpdate = z.infer<typeof PackItemUpdateSchema>;
export type PackItemMove = z.infer<typeof PackItemMoveSchema>;
export type PackCategoryCreate = z.infer<typeof PackCategoryCreateSchema>;
export type PackCategoryUpdate = z.infer<typeof PackCategoryUpdateSchema>;
export type PackCategoryMove = z.infer<typeof PackCategoryMoveSchema>;