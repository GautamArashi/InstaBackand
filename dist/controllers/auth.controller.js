"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.logout = exports.login = exports.signup = void 0;
const User_model_1 = __importDefault(require("../models/User.model"));
const generateToken_1 = require("../utils/generateToken");
const signup = async (req, res) => {
    try {
        const { username, email, password, fullName } = req.body;
        // Validate required fields
        if (!username || !email || !password || !fullName) {
            res.status(400).json({
                message: "All fields (username, email, password, fullName) are required.",
            });
            return;
        }
        // Check if a user already exists with the same username OR email
        const existingUser = await User_model_1.default.findOne({
            $or: [{ username: username.toLowerCase() }, { email: email.toLowerCase() }],
        });
        if (existingUser) {
            res.status(400).json({ message: "User already exists" });
            return;
        }
        // Create a new user (password is hashed automatically via the pre-save hook)
        const newUser = await User_model_1.default.create({
            username,
            email,
            password,
            fullName,
        });
        // Generate JWT token
        const token = (0, generateToken_1.generateToken)(newUser._id.toString());
        // Set the token as an httpOnly cookie
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
        });
        // Return 201 status with user data (excluding password)
        res.status(201).json({
            message: "User registered successfully",
            user: {
                _id: newUser._id,
                username: newUser.username,
                email: newUser.email,
                fullName: newUser.fullName,
                bio: newUser.bio,
                profilePicture: newUser.profilePicture,
                followers: newUser.followers,
                following: newUser.following,
                posts: newUser.posts,
                createdAt: newUser.createdAt,
                updatedAt: newUser.updatedAt,
            },
        });
    }
    catch (error) {
        res.status(500).json({
            message: error.message || "Internal Server Error",
        });
    }
};
exports.signup = signup;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        // Validate email and password presence
        if (!email || !password) {
            res.status(400).json({
                message: "Both email and password are required.",
            });
            return;
        }
        // Find user by email and explicitly select password field
        const user = await User_model_1.default.findOne({ email: email.toLowerCase() }).select("+password");
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        // Compare candidate password with stored hash
        const isPasswordMatch = await user.comparePassword(password);
        if (!isPasswordMatch) {
            res.status(401).json({ message: "Invalid credentials" });
            return;
        }
        // Generate JWT token
        const token = (0, generateToken_1.generateToken)(user._id.toString());
        // Set the token as an httpOnly cookie
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
        });
        // Return 200 status with user data (excluding password)
        res.status(200).json({
            message: "Logged in successfully",
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                fullName: user.fullName,
                bio: user.bio,
                profilePicture: user.profilePicture,
                followers: user.followers,
                following: user.following,
                posts: user.posts,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            },
        });
    }
    catch (error) {
        res.status(500).json({
            message: error.message || "Internal Server Error",
        });
    }
};
exports.login = login;
const logout = async (req, res) => {
    try {
        res.clearCookie("token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
        });
        res.status(200).json({ message: "Logged out successfully" });
    }
    catch (error) {
        res.status(500).json({
            message: error.message || "Internal Server Error",
        });
    }
};
exports.logout = logout;
const getMe = async (req, res) => {
    try {
        res.status(200).json({ user: req.user });
    }
    catch (error) {
        res.status(500).json({
            message: error.message || "Internal Server Error",
        });
    }
};
exports.getMe = getMe;
