import { Router } from "express";
import { protect } from "../middlewares/auth.middleware";
import upload from "../middlewares/multer.middleware";
import {
  createPost,
  getFeed,
  toggleLike,
  deletePost,
  toggleSavePost,
  getSavedPosts,
} from "../controllers/post.controller";

const router = Router();

router.post("/create", protect, upload.single("image"), createPost);
router.get("/feed", protect, getFeed);
router.get("/saved", protect, getSavedPosts);
router.put("/like/:postId", protect, toggleLike);
router.put("/save/:postId", protect, toggleSavePost);
router.delete("/:postId", protect, deletePost);

export default router;
