import type { ErrorRequestHandler } from "express";

type AppError = {
	statusCode?: number;
	message?: string;
	stack?: string;
};

export const errorMiddleware: ErrorRequestHandler = (err, _req, res, _next) => {
	const appError = err as AppError;

	const statusCode =
		typeof appError.statusCode === "number" ? appError.statusCode : 500;

	const message =
		typeof appError.message === "string" && appError.message.trim().length > 0
			? appError.message
			: "Server error";

	const isProduction = process.env.NODE_ENV === "production";

	const responseBody: {
		success: boolean;
		message: string;
		details?: unknown;
	} = {
		success: false,
		message,
	};

	if (!isProduction && appError.stack) {
		responseBody.details = appError.stack;
	}

	res.status(statusCode).json(responseBody);
};

