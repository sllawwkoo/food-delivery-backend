import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import productsRouter from "./routes/product.routes";
import authRoutes from "./routes/auth.routes";
import orderRoutes from "./routes/order.routes";
import { notFoundMiddleware } from "./middlewares/notFound.middleware";
import { errorMiddleware } from "./middlewares/error.middleware";

export const app = express();

const corsOptions = {
	origin:
		process.env.CORS_ORIGIN ?? "http://localhost:5173",
	credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

app.use("/api/products", productsRouter);
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);

app.get("/health", (_, res) =>
	res.status(200).json({ success: true, data: { ok: true } }),
);

app.use(notFoundMiddleware);
app.use(errorMiddleware);
