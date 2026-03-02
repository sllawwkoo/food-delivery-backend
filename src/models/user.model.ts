import { Schema, model, type InferSchemaType } from "mongoose";

const userSchema = new Schema(
	{
		email: {
			type: String,
			required: true,
			unique: true,
			lowercase: true,
			trim: true,
			index: true,
		},
		passwordHash: {
			type: String,
			required: true,
		},
		phone: {
			type: String,
			required: true,
			trim: true,
			unique: true,
			index: true,
			minlength: [10, "Phone must be at least 10 characters"],
		},
		name: {
			type: String,
			required: false,
		},
		refreshTokenHash: {
			type: String,
			required: false,
			default: null,
		},
	},
	{ timestamps: true },
);

export type User = InferSchemaType<typeof userSchema>;
export type UserDocument = User & {
	_id: import("mongoose").Types.ObjectId;
	createdAt: Date;
	updatedAt: Date;
};

export const UserModel = model("User", userSchema);
