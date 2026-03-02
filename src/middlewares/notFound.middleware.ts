import type { RequestHandler } from "express";

export const notFoundMiddleware: RequestHandler = (_req, res, _next) => {
	res.status(404).json({
		success: false,
		message: "Route not found",
	});
};

