import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPost {
  user: mongoose.Types.ObjectId;
  caption?: string;
  image: string;
  likes: mongoose.Types.ObjectId[];
  comments: mongoose.Types.ObjectId[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IPostDocument extends IPost, Document {}

export interface IPostModel extends Model<IPostDocument> {}

const postSchema = new Schema<IPostDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required for a post"],
    },
    caption: {
      type: String,
      default: "",
    },
    image: {
      type: String,
      required: [true, "Image URL is required"],
    },
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: [],
      },
    ],
    comments: [
      {
        type: Schema.Types.ObjectId,
        ref: "Comment",
        default: [],
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Post = mongoose.model<IPostDocument, IPostModel>("Post", postSchema);

export default Post;
