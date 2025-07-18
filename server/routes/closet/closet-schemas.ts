import { z } from 'zod';

export const GearClosetItemUpdateSchema = z
	.object({
		pack_item_id: z.number().int().positive().optional(),
		pack_id: z.number().int().positive().nullable().optional(),
		pack_category_id: z.number().int().positive().nullable().optional(),
		pack_item_index: z.string().optional(),
		pack_item_name: z.string().max(200).optional(),
		pack_item_description: z.string().max(500).optional().nullish(),
		pack_item_weight: z.coerce.number().min(0).optional(),
		pack_item_unit: z.string().max(10).optional(),
		pack_item_quantity: z.coerce.number().int().min(1).optional(),
		pack_item_url: z.string().optional().nullish(),
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

export const gearClosetItemFields = Object.keys(GearClosetItemUpdateSchema.shape);

export type GearClosetItemUpdate = z.infer<typeof GearClosetItemUpdateSchema>;
export type GearClosetItemMove = z.infer<typeof GearClosetItemMoveSchema>;
export type MoveItemToPack = z.infer<typeof MoveItemToPackSchema>;
