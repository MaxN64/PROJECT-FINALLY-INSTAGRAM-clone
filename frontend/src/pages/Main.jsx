import React, {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import NotificationsPanel from "../pages/Notifications";
import SearchPanel from "../components/SearchPanel";
import CreatePostOverlay from "../components/CreatePostOverlay";
import Footer from "../components/Footer";
import PostViewModal from "../components/PostViewModal";
import { api } from "../services/api";
import styles from "./Main.module.css";

const formatTimeAgo = (value) => {
  if (!value) return "just now";
  const created = new Date(value).getTime();
  if (Number.isNaN(created)) return "just now";

  const diff = Date.now() - created;
  const minutes = Math.max(1, Math.floor(diff / 60000));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hours`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} days`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} week`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month`;
  const years = Math.floor(days / 365);
  return `${years} y`;
};

const formatCount = (value) =>
  new Intl.NumberFormat("ru-RU").format(
    Number.isFinite(Number(value)) ? Number(value) : 0
  );

export default function Main() {
  const [showNotif, setShowNotif] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activePostId, setActivePostId] = useState(null);
  const [likeBusy, setLikeBusy] = useState({});
  const [followBusy, setFollowBusy] = useState({}); // NEW

  const dimActive = showCreate;
  const viewer = useMemo(() => {
    try {
      const me = JSON.parse(localStorage.getItem("me") || "{}");
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      return me?.user?.username ? me.user : user?.user || user || {};
    } catch {
      return {};
    }
  }, []);
  const viewerId = viewer?.id || viewer?._id;
  const activePost = useMemo(
    () => posts.find((post) => post._id === activePostId) || null,
    [posts, activePostId]
  );

  const hydratePosts = useCallback(
    async (rawPosts) => {
      if (!Array.isArray(rawPosts) || rawPosts.length === 0) return [];
      const tasks = rawPosts.map(async (post) => {
        const [liked, previewComment] = await Promise.all([
          viewerId
            ? api
                .get(`/likes/post/${post._id}`)
                .then(({ data }) => {
                  if (!Array.isArray(data)) return false;
                  return data.some((entry) => {
                    const likeUser = entry.user || {};
                    const id = likeUser._id || likeUser.id || entry.user;
                    return id && String(id) === String(viewerId);
                  });
                })
                .catch(() => false)
            : false,
          post.commentsCount > 0
            ? api
                .get(`/comments/post/${post._id}`, { params: { limit: 1 } })
                .then(({ data }) =>
                  Array.isArray(data) && data.length > 0 ? data[0] : null
                )
                .catch(() => null)
            : null,
        ]);

        return {
          ...post,
          liked,
          previewComment: previewComment || null,
        };
      });

      try {
        return await Promise.all(tasks);
      } catch {
        return rawPosts;
      }
    },
    [viewerId]
  );

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const { data } = await api.get("/posts/feed");
        if (!alive) return;
        const baseList = Array.isArray(data) ? data : [];
        const enriched = await hydratePosts(baseList);
        if (!alive) return;
        setPosts(enriched);
      } catch (err) {
        if (alive) {
          setError(err?.response?.data?.message || "Failed to load posts");
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [hydratePosts, viewerId]);

  const handlePostCreated = async (newPost) => {
    const [enriched] = await hydratePosts([newPost]);
    setPosts((prev) => [enriched || newPost, ...prev]);
  };

  const handleToggleLike = async (postId) => {
    if (likeBusy[postId]) return;
    const target = posts.find((item) => item._id === postId);
    if (!target) return;
    setLikeBusy((prev) => ({ ...prev, [postId]: true }));
    try {
      const { data } = await api.post("/likes/toggle", { postId });
      const likedNow = Boolean(data?.liked);
      setPosts((prev) =>
        prev.map((item) => {
          if (item._id !== postId) return item;
          const currentLikes = item.likesCount || 0;
          const delta =
            likedNow && !item.liked ? 1 : !likedNow && item.liked ? -1 : 0;
          return {
            ...item,
            liked: likedNow,
            likesCount: Math.max(0, currentLikes + delta),
          };
        })
      );
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to like post");
    } finally {
      setLikeBusy((prev) => {
        const copy = { ...prev };
        delete copy[postId];
        return copy;
      });
    }
  };

  const handleToggleFollow = async (author) => {
    const targetId = author?._id || author?.id;
    if (!targetId || followBusy[targetId]) return;

    setFollowBusy((p) => ({ ...p, [targetId]: true }));
    try {
      const { data } = await api.post("/follows/toggle", {
        targetUserId: targetId,
      });
      const followingNow = Boolean(data?.following);

      setPosts((prev) =>
        prev.map((item) =>
          String(item.author?._id || item.author?.id) === String(targetId)
            ? { ...item, author: { ...item.author, isFollowing: followingNow } }
            : item
        )
      );
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to follow/unfollow user");
    } finally {
      setFollowBusy((p) => {
        const cp = { ...p };
        delete cp[targetId];
        return cp;
      });
    }
  };

  const handleCommentIcon = (postId) => {
    setActivePostId(postId);
  };

  return (
    <div className={styles.container}>
      <Sidebar
        onOpenNotifications={() => setShowNotif(true)}
        onOpenSearch={() => setShowSearch(true)}
        onOpenCreate={() => setShowCreate(true)}
        isSearchOpen={showSearch}
        isNotifOpen={showNotif}
      />

      <main className={styles.feed}>
        <div id="content-scope" className={styles.feedScope}>
          {showCreate && <div className={styles.dim} />}
          <div
            className={`${styles.feedInner} ${
              showCreate ? styles.feedInnerDimmed : ""
            }`}
          >
            {loading && (
              <div className={styles.gridSkeleton}>
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className={styles.cardSkeleton}>
                    <div className={styles.cardSkeletonHeader} />
                    <div className={styles.cardSkeletonImage} />
                    <div className={styles.cardSkeletonMeta} />
                  </div>
                ))}
              </div>
            )}

            {!loading && error && (
              <div className={styles.stateMessage}>{error}</div>
            )}

            {!loading && !error && posts.length === 0 && (
              <div className={styles.stateMessage}>
                No posts available yet. Follow some users to see their posts in
                your feed.
              </div>
            )}

            {!loading && !error && posts.length > 0 && (
              <Fragment>
                <div className={styles.postsGrid}>
                  {posts.map((post) => {
                    const authorId = post.author?._id || post.author?.id;
                    const canFollow =
                      viewerId && String(viewerId) !== String(authorId);

                    return (
                      <article key={post._id} className={styles.card}>
                        <header className={styles.cardHeader}>
                          <div className={styles.headerLeft}>
                            <Link
                              to={`/profile/${post.author?.username}`}
                              className={styles.headerLink}
                            >
                              <img
                                src={
                                  post.author?.avatarUrl ||
                                  "/placeholder-avatar.png"
                                }
                                alt={post.author?.username || "user"}
                                className={styles.avatar}
                              />
                            </Link>

                            <div className={styles.headerMeta}>
                              <Link
                                to={`/profile/${post.author?.username}`}
                                className={styles.username}
                              >
                                {post.author?.username}
                              </Link>
                              <span className={styles.dot}>•</span>
                              <span className={styles.timeAgo}>
                                {formatTimeAgo(post.createdAt)}
                              </span>
                            </div>
                          </div>

                          {canFollow && (
                            <button
                              type="button"
                              className={
                                post.author?.isFollowing
                                  ? styles.followingBtn
                                  : styles.followBtn
                              }
                              onClick={() => handleToggleFollow(post.author)}
                              disabled={!!followBusy[authorId]}
                            >
                              {post.author?.isFollowing
                                ? "Following"
                                : "Follow"}
                            </button>
                          )}
                        </header>

                        <button
                          type="button"
                          className={styles.imageButton}
                          onClick={() => setActivePostId(post._id)}
                          aria-label="Open post"
                        >
                          <div className={styles.imageFrame}>
                            <img
                              src={post.imageUrl}
                              alt={post.caption || "post"}
                              className={styles.postImage}
                            />
                          </div>
                        </button>

                        <div className={styles.cardBody}>
                          <div className={styles.iconRow}>
                            <button
                              type="button"
                              aria-label={post.liked ? "Unlike" : "Like"}
                              className={`${styles.actionBtn} ${
                                post.liked ? styles.actionBtnActive : ""
                              }`}
                              onClick={() => handleToggleLike(post._id)}
                              disabled={!!likeBusy[post._id]}
                            >
                              <i
                                className={
                                  post.liked ? "ri-heart-fill" : "ri-heart-line"
                                }
                              />
                            </button>
                            <button
                              type="button"
                              aria-label="Comment"
                              className={styles.actionBtn}
                              onClick={() => handleCommentIcon(post._id)}
                            >
                              <i className="ri-chat-1-line" />
                            </button>
                          </div>

                          <p className={styles.likesLine}>
                            {formatCount(post.likesCount || 0)} likes
                          </p>

                          {post.caption && (
                            <p className={styles.caption}>
                              <Link
                                to={`/profile/${post.author?.username}`}
                                className={styles.captionUser}
                              >
                                {post.author?.username}
                              </Link>
                              <span> {post.caption}</span>
                            </p>
                          )}

                          {post.previewComment &&
                            post.previewComment.author && (
                              <p className={styles.commentPreview}>
                                <Link
                                  to={`/profile/${post.previewComment.author?.username}`}
                                  className={styles.commentUser}
                                >
                                  {post.previewComment.author?.username}
                                </Link>
                                <span> {post.previewComment.text}</span>
                              </p>
                            )}

                          {post.commentsCount > 0 && (
                            <button
                              type="button"
                              className={styles.viewComments}
                              onClick={() => setActivePostId(post._id)}
                            >
                              View all comments (
                              {formatCount(post.commentsCount)})
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>

                <div className={styles.endMessage}>
                  <div className={styles.endIcon}>
                    <svg
                      width="68"
                      height="68"
                      viewBox="0 0 48 48"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle
                        cx="24"
                        cy="24"
                        r="23"
                        stroke="url(#gradient)"
                        strokeWidth="2"
                      />
                      <path
                        d="M16 24L22 30L32 18"
                        stroke="url(#gradient)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <defs>
                        <linearGradient
                          id="gradient"
                          x1="12"
                          y1="12"
                          x2="36"
                          y2="36"
                          gradientUnits="userSpaceOnUse"
                        >
                          <stop stopColor="#FFDD55" />
                          <stop offset="0.5" stopColor="#FF543E" />
                          <stop offset="1" stopColor="#C837AB" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                  <h4>You've seen all the updates</h4>
                  <p>You have viewed all new publications</p>
                </div>
              </Fragment>
            )}

            <Footer />
          </div>
        </div>
      </main>

      {showNotif && <NotificationsPanel onClose={() => setShowNotif(false)} />}
      {showSearch && <SearchPanel onClose={() => setShowSearch(false)} />}
      {showCreate && (
        <CreatePostOverlay
          onClose={() => setShowCreate(false)}
          onCreated={handlePostCreated}
        />
      )}

      {activePostId && (
        <PostViewModal
          postId={activePostId}
          initialPost={activePost}
          onClose={() => setActivePostId(null)}
        />
      )}
    </div>
  );
}
