import { z } from 'zod';
import { WeightUnit, WEIGHT_UNIT_VALUES } from '../../types/units.js';

export const PackUpdateSchema = z
	.object({
		pack_id: z.number().int().positive().optional(),
		user_id: z.string().optional(),
		pack_index: z.string().optional(),
		pack_name: z.string().min(1).max(100).nullish(),
		pack_description: z.string().max(500).nullish(),
		pack_location_tag: z.string().max(50).nullish(),
		pack_duration_tag: z.string().max(50).nullish(),
		pack_season_tag: z.string().max(50).nullish(),
		pack_distance_tag: z.string().max(50).nullish(),
		pack_public: z.boolean().optional(),
		pack_pricing: z.boolean().optional(),
		pack_url_name: z.string().max(100).nullish(),
		pack_url: z.string().optional(),
		pack_photo_url: z.string().nullish(),
		pack_affiliate: z.boolean().optional(),
		pack_affiliate_description: z.string().max(500).nullish(),
		pack_views: z.number().int().min(0).optional(),
		pack_bookmark_count: z.number().int().optional(),
	})
	.strict();

export const packFields = Object.keys(PackUpdateSchema.shape);

export const PackImportSchema = z
	.object({
		pack_url: z.string().url(),
		palette_list: z.array(z.string()).optional(),
	})
	.strict();

export const PackMoveSchema = z
	.object({
		prev_pack_index: z.string().optional(),
		next_pack_index: z.string().optional(),
	})
	.strict();

export const PackItemCreateSchema = z
	.object({
		pack_id: z.number().int().positive(),
		pack_category_id: z.number().int().positive(),
	})
	.strict();

export const PackItemUpdateSchema = z
	.object({
		pack_item_id: z.number().int().positive().optional(),
		pack_id: z.number().int().positive().optional(),
		pack_category_id: z.number().int().positive().optional(),
		pack_item_index: z.string().optional(),
		pack_item_name: z.string().max(200).optional(),
		pack_item_description: z.string().max(500).nullish(),
		pack_item_weight: z.coerce.number().min(0).optional(),
		pack_item_weight_unit: z.enum(WEIGHT_UNIT_VALUES).default(WeightUnit.oz).optional(),
		pack_item_quantity: z.coerce.number().int().min(1).optional(),
		pack_item_url: z.string().nullish(),
		worn_weight: z.boolean().optional(),
		consumable: z.boolean().optional(),
		favorite: z.boolean().optional(),
		pack_item_price: z.coerce.number().min(0).optional(),
		user_id: z.string().optional(),
	})
	.strict();

export const PackItemMoveSchema = z
	.object({
		pack_id: z.number().nullable(),
		pack_item_id: z.string(),
		pack_category_id: z.string(),
		prev_pack_category_id: z.string(),
		prev_item_index: z.string().optional(),
		next_item_index: z.string().optional(),
		source_index: z.number().optional(),
		destination_index: z.number().optional(),
	})
	.strict();

export const PackCategoryCreateSchema = z
	.object({
		category_color: z.string().max(50),
	})
	.strict();

export const PackCategoryUpdateSchema = z
	.object({
		pack_category_id: z.number().int().positive().optional(),
		user_id: z.string().optional(),
		pack_id: z.number().int().positive().optional(),
		pack_category_name: z.string().max(100).optional(),
		pack_category_color: z.string().max(50).optional(),
		pack_category_index: z.string().optional(),
	})
	.strict();

export const PackCategoryMoveSchema = z
	.object({
		prev_category_index: z.string().optional(),
		next_category_index: z.string().optional(),
	})
	.strict();

export const packItemFields = Object.keys(PackItemUpdateSchema.shape);

export const packCategoryFields = Object.keys(PackCategoryUpdateSchema.shape);

export type PackUpdate = z.infer<typeof PackUpdateSchema>;
export type PackImport = z.infer<typeof PackImportSchema>;
export type PackMove = z.infer<typeof PackMoveSchema>;
export type PackItemCreate = z.infer<typeof PackItemCreateSchema>;
export type PackItemUpdate = z.infer<typeof PackItemUpdateSchema>;
export type PackItemMove = z.infer<typeof PackItemMoveSchema>;
export type PackCategoryCreate = z.infer<typeof PackCategoryCreateSchema>;
export type PackCategoryUpdate = z.infer<typeof PackCategoryUpdateSchema>;
export type PackCategoryMove = z.infer<typeof PackCategoryMoveSchema>;
