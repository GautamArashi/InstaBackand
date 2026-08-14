"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_model_1 = __importDefault(require("../models/User.model"));
const protect = async (req, res, next) => {
    try {
        const token = req.cookies?.token;
        if (!token) {
            res.status(401).json({ message: "Not authorized, no token" });
            return;
        }
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new Error("JWT_SECRET environment variable is not defined.");
        }
        // Verify token
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        // Find user by id excluding password
        const user = await User_model_1.default.findById(decoded.id).select("-password");
        if (!user) {
            res.status(401).json({ message: "User not found" });
            return;
        }
        // Attach user to request object
        req.user = user;
        next();
    }
    catch (error) {
        res.status(401).json({ message: "Not authorized, invalid token" });
    }
};
exports.protect = protect;
