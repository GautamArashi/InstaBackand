"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePost = exports.toggleLike = exports.getFeed = exports.createPost = void 0;
const Post_model_1 = __importDefault(require("../models/Post.model"));
const User_model_1 = __importDefault(require("../models/User.model"));
const Comment_model_1 = __importDefault(require("../models/Comment.model"));
const uploadToCloudinary_1 = require("../utils/uploadToCloudinary");
const createPost = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Not authorized" });
            return;
        }
        const { caption } = req.body;
        if (!req.file) {
            res.status(400).json({ message: "Image is required" });
            return;
        }
        // Upload image file buffer to Cloudinary
        const imageUrl = await (0, uploadToCloudinary_1.uploadToCloudinary)(req.file.buffer, "insta-clone/posts");
        // Create a new post document
        const newPost = await Post_model_1.default.create({
            user: req.user._id,
            caption: caption || "",
            image: imageUrl,
        });
        // Push the new post ID into user's posts array
        await User_model_1.default.findByIdAndUpdate(req.user._id, {
            $push: { posts: newPost._id },
        });
        // Populate user details for response
        await newPost.populate("user", "username profilePicture fullName");
        res.status(201).json({
            message: "Post created successfully",
            post: newPost,
        });
    }
    catch (error) {
        res.status(500).json({
            message: error.message || "Internal Server Error",
        });
    }
};
exports.createPost = createPost;
const getFeed = async (req, res) => {
    try {
        const posts = await Post_model_1.default.find()
            .sort({ createdAt: -1 })
            .populate("user", "username profilePicture fullName");
        res.status(200).json({
            message: "Feed fetched successfully",
            posts,
        });
    }
    catch (error) {
        res.status(500).json({
            message: error.message || "Internal Server Error",
        });
    }
};
exports.getFeed = getFeed;
const toggleLike = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Not authorized" });
            return;
        }
        const { postId } = req.params;
        const userId = req.user._id;
        const post = await Post_model_1.default.findById(postId);
        if (!post) {
            res.status(404).json({ message: "Post not found" });
            return;
        }
        const isLiked = post.likes.some((id) => id.toString() === userId.toString());
        let liked = false;
        if (isLiked) {
            // Unlike post: remove userId from likes array
            post.likes = post.likes.filter((id) => id.toString() !== userId.toString());
            liked = false;
        }
        else {
            // Like post: add userId to likes array
            post.likes.push(userId);
            liked = true;
        }
        await post.save();
        res.status(200).json({
            likesCount: post.likes.length,
            liked,
        });
    }
    catch (error) {
        res.status(500).json({
            message: error.message || "Internal Server Error",
        });
    }
};
exports.toggleLike = toggleLike;
const deletePost = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Not authorized" });
            return;
        }
        const postId = req.params.postId;
        const post = await Post_model_1.default.findById(postId);
        if (!post) {
            res.status(404).json({ message: "Post not found" });
            return;
        }
        // Check if logged in user is the post owner
        if (post.user.toString() !== req.user._id.toString()) {
            res.status(403).json({ message: "You can only delete your own posts" });
            return;
        }
        // Delete post document
        await Post_model_1.default.findByIdAndDelete(postId);
        // Remove post ID from owner's posts array
        await User_model_1.default.findByIdAndUpdate(req.user._id, {
            $pull: { posts: postId },
        });
        // Delete all associated comments
        await Comment_model_1.default.deleteMany({ post: postId });
        res.status(200).json({ message: "Post deleted successfully" });
    }
    catch (error) {
        res.status(500).json({
            message: error.message || "Internal Server Error",
        });
    }
};
exports.deletePost = deletePost;
