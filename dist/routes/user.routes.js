"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const multer_middleware_1 = __importDefault(require("../middlewares/multer.middleware"));
const user_controller_1 = require("../controllers/user.controller");
const router = (0, express_1.Router)();
router.get("/search", auth_middleware_1.protect, user_controller_1.searchUsers);
router.get("/profile/:username", auth_middleware_1.protect, user_controller_1.getProfile);
router.put("/follow/:userId", auth_middleware_1.protect, user_controller_1.toggleFollow);
router.put("/profile", auth_middleware_1.protect, multer_middleware_1.default.single("profilePicture"), user_controller_1.editProfile);
exports.default = router;
