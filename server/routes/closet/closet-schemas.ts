import { z } from 'zod';

export const GearClosetItemUpdateSchema = z.object({
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

export const GearClosetItemMoveSchema = z.object({
	prev_item_index: z.string().optional(),
	next_item_index: z.string().optional(),
}).strict();

export const MoveItemToPackSchema = z.object({
	pack_id: z.number().int().positive(),
	pack_category_id: z.number().int().positive(),
}).strict();

export type GearClosetItemUpdate = z.infer<typeof GearClosetItemUpdateSchema>;
export type GearClosetItemMove = z.infer<typeof GearClosetItemMoveSchema>;
export type MoveItemToPack = z.infer<typeof MoveItemToPackSchema>;