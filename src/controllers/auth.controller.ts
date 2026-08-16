import { Request, Response } from "express";
import User from "../models/User.model";
import { generateToken } from "../utils/generateToken";

export const signup = async (req: Request, res: Response): Promise<void> => {
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
    const existingUser = await User.findOne({
      $or: [{ username: username.toLowerCase() }, { email: email.toLowerCase() }],
    });

    if (existingUser) {
      res.status(400).json({ message: "User already exists" });
      return;
    }

    // Create a new user (password is hashed automatically via the pre-save hook)
    const newUser = await User.create({
      username,
      email,
      password,
      fullName,
    });

    // Generate JWT token
    const token = generateToken(newUser._id.toString());

    // Set the token as an httpOnly cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: (process.env.NODE_ENV === "production" ? "none" : "lax") as "none" | "lax",
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
  } catch (error: any) {
    res.status(500).json({
      message: error.message || "Internal Server Error",
    });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
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
    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");

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
    const token = generateToken(user._id.toString());

    // Set the token as an httpOnly cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: (process.env.NODE_ENV === "production" ? "none" : "lax") as "none" | "lax",
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
  } catch (error: any) {
    res.status(500).json({
      message: error.message || "Internal Server Error",
    });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: (process.env.NODE_ENV === "production" ? "none" : "lax") as "none" | "lax",
    });

    res.status(200).json({ message: "Logged out successfully" });
  } catch (error: any) {
    res.status(500).json({
      message: error.message || "Internal Server Error",
    });
  }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    res.status(200).json({ user: req.user });
  } catch (error: any) {
    res.status(500).json({
      message: error.message || "Internal Server Error",
    });
  }
};
