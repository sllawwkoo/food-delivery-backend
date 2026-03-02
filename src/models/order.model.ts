import { Schema, model, type InferSchemaType } from "mongoose";

const orderItemSchema = new Schema(
	{
		productId: {
			type: Schema.Types.ObjectId,
			ref: "Product",
			required: true,
		},
		title: { type: String, required: true },
		price: { type: Number, required: true, min: 0 },
		quantity: { type: Number, required: true, min: 1 },
	},
	{ _id: false },
);

const orderSchema = new Schema(
	{
		user: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: false,
			default: null,
		},
		restaurant: { type: String, required: true },
		customer: {
			name: { type: String, required: true, trim: true },
			phone: { type: String, required: true, trim: true },
			address: { type: String, required: true, trim: true },
		},
		items: {
			type: [orderItemSchema],
			required: true,
			validate: {
				validator: (v: unknown[]) => Array.isArray(v) && v.length > 0,
				message: "Order must have at least one item",
			},
		},
		total: { type: Number, required: true, min: 0 },
		status: {
			type: String,
			required: true,
			enum: ["new"],
			default: "new",
		},
	},
	{ timestamps: true },
);

export type OrderItem = InferSchemaType<typeof orderItemSchema>;
export type Order = InferSchemaType<typeof orderSchema>;
export const OrderModel = model("Order", orderSchema);
