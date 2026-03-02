import jwt from "jsonwebtoken";

type CookieOptions = {
	httpOnly?: boolean;
	sameSite?: boolean | "lax" | "strict" | "none";
	secure?: boolean;
	path?: string;
	maxAge?: number;
};

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const ACCESS_EXP = process.env.ACCESS_TOKEN_EXPIRES_IN ?? "15m";
const REFRESH_EXP = process.env.REFRESH_TOKEN_EXPIRES_IN ?? "7d";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export function signAccessToken(payload: { userId: string }): string {
	if (!ACCESS_SECRET) {
		throw new Error("JWT_ACCESS_SECRET is not set");
	}
	return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXP });
}

export function signRefreshToken(payload: { userId: string }): string {
	if (!REFRESH_SECRET) {
		throw new Error("JWT_REFRESH_SECRET is not set");
	}
	return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXP });
}

export function verifyRefreshToken(token: string): { userId: string } {
	if (!REFRESH_SECRET) {
		throw new Error("JWT_REFRESH_SECRET is not set");
	}
	const decoded = jwt.verify(token, REFRESH_SECRET);
	if (
		typeof decoded !== "object" ||
		decoded === null ||
		typeof (decoded as { userId?: unknown }).userId !== "string"
	) {
		throw new Error("Invalid refresh token payload");
	}
	return { userId: (decoded as { userId: string }).userId };
}

export function getRefreshCookieOptions(): CookieOptions {
	const isProduction = process.env.NODE_ENV === "production";
	return {
		httpOnly: true,
		sameSite: "lax",
		secure: isProduction,
		path: "/api/auth/refresh",
		maxAge: SEVEN_DAYS_MS,
	};
}

export function getRefreshCookieName(): string {
	return process.env.COOKIE_REFRESH_NAME ?? "refreshToken";
}
