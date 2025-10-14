import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    from: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    to: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, maxlength: 5000, trim: true },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

messageSchema.index({ from: 1, to: 1, createdAt: -1 });
messageSchema.index({ to: 1, createdAt: -1 });
messageSchema.index({ from: 1, createdAt: -1 });

const Message = mongoose.model("Message", messageSchema);
export default Message;
