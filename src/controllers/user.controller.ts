import { Request, Response } from "express";
import mongoose from "mongoose";
import User from "../models/User.model";
import Notification from "../models/Notification.model";
import { getIO } from "../socket";
import { uploadToCloudinary } from "../utils/uploadToCloudinary";

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const username = req.params.username as string;

    const user = await User.findOne({ username: username.toLowerCase() })
      .select("-password")
      .populate({
        path: "posts",
        options: { sort: { createdAt: -1 } },
      });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const userObj = user.toObject();

    const profileData = {
      ...userObj,
      postsCount: user.posts.length,
      followersCount: user.followers.length,
      followingCount: user.following.length,
    };

    res.status(200).json({
      user: profileData,
    });
  } catch (error: any) {
    res.status(500).json({
      message: error.message || "Internal Server Error",
    });
  }
};

export const toggleFollow = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Not authorized" });
      return;
    }

    const targetUserId = req.params.userId as string;
    const currentUserId = req.user._id.toString();

    if (targetUserId === currentUserId) {
      res.status(400).json({ message: "You cannot follow yourself" });
      return;
    }

    const [targetUser, currentUser] = await Promise.all([
      User.findById(targetUserId),
      User.findById(currentUserId),
    ]);

    if (!targetUser || !currentUser) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const isFollowing = targetUser.followers.some(
      (id) => id.toString() === currentUserId
    );

    let following = false;

    if (isFollowing) {
      // Unfollow logic
      targetUser.followers = targetUser.followers.filter(
        (id) => id.toString() !== currentUserId
      );
      currentUser.following = currentUser.following.filter(
        (id) => id.toString() !== targetUserId
      );
      following = false;
    } else {
      // Follow logic
      targetUser.followers.push(currentUser._id as mongoose.Types.ObjectId);
      currentUser.following.push(targetUser._id as mongoose.Types.ObjectId);
      following = true;
    }

    await Promise.all([targetUser.save(), currentUser.save()]);

    // Create and emit notification if user is now being followed (following === true)
    if (following) {
      try {
        const notification = await Notification.create({
          recipient: new mongoose.Types.ObjectId(targetUserId),
          sender: req.user._id,
          type: "follow",
        });

        await notification.populate("sender", "username profilePicture");

        getIO().to(targetUserId.toString()).emit("newNotification", notification);
      } catch (notifError) {
        console.error("Failed to create/emit follow notification:", notifError);
      }
    }

    res.status(200).json({
      following,
      followersCount: targetUser.followers.length,
    });
  } catch (error: any) {
    res.status(500).json({
      message: error.message || "Internal Server Error",
    });
  }
};

export const editProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Not authorized" });
      return;
    }

    const { fullName, bio } = req.body;
    const updateFields: Record<string, any> = {};

    if (fullName !== undefined && fullName.trim() !== "") {
      updateFields.fullName = fullName.trim();
    }

    if (bio !== undefined) {
      updateFields.bio = bio.trim();
    }

    if (req.file) {
      const profilePictureUrl = await uploadToCloudinary(
        req.file.buffer,
        "insta-clone/profile-pictures"
      );
      updateFields.profilePicture = profilePictureUrl;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updateFields,
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error: any) {
    res.status(500).json({
      message: error.message || "Internal Server Error",
    });
  }
};

export const searchUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = req.query.query as string;

    if (!query || !query.trim()) {
      res.status(400).json({ message: "Search query is required" });
      return;
    }

    const searchRegex = new RegExp(query.trim(), "i");

    const users = await User.find({
      $or: [{ username: searchRegex }, { fullName: searchRegex }],
    })
      .select("-password")
      .limit(20);

    res.status(200).json({
      message: "Users fetched successfully",
      users,
    });
  } catch (error: any) {
    res.status(500).json({
      message: error.message || "Internal Server Error",
    });
  }
};

export const getSuggestedUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Not authorized" });
      return;
    }

    const currentUser = await User.findById(req.user._id);

    if (!currentUser) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const excludedIds = [currentUser._id, ...(currentUser.following || [])];

    const suggestedUsers = await User.aggregate([
      {
        $match: {
          _id: { $nin: excludedIds },
        },
      },
      { $sample: { size: 5 } },
      {
        $project: {
          password: 0,
        },
      },
    ]);

    res.status(200).json(suggestedUsers);
  } catch (error: any) {
    res.status(500).json({
      message: error.message || "Failed to fetch suggested users",
    });
  }
};
