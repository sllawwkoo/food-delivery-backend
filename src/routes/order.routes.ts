import { Router } from "express";
import { createOrder, getMyOrders } from "../controllers/order.controller";
import { protect } from "../middlewares/auth.middleware";

const router = Router();

router.post("/", createOrder);
router.get("/my", protect, getMyOrders);

export default router;
