import { Router } from "express";
import {
	register,
	login,
	refresh,
	logout,
	me,
	updateMe,
} from "../controllers/auth.controller";
import { protect } from "../middlewares/auth.middleware";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);

router.get("/me", protect, me);
router.patch("/me", protect, updateMe);

export default router;
