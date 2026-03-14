import { Router } from "express";
import { createOrder, getMyOrders } from "../controllers/order.controller";
import { protect, optionalAuth } from "../middlewares/auth.middleware";


const router = Router();

router.post("/", optionalAuth, createOrder);
router.get("/my", protect, getMyOrders);

export default router;
