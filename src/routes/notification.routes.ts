import { Router } from "express";
import { protect } from "../middlewares/auth.middleware";
import {
  getNotifications,
  markAsRead,
} from "../controllers/notification.controller";

const router = Router();

router.get("/", protect, getNotifications);
router.put("/mark-read", protect, markAsRead);

export default router;
