import { z } from 'zod';
import { WeightUnit, WEIGHT_UNIT_VALUES } from '../../types/units.js';
import { getSchemaFields } from '../../utils/type-utils.js';

export const GearClosetItemUpdateSchema = z
	.object({
		pack_item_id: z.number().int().positive().optional(),
		pack_id: z.number().int().positive().nullish(),
		pack_category_id: z.number().int().positive().nullish(),
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

export const GearClosetItemMoveSchema = z
	.object({
		prev_item_index: z.string().optional(),
		next_item_index: z.string().optional(),
	})
	.strict();

export const MoveItemToPackSchema = z
	.object({
		pack_item_id: z.number().int().positive(),
		pack_id: z.union([z.number(), z.string()]),
		pack_category_id: z.union([z.number(), z.string()]),
		pack_item_index: z.string(),
	})
	.strict();

export const gearClosetItemFields = getSchemaFields(GearClosetItemUpdateSchema);

export type GearClosetItemUpdate = z.infer<typeof GearClosetItemUpdateSchema>;
export type GearClosetItemMove = z.infer<typeof GearClosetItemMoveSchema>;
export type MoveItemToPack = z.infer<typeof MoveItemToPackSchema>;
