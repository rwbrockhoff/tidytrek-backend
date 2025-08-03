// Types required for server configuration that don't merit having
// their own separate file such as only needing one custom type for Knex config

// Middleware types
export interface UserAttachedToMiddleware {
	user_id: string;
	name: string;
	email: string;
	username: string;
}

export interface CookieAttachedToMiddleware {
	cookie: string;
}

// Middleware types
export interface UserAttachedToRequest {
	user: UserAttachedToMiddleware;
	userId: string;
	cookie: string;
}
