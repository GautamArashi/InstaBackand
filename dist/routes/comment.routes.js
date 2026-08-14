"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const comment_controller_1 = require("../controllers/comment.controller");
const router = (0, express_1.Router)();
router.post("/:postId", auth_middleware_1.protect, comment_controller_1.addComment);
router.get("/:postId", auth_middleware_1.protect, comment_controller_1.getComments);
exports.default = router;
