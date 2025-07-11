import { z } from 'zod';

export const UserSettingsUpdateSchema = z.object({
	public_profile: z.boolean().optional(),
	palette: z.string().optional(),
	dark_mode: z.boolean().optional(),
	weight_unit: z.string().optional(),
	currency_unit: z.string().optional(),
}).strict();

export type UserSettingsUpdate = z.infer<typeof UserSettingsUpdateSchema>;