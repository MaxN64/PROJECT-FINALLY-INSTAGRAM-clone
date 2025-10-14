import User from "../models/userModel.js";
import asyncHandler from "../utils/asyncHandler.js";

export const searchUsers = asyncHandler(async (req, res) => {
  const { q = "" } = req.query;
  const normalized = String(q || "").trim();

  const query = normalized
    ? {
        $or: [
          {
            username: new RegExp(
              normalized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
              "i"
            ),
          },
          {
            name: new RegExp(
              normalized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
              "i"
            ),
          },
        ],
      }
    : {};

  const users = await User.find(query)
    .select("username name avatarUrl")
    .limit(20);
  res.json(users);
});
