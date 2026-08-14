import { Router } from "express";
import { protect } from "../middlewares/auth.middleware";
import { addComment, getComments } from "../controllers/comment.controller";

const router = Router();

router.post("/:postId", protect, addComment);
router.get("/:postId", protect, getComments);

export default router;
