import { z } from 'zod';

export const ProfileSettingsUpdateSchema = z.object({
	username: z.string().min(1).max(50).optional(),
	trail_name: z.string().max(100).optional(),
	user_bio: z.string().max(500).optional(),
	user_location: z.string().max(100).optional(),
}).strict();

export const UsernameUpdateSchema = z.object({
	username: z.string().min(1).max(50).optional(),
	trail_name: z.string().max(100).optional(),
}).strict();

export const SocialLinkCreateSchema = z.object({
	platform_name: z.string().min(1).max(50),
	social_link_url: z.string().url(),
}).strict();

export type ProfileSettingsUpdate = z.infer<typeof ProfileSettingsUpdateSchema>;
export type UsernameUpdate = z.infer<typeof UsernameUpdateSchema>;
export type SocialLinkCreate = z.infer<typeof SocialLinkCreateSchema>;