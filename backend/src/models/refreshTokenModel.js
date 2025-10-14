import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    jti: { type: String, required: true, unique: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    revokedAt: { type: Date, default: null },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("RefreshToken", schema);
