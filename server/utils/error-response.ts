import { Response } from 'express';

export enum ErrorCode {
	VALIDATION_ERROR = 'VALIDATION_ERROR',
	AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
	AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
	NOT_FOUND = 'NOT_FOUND',
	CONFLICT = 'CONFLICT',
	FILE_UPLOAD_ERROR = 'FILE_UPLOAD_ERROR',
	INTERNAL_ERROR = 'INTERNAL_ERROR',
}

export const HTTP_STATUS = {
	OK: 200,
	BAD_REQUEST: 400,
	UNAUTHORIZED: 401,
	FORBIDDEN: 403,
	NOT_FOUND: 404,
	CONFLICT: 409,
	INTERNAL_SERVER_ERROR: 500,
} as const;

interface ErrorResponse {
	success: false;
	error: {
		message: string;
		code?: ErrorCode;
		details?: unknown;
	};
}

export const errorResponse = (
	res: Response,
	status: number,
	message: string,
	code?: ErrorCode,
	details?: unknown,
): Response<ErrorResponse> => {
	return res.status(status).json({
		success: false,
		error: {
			message,
			code,
			details,
		},
	});
};

export const successResponse = (
	res: Response,
	data?: unknown,
	message?: string,
	status: number = HTTP_STATUS.OK,
) => {
	return res.status(status).json({
		success: true,
		data,
		message,
	});
};

// Common error utils
export const badRequest = (res: Response, message: string, details?: unknown) =>
	errorResponse(
		res,
		HTTP_STATUS.BAD_REQUEST,
		message,
		ErrorCode.VALIDATION_ERROR,
		details,
	);

export const unauthorized = (
	res: Response,
	message: string = 'Authentication required',
) =>
	errorResponse(res, HTTP_STATUS.UNAUTHORIZED, message, ErrorCode.AUTHENTICATION_ERROR);

export const forbidden = (res: Response, message: string = 'Access denied') =>
	errorResponse(res, HTTP_STATUS.FORBIDDEN, message, ErrorCode.AUTHORIZATION_ERROR);

export const notFound = (res: Response, message: string = 'Resource not found') =>
	errorResponse(res, HTTP_STATUS.NOT_FOUND, message, ErrorCode.NOT_FOUND);

export const conflict = (res: Response, message: string, details?: unknown) =>
	errorResponse(res, HTTP_STATUS.CONFLICT, message, ErrorCode.CONFLICT, details);

export const internalError = (res: Response, message: string = 'Internal server error') =>
	errorResponse(
		res,
		HTTP_STATUS.INTERNAL_SERVER_ERROR,
		message,
		ErrorCode.INTERNAL_ERROR,
	);
