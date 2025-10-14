import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import NotificationsPanel from "../pages/Notifications";
import SearchPanel from "../components/SearchPanel";
import CreatePostOverlay from "./CreatePostOverlay";
import Footer from "../components/Footer";

import { api } from "../services/api";

import styles from "./FollowList.module.css";

export default function FollowList({ mode }) {
  const navigate = useNavigate();
  const { username } = useParams();

  const [profile, setProfile] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showNotif, setShowNotif] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [viewerFollowingMap, setViewerFollowingMap] = useState({});
  const [followBusy, setFollowBusy] = useState({});

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

  const formatCount = (value) =>
    new Intl.NumberFormat("ru-RU").format(
      Number.isFinite(Number(value)) ? Number(value) : 0
    );

  const viewerId = auth?.user?.id || auth?.user?._id;
  const authUsername = auth?.user?.username;

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const { data: profileData } = await api.get(
          `/users/${encodeURIComponent(username)}`,
          { headers: { "Cache-Control": "no-cache" } }
        );
        if (!alive) return;
        setProfile(profileData);

        const id = profileData?._id || profileData?.id;
        if (!id) throw new Error("User ID missing");

        const endpoint = mode === "following" ? "following" : "followers";
        const shouldFetchViewerFollowing = viewerId;

        const [listRes, myFollowingRes] = await Promise.all([
          api.get(`/follows/${endpoint}/${id}`, {
            headers: { "Cache-Control": "no-cache" },
          }),
          shouldFetchViewerFollowing
            ? api.get(`/follows/following/${viewerId}`, {
                headers: { "Cache-Control": "no-cache" },
              })
            : Promise.resolve({ data: [] }),
        ]);
        if (!alive) return;
        const listData = listRes?.data;
        setRows(Array.isArray(listData) ? listData : []);

        if (shouldFetchViewerFollowing) {
          const followingRows = Array.isArray(myFollowingRes?.data)
            ? myFollowingRes.data
            : [];
          const map = {};
          followingRows.forEach((user) => {
            const key = String(user?._id || user?.id || "");
            if (key) map[key] = true;
          });
          setViewerFollowingMap(map);
        } else {
          setViewerFollowingMap({});
        }
      } catch (e) {
        if (!alive) return;
        setError(
          e?.response?.data?.message ||
            "Failed to load users. Please try refreshing the page."
        );
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [mode, username, viewerId]);

  const title = mode === "following" ? "Following" : "Followers";
  const followersCount =
    profile?.followersCount ?? (mode === "followers" ? rows.length : 0);
  const followingCount =
    profile?.followingCount ?? (mode === "following" ? rows.length : 0);
  const isFollowersPage = mode !== "following";
  const isOwner =
    profile?.username && authUsername && profile.username === authUsername;

  const toggleFollow = async (target, shouldFollow) => {
    const targetId = target?._id || target?.id;
    const key = targetId ? String(targetId) : "";
    if (!key || followBusy[key]) return;
    try {
      setFollowBusy((prev) => ({ ...prev, [key]: true }));
      if (shouldFollow) {
        await api.post(
          "/follows/follow",
          { userId: targetId }
        );
        setViewerFollowingMap((prev) => ({ ...prev, [key]: true }));
      } else {
        await api.post(
          "/follows/unfollow",
          { userId: targetId }
        );
        setViewerFollowingMap((prev) => {
          const copy = { ...prev };
          delete copy[key];
          return copy;
        });
      }
    } catch (e) {
      console.error("Failed to toggle follow", e);
      alert(
        e?.response?.data?.message ||
          (shouldFollow ? "Failed to follow" : "Failed to unfollow")
      );
    } finally {
      setFollowBusy((prev) => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
    }
  };

  return (
    <div className={styles.page}>
      <aside className={styles.sidebar}>
        <Sidebar
          onOpenNotifications={() => setShowNotif(true)}
          onOpenSearch={() => setShowSearch(true)}
          onOpenCreate={() => setShowCreate(true)}
          isSearchOpen={showSearch}
          isNotifOpen={showNotif}
        />
      </aside>

      <main className={styles.main}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate(-1)}>
            Back
          </button>
          <div className={styles.headerText}>
            <h1 className={styles.title}>{title}</h1>
            {profile && (
              <span className={styles.subtitle}>@{profile.username}</span>
            )}
          </div>
        </div>

        <nav className={styles.tabs} aria-label="Follow relations">
          <Link
            to={`/profile/${username}/followers`}
            className={`${styles.tabLink} ${
              isFollowersPage ? styles.tabLinkActive : ""
            }`}
            aria-current={isFollowersPage ? "page" : undefined}
          >
            <span className={styles.tabNumber}>
              {formatCount(followersCount)}
            </span>
            <span className={styles.tabLabel}>followers</span>
          </Link>
          <Link
            to={`/profile/${username}/following`}
            className={`${styles.tabLink} ${
              !isFollowersPage ? styles.tabLinkActive : ""
            }`}
            aria-current={!isFollowersPage ? "page" : undefined}
          >
            <span className={styles.tabNumber}>
              {formatCount(followingCount)}
            </span>
            <span className={styles.tabLabel}>following</span>
          </Link>
        </nav>

        <section className={styles.listCard}>
          {loading ? (
            <div className={styles.stateBox}>Загрузка…</div>
          ) : error ? (
            <div className={`${styles.stateBox} ${styles.error}`}>{error}</div>
          ) : rows.length === 0 ? (
            <div className={styles.stateBox}>
              {mode === "following"
                ? "User is not following anyone."
                : "User has no followers yet."}
            </div>
          ) : (
            <ul className={styles.list}>
              {rows.map((user) => {
                const key = String(user._id || user.id || "");
                const isSelf = auth?.user?.username === user.username;
                const alreadyFollowing = Boolean(viewerFollowingMap[key]);
                const canToggleFollow =
                  viewerId && !isSelf && key
                    ? mode === "followers"
                      ? isOwner
                      : true
                    : false;

                return (
                  <li key={key || user.username} className={styles.item}>
                    <Link
                      to={`/profile/${user.username}`}
                      className={styles.profileLink}
                    >
                      <img
                        src={user.avatarUrl || "/placeholder-avatar.png"}
                        alt={user.username}
                        className={styles.avatar}
                      />
                      <div className={styles.meta}>
                        <span className={styles.username}>{user.username}</span>
                        {(user.name || user.fullName) && (
                          <span className={styles.name}>
                            {user.name || user.fullName}
                          </span>
                        )}
                      </div>
                    </Link>
                    <div className={styles.actions}>
                      {isSelf ? <span className={styles.badge}></span> : null}
                      {canToggleFollow ? (
                        alreadyFollowing ? (
                          <button
                            type="button"
                            className={`${styles.followBtn} ${styles.followBtnMuted}`}
                            onClick={() => toggleFollow(user, false)}
                            disabled={!!followBusy[key]}
                          >
                            Unfollow
                          </button>
                        ) : (
                          <button
                            type="button"
                            className={styles.followBtn}
                            onClick={() => toggleFollow(user, true)}
                            disabled={!!followBusy[key]}
                          >
                            Follow
                          </button>
                        )
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <div className={styles.footerSlot}>
          <Footer />
        </div>
      </main>

      {showNotif && <NotificationsPanel onClose={() => setShowNotif(false)} />}
      {showSearch && <SearchPanel onClose={() => setShowSearch(false)} />}
      {showCreate && (
        <CreatePostOverlay
          onClose={() => setShowCreate(false)}
        />
      )}
    </div>
  );
}


