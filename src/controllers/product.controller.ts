import type { RequestHandler } from "express";
import { Types } from "mongoose";
import { ProductModel } from "../models/product.model";

type AppError = Error & {
	statusCode?: number;
};

export const getProducts: RequestHandler = async (req, res, next) => {
	try {
		const category =
			typeof req.query.category === "string" ? req.query.category : undefined;

		const filter: { category?: string } = {};
		if (category) {
			filter.category = category;
		}

		const products = await ProductModel.find(filter).lean();

		res.status(200).json({
			success: true,
			data: products,
			meta: {
				count: products.length,
			},
		});
	} catch (error) {
		next(error);
	}
};

export const getProductById: RequestHandler = async (req, res, next) => {
	try {
		const rawId = req.params.id;
		const id = typeof rawId === "string" ? rawId : undefined;

		if (!id || !Types.ObjectId.isValid(id)) {
			const notFoundError: AppError = new Error("Product not found");
			notFoundError.statusCode = 404;
			return next(notFoundError);
		}

		const product = await ProductModel.findById(id).lean();

		if (!product) {
			const notFoundError: AppError = new Error("Product not found");
			notFoundError.statusCode = 404;
			return next(notFoundError);
		}

		res.status(200).json({
			success: true,
			data: product,
		});
	} catch (error) {
		next(error);
	}
};

