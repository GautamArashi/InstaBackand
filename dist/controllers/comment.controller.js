"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getComments = exports.addComment = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Comment_model_1 = __importDefault(require("../models/Comment.model"));
const Post_model_1 = __importDefault(require("../models/Post.model"));
const addComment = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Not authorized" });
            return;
        }
        const postId = req.params.postId;
        const { text } = req.body;
        if (!text || !text.trim()) {
            res.status(400).json({ message: "Comment text is required" });
            return;
        }
        const post = await Post_model_1.default.findById(postId);
        if (!post) {
            res.status(404).json({ message: "Post not found" });
            return;
        }
        // Create new comment
        const newComment = await Comment_model_1.default.create({
            user: req.user._id,
            post: new mongoose_1.default.Types.ObjectId(postId),
            text: text.trim(),
        });
        // Push comment ID into post's comments array and save post
        post.comments.push(newComment._id);
        await post.save();
        // Populate user details on the created comment
        await newComment.populate("user", "username profilePicture fullName");
        res.status(201).json({
            message: "Comment added successfully",
            comment: newComment,
        });
    }
    catch (error) {
        res.status(500).json({
            message: error.message || "Internal Server Error",
        });
    }
};
exports.addComment = addComment;
const getComments = async (req, res) => {
    try {
        const postId = req.params.postId;
        const comments = await Comment_model_1.default.find({ post: postId })
            .sort({ createdAt: -1 })
            .populate("user", "username profilePicture fullName");
        res.status(200).json({
            message: "Comments fetched successfully",
            comments,
        });
    }
    catch (error) {
        res.status(500).json({
            message: error.message || "Internal Server Error",
        });
    }
};
exports.getComments = getComments;
