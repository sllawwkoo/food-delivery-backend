import type { RequestHandler } from "express";
import { Types } from "mongoose";
import { ProductModel } from "../models/product.model";
import { OrderModel } from "../models/order.model";
import type { AuthRequest } from "../types/express";

type AppError = Error & { statusCode?: number };

type CreateOrderBodyItem = { productId: string; quantity: number };
type CreateOrderBodyCustomer = { name: string; phone: string; address: string };

function parseCreateOrderBody(body: unknown): {
	items: CreateOrderBodyItem[];
	customer: CreateOrderBodyCustomer | null;
} {
	let items: CreateOrderBodyItem[] = [];
	let customer: CreateOrderBodyCustomer | null = null;

	if (body && typeof body === "object" && "items" in body && Array.isArray(body.items)) {
		items = body.items
			.filter(
				(item): item is CreateOrderBodyItem =>
					item !== null &&
					typeof item === "object" &&
					"productId" in item &&
					"quantity" in item &&
					typeof (item as CreateOrderBodyItem).productId === "string" &&
					typeof (item as CreateOrderBodyItem).quantity === "number" &&
					(item as CreateOrderBodyItem).quantity >= 1,
			)
			.map((item) => ({
				productId: (item as CreateOrderBodyItem).productId.trim(),
				quantity: Math.floor((item as CreateOrderBodyItem).quantity),
			}));
	}

	if (
		body &&
		typeof body === "object" &&
		"customer" in body &&
		body.customer !== null &&
		typeof body.customer === "object" &&
		"name" in body.customer &&
		"phone" in body.customer &&
		"address" in body.customer &&
		typeof (body.customer as CreateOrderBodyCustomer).name === "string" &&
		typeof (body.customer as CreateOrderBodyCustomer).phone === "string" &&
		typeof (body.customer as CreateOrderBodyCustomer).address === "string"
	) {
		const c = body.customer as CreateOrderBodyCustomer;
		customer = {
			name: c.name.trim(),
			phone: c.phone.trim(),
			address: c.address.trim(),
		};
	}

	return { items, customer };
}

export const createOrder: RequestHandler = async (req, res, next) => {
	try {
		const { items: rawItems, customer } = parseCreateOrderBody(req.body);

		if (rawItems.length === 0) {
			const err: AppError = new Error("Items array is required and cannot be empty");
			err.statusCode = 400;
			return next(err);
		}

		if (!customer || !customer.name || !customer.phone || !customer.address) {
			const err: AppError = new Error(
				"Customer name, phone and address are required",
			);
			err.statusCode = 400;
			return next(err);
		}

		const validItems = rawItems.filter((i) => Types.ObjectId.isValid(i.productId));
		if (validItems.length !== rawItems.length) {
			const err: AppError = new Error("Invalid product id in items");
			err.statusCode = 400;
			return next(err);
		}

		const uniqueIds = [...new Set(validItems.map((i) => i.productId))];
		const products = await ProductModel.find({
			_id: { $in: uniqueIds.map((id) => new Types.ObjectId(id)) },
		}).lean();

		if (products.length !== uniqueIds.length) {
			const err: AppError = new Error("One or more products not found");
			err.statusCode = 400;
			return next(err);
		}

		const category = products[0].category;
		const allSameCategory = products.every((p) => p.category === category);
		if (!allSameCategory) {
			const err: AppError = new Error(
				"All products must be from the same restaurant (category)",
			);
			err.statusCode = 400;
			return next(err);
		}

		const productMap = new Map(
			products.map((p) => [(p._id as Types.ObjectId).toString(), p]),
		);

		// Merge quantities per productId
		const quantityByProductId = new Map<string, number>();
		for (const raw of validItems) {
			const q = quantityByProductId.get(raw.productId) ?? 0;
			quantityByProductId.set(raw.productId, q + raw.quantity);
		}

		const orderItems: {
			productId: Types.ObjectId;
			title: string;
			price: number;
			quantity: number;
		}[] = [];
		let total = 0;

		for (const [productIdStr, quantity] of quantityByProductId) {
			const product = productMap.get(productIdStr);
			if (!product) {
				const err: AppError = new Error("One or more products not found");
				err.statusCode = 400;
				return next(err);
			}
			const lineTotal = product.price * quantity;
			total += lineTotal;
			orderItems.push({
				productId: product._id as Types.ObjectId,
				title: product.title,
				price: product.price,
				quantity,
			});
		}

		const authReq = req as AuthRequest;
		const userId = authReq.user?.userId;

		const order = await OrderModel.create({
			user: userId ? new Types.ObjectId(userId) : null,
			restaurant: category,
			customer: {
				name: customer.name,
				phone: customer.phone,
				address: customer.address,
			},
			items: orderItems,
			total,
			status: "new",
		});

		const orderObj = order.toObject();
		const orderId = (orderObj._id as Types.ObjectId).toString();

		res.status(201).json({
			success: true,
			data: {
				...orderObj,
				_id: orderId,
				id: orderId,
			},
		});
	} catch (error) {
		next(error);
	}
};

export const getMyOrders: RequestHandler = async (req, res, next) => {
	try {
		const authReq = req as AuthRequest;
		const userId = authReq.user?.userId;

		if (!userId || !Types.ObjectId.isValid(userId)) {
			const err: AppError = new Error("Unauthorized");
			err.statusCode = 401;
			return next(err);
		}

		const orders = await OrderModel.find({ user: new Types.ObjectId(userId) })
			.sort({ createdAt: -1 })
			.lean();

		const data = orders.map((o) => {
			const id = (o._id as Types.ObjectId).toString();
			return { ...o, _id: id, id };
		});

		res.status(200).json({
			success: true,
			data,
			meta: { count: data.length },
		});
	} catch (error) {
		next(error);
	}
};
