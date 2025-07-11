import { z } from 'zod';

export const RegisterSchema = z.object({
	user_id: z.string().uuid(),
	email: z.string().email(),
	supabase_refresh_token: z.string().optional(),
	first_name: z.string().max(100).optional(),
	last_name: z.string().max(100).optional(),
	avatar_url: z.string().url().optional(),
}).strict();

export const LoginSchema = z.object({
	user_id: z.string().uuid(),
	email: z.string().email(),
	supabase_refresh_token: z.string().optional(),
	first_name: z.string().max(100).optional(),
	last_name: z.string().max(100).optional(),
	avatar_url: z.string().url().optional(),
}).strict();

export type RegisterData = z.infer<typeof RegisterSchema>;
export type LoginData = z.infer<typeof LoginSchema>;