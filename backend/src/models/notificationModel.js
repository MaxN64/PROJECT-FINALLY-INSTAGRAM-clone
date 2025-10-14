import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // receiver
    fromUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    post: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
    type: {
      type: String,
      enum: ["like", "comment", "follow", "profile_view", "message"],
      required: true,
    },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index(
  { user: 1, fromUser: 1, type: 1, post: 1 },
  { unique: true, sparse: true }
);

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
