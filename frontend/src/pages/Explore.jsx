import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import NotificationsPanel from "../pages/Notifications";
import SearchPanel from "../components/SearchPanel";
import CreatePostOverlay from "../components/CreatePostOverlay";
import Footer from "../components/Footer";
import PostViewModal from "../components/PostViewModal";
import { api } from "../services/api";
import styles from "./Explore.module.css";

export default function Explore() {
  const [showNotif, setShowNotif] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activePostId, setActivePostId] = useState(null);

  const dimActive = showCreate;
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const { data } = await api.get("/posts/explore");
        if (!alive) return;
        setPosts(Array.isArray(data) ? data : []);
      } catch (err) {
        if (alive)
          setError(err?.response?.data?.message || "Failed to load content");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const activePost = useMemo(
    () => posts.find((p) => p._id === activePostId) || null,
    [posts, activePostId]
  );

  const handlePostCreated = (newPost) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  return (
    <div className={styles.page}>
      <Sidebar
        onOpenNotifications={() => setShowNotif(true)}
        onOpenSearch={() => setShowSearch(true)}
        onOpenCreate={() => setShowCreate(true)}
        isSearchOpen={showSearch}
        isNotifOpen={showNotif}
      />

      <main className={styles.main}>
        {dimActive && <div className={styles.dim} />}
        <div id="content-scope" className={styles.scope}>
          <div
            className={`${styles.inner} ${dimActive ? styles.innerDimmed : ""}`}
          >
            {loading && (
              <div className={styles.gridSkeleton}>
                {Array.from({ length: 9 }).map((_, idx) => (
                  <div key={idx} className={styles.tileSkeleton} />
                ))}
              </div>
            )}

            {!loading && error && <div className={styles.state}>{error}</div>}

            {!loading && !error && posts.length === 0 && (
              <div className={styles.state}>
                "No posts available. Create your first post!"
              </div>
            )}

            {!loading && !error && posts.length > 0 && (
              <div className={styles.grid}>
                {posts.map((post) => (
                  <div
                    key={post._id}
                    className={styles.tile}
                    onClick={() => setActivePostId(post._id)}
                  >
                    <img
                      src={post.imageUrl}
                      alt={post.caption || "post"}
                      loading="lazy"
                    />
                    <Link
                      to={`/profile/${post.author?.username}`}
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      className={styles.tileMeta}
                    >
                      <img
                        src={
                          post.author?.avatarUrl || "/placeholder-avatar.png"
                        }
                        alt={post.author?.username || "user"}
                      />
                      <span>{post.author?.username}</span>
                    </Link>
                  </div>
                ))}
              </div>
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
