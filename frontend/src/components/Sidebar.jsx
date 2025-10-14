import React, { useMemo } from "react";
import { NavLink } from "react-router-dom";
import {
  MdOutlineHome,
  MdHome,
  MdOutlineSearch,
  MdOutlineExplore,
  MdExplore,
  MdOutlineFavoriteBorder,
  MdFavorite,
  MdOutlineAddBox,
} from "react-icons/md";
import { RiMessengerLine, RiMessengerFill } from "react-icons/ri";
import styles from "./Sidebar.module.css";

export default function Sidebar({
  onOpenNotifications,
  onOpenCreate,
  onOpenSearch,
  isSearchOpen,
  isNotifOpen,
}) {
  const me = useMemo(() => {
    try {
      const m = JSON.parse(localStorage.getItem("me") || "{}")?.user;
      const u = JSON.parse(localStorage.getItem("user") || "{}");
      return m || u || {};
    } catch {
      return {};
    }
  }, []);

  const iconProps = { size: 24 };

  return (
    <aside id="sidebar-root">
      <div className={styles.sidebar}>
        <div className={styles.logo}>
          <img
            src="/images/ICHGRA 5.png"
            alt="ICHgram"
            className={styles.imageICH}
          />
        </div>

        <nav className={styles.nav}>
          {/* Home */}
          <NavLink to="/home" className={styles.navLink} end>
            {({ isActive }) => (
              <>
                <span className={styles.navIcon}>
                  {isActive ? (
                    <MdHome {...iconProps} />
                  ) : (
                    <MdOutlineHome {...iconProps} />
                  )}
                </span>
                <span className={styles.navLabel}>Home</span>
              </>
            )}
          </NavLink>

          <button
            type="button"
            className={`${styles.navLink} ${styles.navButton} ${
              isSearchOpen ? styles.active : ""
            }`}
            onClick={onOpenSearch}
            aria-label="Open search"
            aria-pressed={!!isSearchOpen}
          >
            <span
              className={`${styles.navIcon} ${
                isSearchOpen ? styles.filledCircle : ""
              }`}
            >
              <MdOutlineSearch {...iconProps} />
            </span>
            <span className={styles.navLabel}>Search</span>
          </button>

          <NavLink to="/explore" className={styles.navLink}>
            {({ isActive }) => (
              <>
                <span className={styles.navIcon}>
                  {isActive ? (
                    <MdExplore {...iconProps} />
                  ) : (
                    <MdOutlineExplore {...iconProps} />
                  )}
                </span>
                <span className={styles.navLabel}>Explore</span>
              </>
            )}
          </NavLink>

          <NavLink to="/messages" className={styles.navLink}>
            {({ isActive }) => (
              <>
                <span className={styles.navIcon}>
                  {isActive ? (
                    <RiMessengerFill {...iconProps} />
                  ) : (
                    <RiMessengerLine {...iconProps} />
                  )}
                </span>
                <span className={styles.navLabel}>Messages</span>
              </>
            )}
          </NavLink>

          <button
            type="button"
            className={`${styles.navLink} ${styles.navButton} ${
              isNotifOpen ? styles.active : ""
            }`}
            onClick={onOpenNotifications}
            aria-label="Open notifications"
            aria-pressed={!!isNotifOpen}
          >
            <span className={styles.navIcon}>
              {isNotifOpen ? (
                <MdFavorite {...iconProps} />
              ) : (
                <MdOutlineFavoriteBorder {...iconProps} />
              )}
            </span>
            <span className={styles.navLabel}>Notifications</span>
          </button>

          <button
            type="button"
            className={`${styles.navLink} ${styles.navButton}`}
            onClick={onOpenCreate}
            aria-label="Create post"
          >
            <span className={styles.navIcon}>
              <MdOutlineAddBox {...iconProps} />
            </span>
            <span className={styles.navLabel}>Create</span>
          </button>

          <div className={styles.profileDivider} />

          <NavLink
            to="/profile/me"
            className={`${styles.navLink} ${styles.profileLink}`}
          >
            <span className={styles.navIcon}>
              <img
                src={me.avatarUrl || "/placeholder-avatar.png"}
                alt={me.username || "profile"}
                className={styles.navAvatar}
              />
            </span>
            <span className={`${styles.navLabel} ${styles.profileLabel}`}>
              Profile
            </span>
          </NavLink>
        </nav>
      </div>
    </aside>
  );
}
