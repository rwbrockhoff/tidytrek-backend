import { z } from 'zod';

export const RegisterSchema = z.object({
	user_id: z.string().uuid(),
	first_name: z.string().max(100),
	last_name: z.string().max(100),
	email: z.string().email(),
	avatar_url: z.string().url().optional(),
	supabase_refresh_token: z.string().optional(),
}).strict();

export const LoginSchema = z.object({
	email: z.string().email(),
	user_id: z.string().uuid(),
	first_name: z.string().max(100).optional(),
	last_name: z.string().max(100).optional(),
	avatar_url: z.string().url().optional(),
	supabase_refresh_token: z.string().optional(),
}).strict();

export type RegisterData = z.infer<typeof RegisterSchema>;
export type LoginData = z.infer<typeof LoginSchema>;