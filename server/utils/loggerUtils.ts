// Utility functions for consistent error logging

export const extractError = (err: unknown): string => {
	return err instanceof Error ? err.message : 'Unknown error';
};

export const extractStack = (err: unknown): string | undefined => {
	return err instanceof Error ? err.stack : undefined;
};

// Helper to create standardized error log data
export const createErrorLogData = (
	err: unknown,
	additionalData: Record<string, unknown> = {},
) => {
	return {
		error: extractError(err),
		stack: extractStack(err),
		...additionalData,
	};
};
