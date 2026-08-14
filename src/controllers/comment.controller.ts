import { Request, Response } from "express";
import mongoose from "mongoose";
import Comment from "../models/Comment.model";
import Post from "../models/Post.model";
import Notification from "../models/Notification.model";
import { getIO } from "../socket";

export const addComment = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Not authorized" });
      return;
    }

    const postId = req.params.postId as string;
    const { text } = req.body;

    if (!text || !text.trim()) {
      res.status(400).json({ message: "Comment text is required" });
      return;
    }

    const post = await Post.findById(postId);

    if (!post) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    // Create new comment
    const newComment = await Comment.create({
      user: req.user._id,
      post: new mongoose.Types.ObjectId(postId),
      text: text.trim(),
    });

    // Push comment ID into post's comments array and save post
    post.comments.push(newComment._id as mongoose.Types.ObjectId);
    await post.save();

    // Populate user details on the created comment
    await newComment.populate("user", "username profilePicture fullName");

    // Create and emit notification if commenter is not post owner
    if (post.user.toString() !== req.user._id.toString()) {
      try {
        const notification = await Notification.create({
          recipient: post.user,
          sender: req.user._id,
          type: "comment",
          post: new mongoose.Types.ObjectId(postId),
        });

        await notification.populate("sender", "username profilePicture");

        getIO().to(post.user.toString()).emit("newNotification", notification);
      } catch (notifError) {
        console.error("Failed to create/emit comment notification:", notifError);
      }
    }

    res.status(201).json({
      message: "Comment added successfully",
      comment: newComment,
    });
  } catch (error: any) {
    res.status(500).json({
      message: error.message || "Internal Server Error",
    });
  }
};

export const getComments = async (req: Request, res: Response): Promise<void> => {
  try {
    const postId = req.params.postId as string;

    const comments = await Comment.find({ post: postId })
      .sort({ createdAt: -1 })
      .populate("user", "username profilePicture fullName");

    res.status(200).json({
      message: "Comments fetched successfully",
      comments,
    });
  } catch (error: any) {
    res.status(500).json({
      message: error.message || "Internal Server Error",
    });
  }
};
