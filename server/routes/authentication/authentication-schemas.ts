import { z } from 'zod';

export const RegisterSchema = z
	.object({
		user_id: z.uuid(),
		first_name: z.string().max(100),
		last_name: z.string().max(100),
		email: z.email(),
		avatar_url: z.url().optional(),
		supabase_refresh_token: z.string().optional(),
	})
	.strict();

export const LoginSchema = z
	.object({
		email: z.email(),
		user_id: z.uuid(),
		first_name: z.string().max(100).optional(),
		last_name: z.string().max(100).optional(),
		avatar_url: z.url().optional(),
		supabase_refresh_token: z.string().optional(),
	})
	.strict();

export type RegisterData = z.infer<typeof RegisterSchema>;
export type LoginData = z.infer<typeof LoginSchema>;
