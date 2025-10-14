import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { createPortal } from "react-dom";
import { api } from "../services/api";
import styles from "./PostViewModal.module.css";
import EMOJI_PRESETS from "../utils/emojiPresets";

const formatTimeAgo = (value) => {
  if (!value) return "just now";
  const created = new Date(value).getTime();
  if (Number.isNaN(created)) return "just now";
  const diff = Date.now() - created;
  const minutes = Math.max(1, Math.floor(diff / 60000));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} d`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} wk`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} mo`;
  const years = Math.floor(days / 365);
  return `${years} y`;
};


const formatPostAge = (value) => {
  const raw = formatTimeAgo(value);
  if (!raw || raw === "just now") return raw;
  const [amount, unit] = raw.split(" ");
  if (!amount || !unit) return raw;
  const singular = {
    min: "minute",
    h: "hour",
    d: "day",
    wk: "week",
    mo: "month",
    y: "year",
  }[unit] || unit;
  const count = Number(amount);
  if (Number.isFinite(count) && count !== 1) {
    return `${amount} ${singular}s`;
  }
  return `${amount} ${singular}`;
};

export default function PostViewModal({
  postId,
  initialPost = null,
  onClose,
  onRequestManage,
}) {
  const viewer = useMemo(() => {
    try {
      const m = JSON.parse(localStorage.getItem("me") || "{}")?.user;
      const u = JSON.parse(localStorage.getItem("user") || "{}");
      return m || u || {};
    } catch {
      return {};
    }
  }, []);
  const viewerId = viewer?.id || viewer?._id;

  const [post, setPost] = useState(initialPost);
  const [comments, setComments] = useState([]);
  const [likesCount, setLikesCount] = useState(initialPost?.likesCount || 0);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [commentText, setCommentText] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  const [commentLikeBusy, setCommentLikeBusy] = useState({});
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isFollowing, setIsFollowing] = useState(
    Boolean(initialPost?.author?.isFollowing)
  );

  useEffect(() => {
    if (initialPost?.author) {
      setIsFollowing(Boolean(initialPost.author.isFollowing));
    }
  }, [initialPost]);

  
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const [postRes, commentsRes, likesRes] = await Promise.all([
          api.get(`/posts/${postId}`),
          api.get(`/comments/post/${postId}`),
          api.get(`/likes/post/${postId}`),
        ]);
        if (!alive) return;
        const postData = postRes?.data;
        setPost(postData);
        setIsFollowing(Boolean(postData?.author?.isFollowing));
        setLikesCount(postData?.likesCount ?? 0);
        const rawComments = Array.isArray(commentsRes?.data)
          ? commentsRes.data
          : [];
        const normalizedComments = rawComments.map((item) => ({
          ...item,
          likesCount: item?.likesCount ?? 0,
          viewerHasLiked: Boolean(item?.viewerHasLiked),
        }));
        setComments(normalizedComments);
        const likes = Array.isArray(likesRes?.data) ? likesRes.data : [];
        const viewerLiked =
          viewerId &&
          likes.some((like) => {
            const likeUser = like.user || {};
            return (
              String(likeUser._id || likeUser.id || like.user) ===
              String(viewerId)
            );
          });
        setLiked(Boolean(viewerLiked));
      } catch (e) {
        if (alive)
          setError(e?.response?.data?.message || "Failed to load post");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [postId, viewerId]);

  
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);

    const root = document.body;
    const prev = root.style.overflow;
    root.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKey);
      root.style.overflow = prev;
    };
  }, [onClose]);

  if (!postId) return null;

  const authorId = post?.author?._id || post?.author?.id;

  const canManage = Boolean(
    viewerId &&
      post?.author &&
      String(post.author._id || post.author.id) === String(viewerId)
  );

  const canFollow = Boolean(
    viewerId && authorId && String(viewerId) !== String(authorId)
  );

  const likesNumber = Number(likesCount);
  const safeLikesCount = Number.isFinite(likesNumber) ? Math.max(0, likesNumber) : 0;
  const likeLabel = `${safeLikesCount} ${safeLikesCount === 1 ? "like" : "likes"}`;
  const postTimeLabel = post?.createdAt ? formatPostAge(post.createdAt) : "";

  const handleToggleLike = async () => {
    try {
      const { data } = await api.post("/likes/toggle", { postId });
      const likedNow = Boolean(data?.liked);
      setLiked(likedNow);
      setLikesCount((prev) => Math.max(0, prev + (likedNow ? 1 : -1)));
    } catch {
      /* ignore */
    }
  };

  const handleToggleFollow = async () => {
    if (!canFollow || followBusy || !authorId) return;
    setFollowBusy(true);
    try {
      const { data } = await api.post("/follows/toggle", {
        targetUserId: authorId,
      });
      const followingNow = Boolean(data?.following);
      setIsFollowing(followingNow);
      setPost((prev) =>
        prev
          ? {
              ...prev,
              author: prev.author
                ? { ...prev.author, isFollowing: followingNow }
                : prev.author,
            }
          : prev
      );
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to change subscription");
    } finally {
      setFollowBusy(false);
    }
  };

  const handleToggleCommentLike = async (commentId) => {
    const key = commentId ? String(commentId) : "";
    if (!key || commentLikeBusy[key]) return;
    setCommentLikeBusy((prev) => ({ ...prev, [key]: true }));
    try {
      const { data } = await api.post(`/comments/${commentId}/like`);
      const likedNow = Boolean(data?.liked);
      const likesCountFromServer =
        typeof data?.likesCount === "number" ? data.likesCount : null;

      setComments((prev) =>
        prev.map((item) => {
          const id = item._id || item.id;
          if (String(id) !== String(commentId)) return item;
          const nextCount =
            likesCountFromServer !== null
              ? likesCountFromServer
              : Math.max(0, (item.likesCount || 0) + (likedNow ? 1 : -1));
          return {
            ...item,
            viewerHasLiked: likedNow,
            likesCount: nextCount,
          };
        })
      );
    } catch (err) {
      alert(
        err?.response?.data?.message || "Failed to update comment like"
      );
    } finally {
      setCommentLikeBusy((prev) => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
    }
  };

  const handleEmojiToggle = () => {
    setShowEmojiPicker((prev) => !prev);
  };

  const handleEmojiSelect = (emoji) => {
    if (!emoji) return;
    setCommentText((prev) => `${prev}${emoji}`);
    setShowEmojiPicker(false);
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    const text = commentText.trim();
    if (!text || commentLoading) return;

    setCommentLoading(true);
    try {
      const { data } = await api.post("/comments", { postId, text });
      const newComment = {
        ...data,
        author: {
          username: viewer?.username,
          name: viewer?.name,
          avatarUrl: viewer?.avatarUrl,
        },
        createdAt: new Date().toISOString(),
        likesCount: 0,
        viewerHasLiked: false,
      };
      setComments((prev) => [newComment, ...prev]);
      setCommentText("");
      setShowEmojiPicker(false);
      setPost((prev) =>
        prev ? { ...prev, commentsCount: (prev.commentsCount || 0) + 1 } : prev
      );
    } catch (err) {
      console.error("Failed to post comment:", err);
      alert("Failed to send comment");
    } finally {
      setCommentLoading(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose?.();
  };


  return createPortal(
    <div className={styles.overlay} onClick={handleBackdropClick}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {loading ? (
          <div className={styles.loading}>Loading</div>
        ) : error ? (
          <div className={styles.error}>{error}</div>
        ) : (
          <>
            <div className={styles.imageCol}>
              <img src={post?.imageUrl} alt={post?.caption || "post"} />
            </div>

            <div className={styles.infoCol}>
              <header className={styles.header}>
                <div className={styles.headerMain}>
                  <Link
                    to={`/profile/${post?.author?.username}`}
                    className={styles.userBlock}
                    onClick={onClose}
                  >
                    <img
                      src={post?.author?.avatarUrl || "/placeholder-avatar.png"}
                      alt={post?.author?.username || "user"}
                    />
                    <div>
                      <div className={styles.username}>
                        {post?.author?.username}
                      </div>
                      {post?.author?.name && (
                        <div className={styles.fullName}>
                          {post.author.name}
                        </div>
                      )}
                    </div>
                  </Link>

                  {canFollow && (
                    <button
                      type="button"
                      className={
                        isFollowing ? styles.followingBtn : styles.followBtn
                      }
                      onClick={handleToggleFollow}
                      disabled={followBusy}
                    >
                      {isFollowing ? "Following" : "Follow"}
                    </button>
                  )}
                </div>

                <div className={styles.headerActions}>
                  {canManage && onRequestManage && (
                    <button
                      type="button"
                      className={styles.iconBtn}
                      onClick={() => onRequestManage(post)}
                      aria-label="More actions"
                    >
                      <i className="ri-more-line" />
                    </button>
                  )}
                  <button
                    type="button"
                    className={styles.iconBtn}
                    onClick={onClose}
                    aria-label="Close"
                  >
                    <i className="ri-close-line" />
                  </button>
                </div>
              </header>

              <div className={styles.scrollArea}>
                {post?.caption && (
                  <div className={styles.captionBlock}>
                    <p>
                      <strong>{post?.author?.username}</strong> {post.caption}
                    </p>
                  </div>
                )}
                <ul className={styles.comments}>
                  {comments.map((comment) => {
                    const commentKey = String(comment._id || comment.id);
                    const commentLiked = Boolean(comment.viewerHasLiked);
                    const likeBusy = Boolean(commentLikeBusy[commentKey]);

                    return (
                      <li key={commentKey} className={styles.commentItem}>
                        <div className={styles.commentTop}>
                          <div>
                            <p className={styles.commentText}>
                              <Link
                                to={`/profile/${comment.author?.username}`}
                                onClick={onClose}
                                className={styles.commentUser}
                              >
                                <strong>{comment.author?.username}</strong>
                              </Link>{"   "}
                              {comment.text}
                            </p>
                            <div className={styles.commentDetails}>
                              <span>{formatTimeAgo(comment.createdAt)}</span>
                              <span className={styles.commentLikesLabel}>
                                Likes: {comment.likesCount || 0}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            className={`${styles.iconBtn} ${
                              commentLiked ? styles.iconActive : ""
                            }`}
                            onClick={() => handleToggleCommentLike(commentKey)}
                            disabled={likeBusy}
                            aria-label={
                              commentLiked ? "Unlike comment" : "Like comment"
                            }
                          >
                            <i
                              className={
                                commentLiked ? "ri-heart-fill" : "ri-heart-line"
                              }
                            />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                  {comments.length === 0 && (
                    <li className={styles.empty}>No comments yet</li>
                  )}
                </ul>
              </div>

              <footer className={styles.footer}>
                <div className={styles.actions}>
                  <button
                    type="button"
                    className={`${styles.iconBtn} ${
                      liked ? styles.iconActive : ""
                    }`}
                    onClick={handleToggleLike}
                    aria-label={liked ? "Unlike" : "Like"}
                  >
                    <i className={liked ? "ri-heart-fill" : "ri-heart-line"} />
                  </button>
                  <button
                    type="button"
                    className={styles.iconBtn}
                    aria-label="Comment"
                  >
                    <i className="ri-chat-1-line" />
                  </button>
                </div>

                <div className={styles.footerMeta}>
                  <span className={styles.footerLikes}>{likeLabel}</span>
                  {postTimeLabel && (
                    <span className={styles.footerTime}>{postTimeLabel}</span>
                  )}
                </div>

                <form
                  className={styles.commentForm}
                  onSubmit={handleSubmitComment}
                >
                  <div className={styles.inputArea}>
                    <button
                      type="button"
                      className={styles.emojiBtn}
                      onClick={handleEmojiToggle}
                      disabled={commentLoading}
                      aria-label="Add emoji"
                    >
                      <i className="ri-emotion-line" />
                    </button>

                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Add comment"
                      disabled={commentLoading}
                    />

                    {showEmojiPicker && (
                      <div className={styles.emojiPicker}>
                        {EMOJI_PRESETS.map((emoji) => (
                          <button
                            type="button"
                            key={emoji}
                            onClick={() => handleEmojiSelect(emoji)}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={!commentText.trim() || commentLoading}
                  >
                    {commentLoading ? "Sending..." : "Send"}
                  </button>
                </form>
              </footer>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}











