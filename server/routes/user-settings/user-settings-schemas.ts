import { z } from 'zod';

export const UserSettingsUpdateSchema = z.object({
	public_profile: z.boolean().optional(),
	palette: z.string().max(25).optional(),
	dark_mode: z.boolean().optional(),
	weight_unit: z.enum(['imperial', 'metric']).optional(),
	currency_unit: z.string().max(10).optional(),
}).strict();

export type UserSettingsUpdate = z.infer<typeof UserSettingsUpdateSchema>;