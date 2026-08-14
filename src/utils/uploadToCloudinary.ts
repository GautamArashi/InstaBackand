import cloudinary from "../config/cloudinary";
import { UploadApiResponse } from "cloudinary";

export const uploadToCloudinary = (
  fileBuffer: Buffer,
  folder: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result?: UploadApiResponse) => {
        if (error) {
          return reject(error);
        }
        if (!result || !result.secure_url) {
          return reject(
            new Error("Cloudinary upload failed to return a secure URL")
          );
        }
        resolve(result.secure_url);
      }
    );

    uploadStream.end(fileBuffer);
  });
};
