import { Schema, model, type InferSchemaType } from "mongoose";

const productSchema = new Schema(
	{
		title: { type: String, required: true, trim: true },
		price: { type: Number, required: true, min: 0 },
		category: { type: String, required: true, index: true },
		imageUrl: { type: String, required: true },
	},
	{ timestamps: true },
);

export type Product = InferSchemaType<typeof productSchema>;
export const ProductModel = model("Product", productSchema);
