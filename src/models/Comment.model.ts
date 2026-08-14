import mongoose, { Schema, Document, Model } from "mongoose";

export interface IComment {
  user: mongoose.Types.ObjectId;
  post: mongoose.Types.ObjectId;
  text: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICommentDocument extends IComment, Document {}

export interface ICommentModel extends Model<ICommentDocument> {}

const commentSchema = new Schema<ICommentDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
    },
    post: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      required: [true, "Post reference is required"],
    },
    text: {
      type: String,
      required: [true, "Comment text is required"],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Comment = mongoose.model<ICommentDocument, ICommentModel>(
  "Comment",
  commentSchema
);

export default Comment;
