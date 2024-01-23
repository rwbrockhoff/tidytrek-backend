// Types required for server configuration that don't merit having
// their own separate file such as only needing one custom type for Knex config

export type KnexResponse = {
	rows: readonly unknown[] | Record<string, unknown>;
};

// Middleware types
export interface UserAttachedToMiddleware {
	user_id: number;
	name: string;
	email: string;
	username: string;
}

// Middleware types
export interface UserAttachedToRequest {
	user: UserAttachedToMiddleware;
	userId: number;
}
