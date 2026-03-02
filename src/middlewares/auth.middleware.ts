import type { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { AuthRequest } from "../types/express";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;

export function protect(
	req: AuthRequest,
	res: Response,
	next: NextFunction,
): void {
	const authHeader = req.headers.authorization;
	const token =
		authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;

	if (!token) {
		res.status(401).json({
			success: false,
			message: "Access token required",
		});
		return;
	}

	if (!ACCESS_SECRET) {
		res.status(500).json({
			success: false,
			message: "Server error",
		});
		return;
	}

	try {
		const decoded = jwt.verify(token, ACCESS_SECRET);
		if (
			typeof decoded !== "object" ||
			decoded === null ||
			typeof (decoded as { userId?: unknown }).userId !== "string"
		) {
			res.status(401).json({
				success: false,
				message: "Invalid token",
			});
			return;
		}
		req.user = { userId: (decoded as { userId: string }).userId };
		next();
	} catch {
		res.status(401).json({
			success: false,
			message: "Invalid or expired token",
		});
	}
}
