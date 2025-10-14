import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    caption: { type: String, maxlength: 2200 },
    imageUrl: { type: String, required: true },
    imageBytes: { type: Number, default: 0 },
    originalFilename: { type: String, default: null, maxlength: 150 },
    likesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Post = mongoose.model("Post", postSchema);
export default Post;
