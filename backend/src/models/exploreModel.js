import Post from "./postModel.js";

export const getExplorePosts = async (limit = 60) => {
  try {
    const sample = await Post.aggregate([{ $sample: { size: limit } }]);

    const posts = await Post.populate(sample, {
      path: "author",
      select: "username name avatarUrl",
    });

    return posts;
  } catch (error) {
    console.error("Error in getExplorePosts:", error);
    throw error;
  }
};

export default {
  getExplorePosts,
};
