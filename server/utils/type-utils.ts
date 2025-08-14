import { z } from 'zod';

// Extract typed field names from Zod schema for .select() calls
export function getSchemaFields<T extends z.ZodRawShape>(
	schema: z.ZodObject<T>
): (keyof z.infer<typeof schema>)[] {
	return Object.keys(schema.shape) as (keyof z.infer<typeof schema>)[];
}