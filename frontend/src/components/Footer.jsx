import React, { useState } from "react";
import { Link } from "react-router-dom";
import SearchPanel from "./SearchPanel";
import NotificationsPanel from "../pages/Notifications";
import CreatePostOverlay from "./CreatePostOverlay";
import styles from "./Footer.module.css";

export default function Footer() {
  const [showSearch, setShowSearch] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  return (
    <>
      <footer className={styles.footer}>
        <nav className={styles.nav}>
          <Link to="/home" className={styles.link}>
            Home
          </Link>

          <button className={styles.link} onClick={() => setShowSearch(true)}>
            Search
          </button>

          <Link to="/explore" className={styles.link}>
            Explore
          </Link>

          <Link to="/messages" className={styles.link}>
            Messages
          </Link>

          <button className={styles.link} onClick={() => setShowNotif(true)}>
            Notifications
          </button>

          <button className={styles.link} onClick={() => setShowCreate(true)}>
            Create
          </button>
        </nav>
        <div className={styles.copy}>© 2024 ICHgram</div>
      </footer>

      {showSearch && <SearchPanel onClose={() => setShowSearch(false)} />}

      {showNotif && <NotificationsPanel onClose={() => setShowNotif(false)} />}

      {showCreate && <CreatePostOverlay onClose={() => setShowCreate(false)} />}
    </>
  );
}
