import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  useRef,
  useCallback,
} from "react";
import { RiCloseLine, RiSearchLine } from "react-icons/ri";
import styles from "./SearchPanel.module.css";
import { api } from "../services/api";
import { Link } from "react-router-dom";

const LOCALSTORAGE_KEY = "ig_recent_searches";

export default function SearchPanel({ onClose }) {
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
    if (viewportW <= 520) return Math.min(480, Math.max(360, viewportW - 40));
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
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const timerRef = useRef(null);
  const [recentSearches, setRecentSearches] = useState([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCALSTORAGE_KEY);
      if (stored) setRecentSearches(JSON.parse(stored));
    } catch (err) {
      console.error("Could not load recent searches from local storage", err);
    }
  }, []);

  const fetchResults = useCallback(async (query) => {
    try {
      const { data } = await api.get("/search/users", { params: { q: query } });
      const users = data.map((user) => ({
        id: user._id || user.username,
        title: user.username,
        subtitle: user.name,
        avatarUrl: user.avatarUrl,
      }));
      setResults(users);

      if (users.length > 0) {
        setRecentSearches((prev) => {
          const combined = [...users, ...prev];

          const uniqueRecents = combined.filter(
            (user, index, self) =>
              index === self.findIndex((u) => u.title === user.title)
          );

          const limitedRecents = uniqueRecents.slice(0, 5);

          try {
            localStorage.setItem(
              LOCALSTORAGE_KEY,
              JSON.stringify(limitedRecents)
            );
          } catch (err) {
            console.error(
              "Could not save recent searches to local storage",
              err
            );
          }
          return limitedRecents;
        });
      }
    } catch (error) {
      console.error("Search failed:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    const trimmed = q.trim();
    if (!trimmed) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    timerRef.current = setTimeout(() => {
      fetchResults(trimmed);
    }, 350);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [q, fetchResults]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

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
        aria-labelledby="search-title"
      >
        <header className={styles.header}>
          <h2 id="search-title" className={styles.title}>
            Search
          </h2>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close search"
            title="Close"
          >
            <RiCloseLine size={22} />
          </button>
        </header>

        <div className={styles.body}>
          <div className={styles.searchBox}>
            <input
              className={styles.input}
              type="text"
              placeholder="Search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              autoFocus
            />
            {q && (
              <button
                type="button"
                className={styles.clearBtn}
                onClick={() => setQ("")}
                aria-label="Clear search"
                title="Clear search"
              >
                <RiCloseLine size={16} />
              </button>
            )}
          </div>

          <div className={styles.results}>
            {loading && <div className={styles.state}>Searching…</div>}
            {!loading && q && results.length === 0 && (
              <div className={styles.state}>Nothing found</div>
            )}
            {!loading && results.length > 0 && (
              <ul className={styles.list}>
                {results.map((r) => (
                  <li key={r.id} className={styles.item}>
                    <Link
                      to={`/profile/${r.title}`}
                      className={styles.itemLink}
                    >
                      {r.avatarUrl && (
                        <img
                          src={r.avatarUrl}
                          alt={r.title}
                          className={styles.itemAvatar}
                        />
                      )}
                      <div className={styles.itemText}>
                        <div className={styles.itemTitle}>{r.title}</div>
                        {r.subtitle && (
                          <div className={styles.itemSubtitle}>
                            {r.subtitle}
                          </div>
                        )}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {!loading && !q && (
              <div className={styles.recent}>
                <div className={styles.recentTitle}>Recent</div>
                {recentSearches.length === 0 ? (
                  <div className={styles.muted}>No recent searches</div>
                ) : (
                  <ul className={styles.list}>
                    {recentSearches.map((user) => (
                      <li key={user.id} className={styles.item}>
                        <Link
                          to={`/profile/${user.title}`}
                          className={styles.itemLink}
                        >
                          {user.avatarUrl && (
                            <img
                              src={user.avatarUrl}
                              alt={user.title}
                              className={styles.itemAvatar}
                            />
                          )}
                          <div className={styles.itemText}>
                            <div className={styles.itemTitle}>{user.title}</div>
                            {user.subtitle && (
                              <div className={styles.itemSubtitle}>
                                {user.subtitle}
                              </div>
                            )}
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
