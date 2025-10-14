import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import NotificationsPanel from "./Notifications";
import SearchPanel from "../components/SearchPanel";

import Footer from "../components/Footer";

import { api } from "../services/api";
import CreatePostOverlay from "../components/CreatePostOverlay";
import ProfileEditOverlay from "../components/ProfileEditOverlay";
import PostActionsSheet from "../components/PostActionsSheet";
import PostEditModal from "../components/PostEditModal";
import PostViewModal from "../components/PostViewModal";

import styles from "./Profile.module.css";

export default function Profile() {
  const navigate = useNavigate();
  const { username } = useParams();

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [activePost, setActivePost] = useState(null);
  const [viewPostId, setViewPostId] = useState(null);

  const dimActive = sheetOpen || editOpen || isCreateOpen || isEditOpen;

  const auth = useMemo(() => {
    try {
      const me = JSON.parse(localStorage.getItem("me") || "{}");
      const legacy = JSON.parse(localStorage.getItem("user") || "{}");
      const user = me?.user?.username ? me.user : legacy?.user || legacy || {};
      return { user };
    } catch {
      return { user: {} };
    }
  }, []);

  const isOwner = profile && auth?.user?.username === profile?.username;
  const viewerId = auth?.user?.id || auth?.user?._id || null;
  const profileId = profile?._id || profile?.id;

  const [following, setFollowing] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);

  const placeholderCells = useMemo(
    () => Array.from({ length: 6 }, (_, i) => i),
    []
  );

  const followerRoute = useMemo(() => {
    const uname = profile?.username;
    return uname ? `/profile/${uname}/followers` : "";
  }, [profile?.username]);

  const followingRoute = useMemo(() => {
    const uname = profile?.username;
    return uname ? `/profile/${uname}/following` : "";
  }, [profile?.username]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErr("");

        const pRes = await api.get(`/users/${encodeURIComponent(username)}`, {
          headers: { "Cache-Control": "no-cache" },
        });

        const listRes = await api.get(`/posts`, {
          params: { user: username },
          headers: { "Cache-Control": "no-cache" },
        });

        if (!alive) return;

        setProfile(pRes?.data || null);
        const list = listRes?.data;
        setPosts(Array.isArray(list) ? list : list?.items || []);
      } catch (e) {
        if (alive)
          setErr(e?.response?.data?.message || "Failed to load profile");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [username]);

  const handleProfileUpdated = (patch) => {
    setProfile((prev) => ({ ...prev, ...patch }));
  };

  const handlePostCreated = (newPost) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  const openSheet = (post) => {
    setActivePost(post);
    setSheetOpen(true);
  };

  const handleDeletePost = async (post) => {
    try {
      await api.delete(`/posts/${post._id}`);
      setPosts((prev) => prev.filter((p) => p._id !== post._id));
      setSheetOpen(false);
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to delete post");
    }
  };

  const handlePostEdited = (updated) => {
    setPosts((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
  };

  const viewPost = useMemo(
    () => posts.find((p) => p._id === viewPostId) || null,
    [posts, viewPostId]
  );

  useEffect(() => {
    if (!profileId || isOwner || !viewerId) {
      setFollowing(false);
      return;
    }

    let alive = true;
    (async () => {
      try {
        const { data } = await api.get(`/follows/followers/${profileId}`);
        if (!alive) return;
        const rows = Array.isArray(data) ? data : [];
        const match = rows.some((row) => {
          const id = row?._id || row?.id;
          return id && String(id) === String(viewerId);
        });
        setFollowing(match);
      } catch {
        if (alive) setFollowing(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [profileId, isOwner, viewerId]);

  const handleToggleFollow = async () => {
    if (!profileId || !viewerId) return;
    try {
      setFollowBusy(true);
      if (following) {
        await api.post(
          "/follows/unfollow",
          { userId: profileId }
        );
        setFollowing(false);
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                followersCount: Math.max(0, (prev.followersCount || 0) - 1),
              }
            : prev
        );
      } else {
        await api.post(
          "/follows/follow",
          { userId: profileId }
        );
        setFollowing(true);
        setProfile((prev) =>
          prev
            ? { ...prev, followersCount: (prev.followersCount || 0) + 1 }
            : prev
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setFollowBusy(false);
    }
  };

  const handleSendMessage = () => {
    if (!profileId || !viewerId) return;

    navigate("/messages", {
      state: {
        peer: {
          _id: profileId,
          username: profile?.username || "",
          avatarUrl: profile?.avatarUrl || "",
        },
      },
    });
  };


  const formatUrl = (u) => {
    if (!u) return "";
    const trimmed = String(u).trim();
    const hasProtocol = /^https?:\/\//i.test(trimmed);
    return hasProtocol ? trimmed : `https://${trimmed}`;
  };
  const stripProtocol = (u = "") => String(u).replace(/^https?:\/\//i, "");
  const formatCount = (n) =>
    new Intl.NumberFormat("ru-RU").format(Number(n || 0));

  const renderLayout = (body) => (
    <div className={styles.page}>
      <div id="sidebar-root">
        <Sidebar
          onOpenNotifications={() => setShowNotif(true)}
          onOpenSearch={() => setShowSearch(true)}
          onOpenCreate={() => setIsCreateOpen(true)}
          isSearchOpen={showSearch}
          isNotifOpen={showNotif}
        />
      </div>

      <main className={styles.main}>
       
        <div
          id="content-scope"
          className={styles.bodyArea}
          style={{ position: "relative" }}
        >
          {dimActive && <div className={styles.dim} />}
          <div
            className={`${styles.mainInner} ${
              dimActive ? styles.mainInnerDimmed : ""
            }`}
          >
            {body}
          </div>
        </div>

        <div className={styles.footerSlot}>
          <Footer />
        </div>
      </main>

      {showNotif && <NotificationsPanel onClose={() => setShowNotif(false)} />}
      {showSearch && <SearchPanel onClose={() => setShowSearch(false)} />}
    </div>
  );

  if (loading) {
    return renderLayout(
      <div className={styles.skeleton}>
        <div className={styles.skeletonHeader}>
          <div className={styles.skeletonAvatar} />
          <div className={styles.skeletonLines}>
            <div className={styles.skeletonLineWide} />
            <div className={styles.skeletonLine} />
            <div className={styles.skeletonLine} />
          </div>
        </div>

        <div className={styles.skeletonGrid}>
          {placeholderCells.map((i) => (
            <div key={i} className={styles.skeletonTile} />
          ))}
        </div>
      </div>
    );
  }

  if (err) {
    return renderLayout(
      <div className={styles.stateMessage}>
        <p className={styles.error}>{err}</p>
      </div>
    );
  }

  if (!profile) {
    return renderLayout(
      <div className={styles.stateMessage}>
        <p className={styles.error}>
          Profile not found. Try refreshing the page later.
        </p>
      </div>
    );
  }

  const content = (
    <div className={styles.content}>
      <section className={styles.profileCard}>
        <div className={styles.avatarWrapper}>
          <div className={styles.avatarRing}>
            <img
              className={styles.avatar}
              src={profile.avatarUrl || "/placeholder-avatar.png"}
              alt={profile.username}
            />
          </div>

          {isOwner && <p className={styles.avatarHelper}></p>}
        </div>

        <div className={styles.profileInfo}>
        
          <div className={styles.usernameRow}>
            <h1 className={styles.username}>{profile.username}</h1>
            {isOwner ? (
              <div className={styles.ownerButtons}>
                <button
                  className={styles.secondaryBtn}
                  onClick={() => setIsEditOpen(true)}
                >
                  Edit profile
                </button>
              </div>
            ) : (
              <div className={styles.viewerButtons}>
                <button
                  type="button"
                  className={`${styles.viewerBtn} ${
                    following
                      ? styles.viewerBtnFollowing
                      : styles.viewerBtnPrimary
                  }`}
                  onClick={handleToggleFollow}
                  disabled={followBusy}
                >
                  {following ? "Following" : "Follow"}
                </button>
                <button
                  type="button"
                  className={`${styles.viewerBtn} ${styles.viewerBtnGhost}`}
                  onClick={handleSendMessage}
                >
                  Message
                </button>
              </div>
            )}
          </div>

          {profile.name && <p className={styles.displayName}>{profile.name}</p>}

          {/* 2) Статистика под username */}
          <ul className={`${styles.stats} ${styles.statsUnderName}`}>
            <li className={styles.statItem}>
              <div className={styles.statDisplay}>
                <span className={styles.statNumber}>
                  {formatCount(posts.length)}
                </span>
                <span className={styles.statLabel}>posts</span>
              </div>
            </li>
            <li className={styles.statItem}>
              {followerRoute ? (
                <Link to={followerRoute} className={styles.statButton}>
                  <span className={styles.statNumber}>
                    {formatCount(profile.followersCount || 0)}
                  </span>
                  <span className={styles.statLabel}>followers</span>
                </Link>
              ) : (
                <span
                  className={`${styles.statButton} ${styles.statButtonDisabled}`}
                >
                  <span className={styles.statNumber}>
                    {formatCount(profile.followersCount || 0)}
                  </span>
                  <span className={styles.statLabel}>followers</span>
                </span>
              )}
            </li>
            <li className={styles.statItem}>
              {followingRoute ? (
                <Link to={followingRoute} className={styles.statButton}>
                  <span className={styles.statNumber}>
                    {formatCount(profile.followingCount || 0)}
                  </span>
                  <span className={styles.statLabel}>following</span>
                </Link>
              ) : (
                <span
                  className={`${styles.statButton} ${styles.statButtonDisabled}`}
                >
                  <span className={styles.statNumber}>
                    {formatCount(profile.followingCount || 0)}
                  </span>
                  <span className={styles.statLabel}>following</span>
                </span>
              )}
            </li>
          </ul>

          {/* 3) Био/ФИО/сайт */}
          <div className={styles.details}>
            {profile.fullName ? (
              <h2 className={styles.fullName}>{profile.fullName}</h2>
            ) : (
              <p className={styles.placeholder}></p>
            )}

            {profile.bio ? (
              <p className={styles.bio}>{profile.bio}</p>
            ) : (
              <div className={styles.hintBox}>
                <p className={styles.hintTitle}>What to write in bio:</p>
                <ul className={styles.hintList}>
                  <li>Line 1 — who you are and what you offer.</li>
                  <li>Line 2 — content format or offer.</li>
                  <li>Line 3 — proof of experience.</li>
                </ul>
              </div>
            )}

            {profile.website && (
              <a
                href={formatUrl(profile.website)}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.profileWebsite}
              >
                🔗 {stripProtocol(profile.website)}
              </a>
            )}
          </div>
        </div>
      </section>

      <section className={styles.postsSection}>
        {posts.length > 0 ? (
          <div className={styles.grid}>
            {posts.map((p) => (
              <article key={p._id} className={styles.postCard}>
                {isOwner && (
                  <button
                    className={styles.cardMore}
                    onClick={() => openSheet(p)}
                    aria-label="More actions"
                    title="More"
                  >
                    ⋯
                  </button>
                )}
                <img
                  className={styles.postImage}
                  src={p.imageUrl}
                  alt={p.caption || "post"}
                  onClick={() => setViewPostId(p._id)}
                />
              </article>
            ))}
          </div>
        ) : (
          <div className={styles.placeholderWrap}>
            <div className={styles.placeholderGrid}>
              {placeholderCells.map((cell) => (
                <div key={cell} className={styles.placeholderCell}>
                  <span className={styles.placeholderIcon}>+</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );

  return (
    <>
      {renderLayout(content)}

      {isCreateOpen && (
        <CreatePostOverlay
          onClose={() => setIsCreateOpen(false)}
          onCreated={handlePostCreated}
        />
      )}

      {isEditOpen && (
        <ProfileEditOverlay
          profile={profile}
          onClose={() => setIsEditOpen(false)}
          onUpdated={handleProfileUpdated}
        />
      )}

      {viewPostId && (
        <PostViewModal
          postId={viewPostId}
          initialPost={viewPost}
          onClose={() => setViewPostId(null)}
          onRequestManage={
            isOwner
              ? (post) => {
                  setActivePost(post);
                  setSheetOpen(true);
                }
              : undefined
          }
        />
      )}

      <PostActionsSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        post={activePost}
        canEdit={isOwner}
        onDelete={handleDeletePost}
        onEdit={() => {
          setSheetOpen(false);
          setEditOpen(true);
        }}
      />

      {editOpen && activePost && (
        <PostEditModal
          open={editOpen}
          post={activePost}
          onClose={() => setEditOpen(false)}
          onUpdated={handlePostEdited}
        />
      )}
    </>
  );
}






