import type { RequestHandler } from "express";
import bcrypt from "bcrypt";
import { Types } from "mongoose";
import { UserModel } from "../models/user.model";
import {
	signAccessToken,
	signRefreshToken,
	verifyRefreshToken,
	getRefreshCookieOptions,
	getRefreshCookieName,
} from "../utils/tokens";
import type { AuthRequest } from "../types/express";

type AppError = Error & { statusCode?: number };

const SALT_ROUNDS = 10;

const MIN_PHONE_LENGTH = 10;

export const register: RequestHandler = async (req, res, next) => {
	try {
		const email =
			typeof req.body.email === "string" ? req.body.email.trim() : undefined;
		const password =
			typeof req.body.password === "string" ? req.body.password : undefined;
		const name =
			typeof req.body.name === "string" ? req.body.name.trim() : undefined;
		const phone =
			typeof req.body.phone === "string" ? req.body.phone.trim() : undefined;

		if (!email || !password) {
			const err: AppError = new Error("Email and password are required");
			err.statusCode = 400;
			return next(err);
		}

		if (!phone) {
			const err: AppError = new Error("Phone is required");
			err.statusCode = 400;
			return next(err);
		}

		if (phone.length < MIN_PHONE_LENGTH) {
			const err: AppError = new Error(
				`Phone must be at least ${MIN_PHONE_LENGTH} characters`,
			);
			err.statusCode = 400;
			return next(err);
		}

		const existingByEmail = await UserModel.findOne({
			email: email.toLowerCase(),
		});
		if (existingByEmail) {
			const err: AppError = new Error("Email already registered");
			err.statusCode = 409;
			return next(err);
		}

		const existingByPhone = await UserModel.findOne({ phone });
		if (existingByPhone) {
			const err: AppError = new Error("Phone already registered");
			err.statusCode = 409;
			return next(err);
		}

		const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

		const user = await UserModel.create({
			email: email.toLowerCase(),
			passwordHash,
			phone,
			...(name ? { name } : {}),
		});

		const userId = (user._id as Types.ObjectId).toString();
		const accessToken = signAccessToken({ userId, role: user.role });
		const refreshToken = signRefreshToken({ userId });
		const refreshTokenHash = await bcrypt.hash(refreshToken, SALT_ROUNDS);

		await UserModel.updateOne(
			{ _id: user._id },
			{ $set: { refreshTokenHash } },
		);

		const cookieName = getRefreshCookieName();
		res.cookie(cookieName, refreshToken, getRefreshCookieOptions());

		res.status(201).json({
			success: true,
			data: {
				user: {
					id: userId,
					email: user.email,
					name: user.name ?? null,
					phone: user.phone,
					role: user.role,
				},
				accessToken,
			},
		});
	} catch (error) {
		next(error);
	}
};

export const login: RequestHandler = async (req, res, next) => {
	try {
		const identifier =
			typeof req.body.identifier === "string"
				? req.body.identifier.trim()
				: undefined;
		const password =
			typeof req.body.password === "string" ? req.body.password : undefined;

		if (!identifier || !password) {
			const err: AppError = new Error("Identifier and password are required");
			err.statusCode = 400;
			return next(err);
		}

		const user = await UserModel.findOne({
			$or: [
				{ email: identifier.toLowerCase() },
				{ phone: identifier },
			],
		});
		if (!user) {
			const err: AppError = new Error("Invalid identifier or password");
			err.statusCode = 401;
			return next(err);
		}

		const match = await bcrypt.compare(password, user.passwordHash);
		if (!match) {
			const err: AppError = new Error("Invalid identifier or password");
			err.statusCode = 401;
			return next(err);
		}

		const userId = (user._id as Types.ObjectId).toString();
		const accessToken = signAccessToken({ userId, role: user.role });
		const refreshToken = signRefreshToken({ userId });
		const refreshTokenHash = await bcrypt.hash(refreshToken, SALT_ROUNDS);

		await UserModel.updateOne(
			{ _id: user._id },
			{ $set: { refreshTokenHash } },
		);

		const cookieName = getRefreshCookieName();
		res.cookie(cookieName, refreshToken, getRefreshCookieOptions());

		res.status(200).json({
			success: true,
			data: {
				user: {
					id: userId,
					email: user.email,
					name: user.name ?? null,
					phone: user.phone,
					role: user.role,
				},
				accessToken,
			},
		});
	} catch (error) {
		next(error);
	}
};

export const refresh: RequestHandler = async (req, res, next) => {
	try {
		const cookieName = getRefreshCookieName();
		const token = req.cookies?.[cookieName];

		if (!token || typeof token !== "string") {
			const err: AppError = new Error("Refresh token required");
			err.statusCode = 401;
			return next(err);
		}

		let payload: { userId: string };
		try {
			payload = verifyRefreshToken(token);
		} catch {
			const err: AppError = new Error("Invalid or expired refresh token");
			err.statusCode = 401;
			return next(err);
		}

		const user = await UserModel.findById(payload.userId);
		if (!user || !user.refreshTokenHash) {
			const err: AppError = new Error("Invalid refresh token");
			err.statusCode = 401;
			return next(err);
		}

		const match = await bcrypt.compare(token, user.refreshTokenHash);
		if (!match) {
			const err: AppError = new Error("Invalid refresh token");
			err.statusCode = 401;
			return next(err);
		}

		const userId = (user._id as Types.ObjectId).toString();
		const accessToken = signAccessToken({ userId, role: user.role });

		// Optional rotation: issue new refresh, update cookie and DB
		const newRefreshToken = signRefreshToken({ userId });
		const refreshTokenHash = await bcrypt.hash(newRefreshToken, SALT_ROUNDS);
		await UserModel.updateOne(
			{ _id: user._id },
			{ $set: { refreshTokenHash } },
		);
		res.cookie(cookieName, newRefreshToken, getRefreshCookieOptions());

		res.status(200).json({
			success: true,
			data: {
				user: {
					id: userId,
					email: user.email,
					name: user.name ?? null,
					phone: user.phone,
					role: user.role,
				},
				accessToken,
			},
		});
	} catch (error) {
		next(error);
	}
};

export const logout: RequestHandler = async (req, res, next) => {
	try {
		const cookieName = getRefreshCookieName();
		const token = req.cookies?.[cookieName];

		res.clearCookie(cookieName, {
			httpOnly: true,
			sameSite: "lax",
			secure: process.env.NODE_ENV === "production",
			path: "/api/auth/refresh",
		});

		if (token && typeof token === "string") {
			try {
				const payload = verifyRefreshToken(token);
				await UserModel.updateOne(
					{ _id: payload.userId },
					{ $set: { refreshTokenHash: null } },
				);
			} catch {
				// ignore invalid token on logout
			}
		}

		res.status(200).json({
			success: true,
			data: { message: "Logged out" },
		});
	} catch (error) {
		next(error);
	}
};

export const me: RequestHandler = async (req, res, next) => {
	try {
		const authReq = req as AuthRequest;
		const userId = authReq.user?.userId;

		if (!userId || !Types.ObjectId.isValid(userId)) {
			const err: AppError = new Error("Unauthorized");
			err.statusCode = 401;
			return next(err);
		}

		const user = await UserModel.findById(userId)
			.select("-passwordHash -refreshTokenHash")
			.lean();

		if (!user) {
			const err: AppError = new Error("User not found");
			err.statusCode = 404;
			return next(err);
		}

		const id = (user._id as Types.ObjectId).toString();
		res.status(200).json({
			success: true,
			data: {
				user: {
					id,
					email: user.email,
					name: user.name ?? null,
					phone: user.phone,
					role: user.role,
				},
			},
		});
	} catch (error) {
		next(error);
	}
};

export const updateMe: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId;

    if (!userId || !Types.ObjectId.isValid(userId)) {
      const err: AppError = new Error("Unauthorized");
      err.statusCode = 401;
      return next(err);
    }

    const name =
      typeof req.body.name === "string" ? req.body.name.trim() : undefined;

    const email =
      typeof req.body.email === "string"
        ? req.body.email.trim().toLowerCase()
        : undefined;

    const phone =
      typeof req.body.phone === "string" ? req.body.phone.trim() : undefined;

      const user = await UserModel.findById(userId).select(
        "-passwordHash -refreshTokenHash"
      );

    if (!user) {
      const err: AppError = new Error("User not found");
      err.statusCode = 404;
      return next(err);
    }

    // перевірка email
    if (email && email !== user.email) {
      const existingEmail = await UserModel.findOne({ email });

      if (existingEmail) {
        const err: AppError = new Error("Email already in use");
        err.statusCode = 409;
        return next(err);
      }

      user.email = email;
    }

    // перевірка phone
    if (phone && phone !== user.phone) {
      if (phone.length < MIN_PHONE_LENGTH) {
        const err: AppError = new Error(
          `Phone must be at least ${MIN_PHONE_LENGTH} characters`
        );
        err.statusCode = 400;
        return next(err);
      }

      const existingPhone = await UserModel.findOne({ phone });

      if (existingPhone) {
        const err: AppError = new Error("Phone already in use");
        err.statusCode = 409;
        return next(err);
      }

      user.phone = phone;
    }

    if (name !== undefined) {
      user.name = name;
    }

    await user.save();

    const id = (user._id as Types.ObjectId).toString();

    res.status(200).json({
      success: true,
      data: {
        user: {
          id,
          email: user.email,
          name: user.name ?? null,
          phone: user.phone,
          role: user.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
