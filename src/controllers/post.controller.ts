import { Request, Response } from "express";
import Post from "../models/Post.model";
import User from "../models/User.model";
import Comment from "../models/Comment.model";
import Notification from "../models/Notification.model";
import { getIO } from "../socket";
import { uploadToCloudinary } from "../utils/uploadToCloudinary";

export const createPost = async (req: Request, res: Response): Promise<void> => {
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
    const imageUrl = await uploadToCloudinary(
      req.file.buffer,
      "insta-clone/posts"
    );

    // Create a new post document
    const newPost = await Post.create({
      user: req.user._id,
      caption: caption || "",
      image: imageUrl,
    });

    // Push the new post ID into user's posts array
    await User.findByIdAndUpdate(req.user._id, {
      $push: { posts: newPost._id },
    });

    // Populate user details for response
    await newPost.populate("user", "username profilePicture fullName");

    res.status(201).json({
      message: "Post created successfully",
      post: newPost,
    });
  } catch (error: any) {
    res.status(500).json({
      message: error.message || "Internal Server Error",
    });
  }
};

export const getFeed = async (req: Request, res: Response): Promise<void> => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate("user", "username profilePicture fullName");

    res.status(200).json({
      message: "Feed fetched successfully",
      posts,
    });
  } catch (error: any) {
    res.status(500).json({
      message: error.message || "Internal Server Error",
    });
  }
};

export const toggleLike = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Not authorized" });
      return;
    }

    const { postId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(postId);

    if (!post) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    const isLiked = post.likes.some(
      (id) => id.toString() === userId.toString()
    );

    let liked = false;

    if (isLiked) {
      // Unlike post: remove userId from likes array
      post.likes = post.likes.filter(
        (id) => id.toString() !== userId.toString()
      );
      liked = false;
    } else {
      // Like post: add userId to likes array
      post.likes.push(userId);
      liked = true;
    }

    await post.save();

    // Create and emit notification if post is liked and liker is not post owner
    if (liked && post.user.toString() !== userId.toString()) {
      try {
        const notification = await Notification.create({
          recipient: post.user,
          sender: userId,
          type: "like",
          post: post._id,
        });

        await notification.populate("sender", "username profilePicture");

        getIO().to(post.user.toString()).emit("newNotification", notification);
      } catch (notifError) {
        console.error("Failed to create/emit like notification:", notifError);
      }
    }

    res.status(200).json({
      likesCount: post.likes.length,
      liked,
    });
  } catch (error: any) {
    res.status(500).json({
      message: error.message || "Internal Server Error",
    });
  }
};

export const deletePost = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Not authorized" });
      return;
    }

    const postId = req.params.postId as string;

    const post = await Post.findById(postId);

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
    await Post.findByIdAndDelete(postId);

    // Remove post ID from owner's posts array
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { posts: postId },
    });

    // Delete all associated comments
    await Comment.deleteMany({ post: postId });

    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error: any) {
    res.status(500).json({
      message: error.message || "Internal Server Error",
    });
  }
};

export const toggleSavePost = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Not authorized" });
      return;
    }

    const { postId } = req.params;

    const post = await Post.findById(postId);

    if (!post) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const isSaved = user.savedPosts.some(
      (id) => id.toString() === postId.toString()
    );

    let saved = false;

    if (isSaved) {
      // Unsave: remove postId from savedPosts array
      user.savedPosts = user.savedPosts.filter(
        (id) => id.toString() !== postId.toString()
      );
      saved = false;
    } else {
      // Save: add postId to savedPosts array
      user.savedPosts.push(post._id as any);
      saved = true;
    }

    await user.save();

    res.status(200).json({
      saved,
    });
  } catch (error: any) {
    res.status(500).json({
      message: error.message || "Failed to toggle save post",
    });
  }
};

export const getSavedPosts = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Not authorized" });
      return;
    }

    const user = await User.findById(req.user._id).populate({
      path: "savedPosts",
      populate: {
        path: "user",
        select: "username profilePicture fullName",
      },
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json(user.savedPosts);
  } catch (error: any) {
    res.status(500).json({
      message: error.message || "Failed to fetch saved posts",
    });
  }
};
