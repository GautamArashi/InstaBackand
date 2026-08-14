import { Request, Response } from "express";
import Notification from "../models/Notification.model";

export const getNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Not authorized" });
      return;
    }

    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .populate("sender", "username profilePicture")
      .limit(30);

    res.status(200).json(notifications);
  } catch (error: any) {
    res.status(500).json({
      message: error.message || "Failed to fetch notifications",
    });
  }
};

export const markAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Not authorized" });
      return;
    }

    await Notification.updateMany(
      { recipient: req.user._id, read: false },
      { $set: { read: true } }
    );

    res.status(200).json({ message: "Notifications marked as read" });
  } catch (error: any) {
    res.status(500).json({
      message: error.message || "Failed to mark notifications as read",
    });
  }
};
