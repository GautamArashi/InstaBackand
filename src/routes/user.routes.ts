import { Router } from "express";
import { protect } from "../middlewares/auth.middleware";
import upload from "../middlewares/multer.middleware";
import {
  getProfile,
  toggleFollow,
  editProfile,
  searchUsers,
  getSuggestedUsers,
} from "../controllers/user.controller";

const router = Router();

router.get("/search", protect, searchUsers);
router.get("/suggested", protect, getSuggestedUsers);
router.get("/profile/:username", protect, getProfile);
router.put("/follow/:userId", protect, toggleFollow);
router.put("/profile", protect, upload.single("profilePicture"), editProfile);

export default router;
