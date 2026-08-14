"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchUsers = exports.editProfile = exports.toggleFollow = exports.getProfile = void 0;
const User_model_1 = __importDefault(require("../models/User.model"));
const uploadToCloudinary_1 = require("../utils/uploadToCloudinary");
const getProfile = async (req, res) => {
    try {
        const username = req.params.username;
        const user = await User_model_1.default.findOne({ username: username.toLowerCase() })
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
    }
    catch (error) {
        res.status(500).json({
            message: error.message || "Internal Server Error",
        });
    }
};
exports.getProfile = getProfile;
const toggleFollow = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Not authorized" });
            return;
        }
        const targetUserId = req.params.userId;
        const currentUserId = req.user._id.toString();
        if (targetUserId === currentUserId) {
            res.status(400).json({ message: "You cannot follow yourself" });
            return;
        }
        const [targetUser, currentUser] = await Promise.all([
            User_model_1.default.findById(targetUserId),
            User_model_1.default.findById(currentUserId),
        ]);
        if (!targetUser || !currentUser) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        const isFollowing = targetUser.followers.some((id) => id.toString() === currentUserId);
        let following = false;
        if (isFollowing) {
            // Unfollow logic
            targetUser.followers = targetUser.followers.filter((id) => id.toString() !== currentUserId);
            currentUser.following = currentUser.following.filter((id) => id.toString() !== targetUserId);
            following = false;
        }
        else {
            // Follow logic
            targetUser.followers.push(currentUser._id);
            currentUser.following.push(targetUser._id);
            following = true;
        }
        await Promise.all([targetUser.save(), currentUser.save()]);
        res.status(200).json({
            following,
            followersCount: targetUser.followers.length,
        });
    }
    catch (error) {
        res.status(500).json({
            message: error.message || "Internal Server Error",
        });
    }
};
exports.toggleFollow = toggleFollow;
const editProfile = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Not authorized" });
            return;
        }
        const { fullName, bio } = req.body;
        const updateFields = {};
        if (fullName !== undefined && fullName.trim() !== "") {
            updateFields.fullName = fullName.trim();
        }
        if (bio !== undefined) {
            updateFields.bio = bio.trim();
        }
        if (req.file) {
            const profilePictureUrl = await (0, uploadToCloudinary_1.uploadToCloudinary)(req.file.buffer, "insta-clone/profile-pictures");
            updateFields.profilePicture = profilePictureUrl;
        }
        const updatedUser = await User_model_1.default.findByIdAndUpdate(req.user._id, updateFields, { new: true }).select("-password");
        if (!updatedUser) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        res.status(200).json({
            message: "Profile updated successfully",
            user: updatedUser,
        });
    }
    catch (error) {
        res.status(500).json({
            message: error.message || "Internal Server Error",
        });
    }
};
exports.editProfile = editProfile;
const searchUsers = async (req, res) => {
    try {
        const query = req.query.query;
        if (!query || !query.trim()) {
            res.status(400).json({ message: "Search query is required" });
            return;
        }
        const searchRegex = new RegExp(query.trim(), "i");
        const users = await User_model_1.default.find({
            $or: [{ username: searchRegex }, { fullName: searchRegex }],
        })
            .select("-password")
            .limit(20);
        res.status(200).json({
            message: "Users fetched successfully",
            users,
        });
    }
    catch (error) {
        res.status(500).json({
            message: error.message || "Internal Server Error",
        });
    }
};
exports.searchUsers = searchUsers;
