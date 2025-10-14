import React, { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RiCloseLine } from "react-icons/ri";
import styles from "./Notifications.module.css";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../services/notifications";

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m} m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h`;
  const d = Math.floor(h / 24);
  return `${d} d`;
}

export default function Notifications({ onClose }) {
  const navigate = useNavigate();

  const [viewportW, setViewportW] = useState(0);
  const [sidebarRight, setSidebarRight] = useState(0);

  const measure = () => {
    setViewportW(window.innerWidth || 0);
    const sb = document.getElementById("sidebar-root");
    if (sb) setSidebarRight(Math.round(sb.getBoundingClientRect().right));
    else setSidebarRight(240);
  };

  useLayoutEffect(() => {
    measure();
  }, []);
  useEffect(() => {
    const onResize = () => measure();
    const onScroll = () => measure();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const panelWidth = useMemo(() => {
    const base = 397;
    if (viewportW <= 480) return Math.min(320, Math.max(300, viewportW - 60));
    if (viewportW >= 1440) return 397;
    return base;
  }, [viewportW]);

  const isMobileLayout = useMemo(() => {
    if (!viewportW) return sidebarRight === 0;
    return viewportW <= 768 || sidebarRight >= viewportW - 8;
  }, [viewportW, sidebarRight]);

  const leftPx = isMobileLayout ? 0 : Math.max(0, sidebarRight);

  const backdropStyle = isMobileLayout
    ? { position: "fixed", top: 0, bottom: 0, left: 0, right: 0 }
    : { position: "fixed", top: 0, bottom: 0, left: `${leftPx}px`, right: 0 };

  const panelStyle = isMobileLayout
    ? {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "100vh",
        width: "100vw",
      }
    : {
        position: "fixed",
        top: 0,
        left: `${leftPx}px`,
        height: "100vh",
        width: `${panelWidth}px`,
      };
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await getNotifications();

        if (Array.isArray(data)) {
          const unique = [...new Set(data.map((n) => n?.type).filter(Boolean))];
          console.log("[Notifications] unique types:", unique);
        }

        if (mounted) setItems(Array.isArray(data) ? data : []);
      } catch {
        if (mounted) setErr("Failed to load notifications");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const go = (to) => navigate(to);
  const toActorProfile = (n) => `/profile/${n?.actor?.username ?? "user"}`;

  const toPost = (n) => `/p/${n?.target?.postId ?? ""}`;

  const handleMarkAll = async () => {
    try {
      await markAllNotificationsRead();
    } catch {}
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const textFor = (n) => {
    const t = String(n?.type || "").toLowerCase();
    const followAliases = new Set([
      "follow",
      "follower",
      "followed",
      "new_follower",
      "new-follower",
    ]);
    if (t === "like") return "liked your photo.";
    if (t === "comment") return "commented your photo.";
    if (followAliases.has(t)) return "started following you.";
    return null;
  };

  const isPostRelated = (t) => t === "like" || t === "comment";

  return (
    <>
      <div
        className={styles.backdrop}
        style={backdropStyle}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={styles.panel}
        style={panelStyle}
        role="dialog"
        aria-modal="true"
        aria-labelledby="notifications-title"
      >
        <header className={styles.header}>
          <h2 id="notifications-title" className={styles.title}>
            Notifications
          </h2>
          <div className={styles.headerActions}>
            {items.some((n) => !n.read) && (
              <button className={styles.markAllBtn} onClick={handleMarkAll}>
                Mark all as read
              </button>
            )}
            <button
              type="button"
              className={styles.closeBtn}
              onClick={onClose}
              aria-label="Close notifications"
              title="Close"
            >
              <RiCloseLine size={22} />
            </button>
          </div>
        </header>

        <div className={styles.body}>
          <section className={styles.list} aria-label="Notifications list">
            <h3 className={styles.sectionTitle}>New</h3>

            {loading && <div className={styles.state}>Loading…</div>}
            {!!err && !loading && (
              <div className={styles.stateError}>{err}</div>
            )}
            {!loading && !err && items.length === 0 && (
              <div className={styles.state}>No notifications yet</div>
            )}

            {!loading &&
              !err &&
              items.map((n) => {
                const t = String(n?.type || "").toLowerCase();
                const openPost =
                  isPostRelated(t) && n?.target?.postId ? true : false;
                const text = textFor(n);
                if (!text) return null;

                return (
                  <div
                    key={n.id || n._id}
                    className={`${styles.item} ${
                      n.read ? styles.itemRead : ""
                    }`}
                    role="button"
                    tabIndex={0}
                    onClick={async () => {
                      try {
                        await markNotificationRead(n.id || n._id);
                      } catch {}
                      if (openPost) go(toPost(n));
                      else go(toActorProfile(n));
                    }}
                    onKeyDown={async (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        try {
                          await markNotificationRead(n.id || n._id);
                        } catch {}
                        if (openPost) go(toPost(n));
                        else go(toActorProfile(n));
                      }
                    }}
                  >
                    <button
                      type="button"
                      className={styles.itemAvatarBtn}
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          await markNotificationRead(n.id || n._id);
                        } catch {}
                        go(toActorProfile(n));
                      }}
                      title="Open profile"
                    >
                      <img
                        src={n.actor?.avatarUrl || "/placeholder-avatar.png"}
                        alt={n.actor?.username || "user"}
                        className={styles.avatar}
                        onError={(ev) => {
                          ev.currentTarget.src = "/placeholder-avatar.png";
                        }}
                      />
                    </button>

                    <div className={styles.text}>
                      <strong>{n.actor?.username || "user"}</strong> {text}
                      <div className={styles.time}>{timeAgo(n.createdAt)}</div>
                    </div>

                    {n.target?.previewUrl && (
                      <button
                        type="button"
                        className={styles.itemPreviewBtn}
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            await markNotificationRead(n.id || n._id);
                          } catch {}
                          go(toPost(n));
                        }}
                        title="Open post"
                      >
                        <img
                          src={n.target.previewUrl}
                          alt=""
                          className={styles.preview}
                          onError={(ev) => {
                            ev.currentTarget.style.visibility = "hidden";
                          }}
                        />
                      </button>
                    )}
                  </div>
                );
              })}
          </section>
        </div>
      </aside>
    </>
  );
}
