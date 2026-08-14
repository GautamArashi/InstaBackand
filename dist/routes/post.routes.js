"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const multer_middleware_1 = __importDefault(require("../middlewares/multer.middleware"));
const post_controller_1 = require("../controllers/post.controller");
const router = (0, express_1.Router)();
router.post("/create", auth_middleware_1.protect, multer_middleware_1.default.single("image"), post_controller_1.createPost);
router.get("/feed", auth_middleware_1.protect, post_controller_1.getFeed);
router.put("/like/:postId", auth_middleware_1.protect, post_controller_1.toggleLike);
router.delete("/:postId", auth_middleware_1.protect, post_controller_1.deletePost);
exports.default = router;
