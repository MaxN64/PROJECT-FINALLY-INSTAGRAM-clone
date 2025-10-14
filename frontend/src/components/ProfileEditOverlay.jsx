import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import NotificationsPanel from "../pages/Notifications";
import Footer from "../components/Footer";
import { api } from "../services/api";
import { authService } from "../services/authService";
import { clearAccessToken } from "../services/authToken";
import { disconnectSocket } from "../services/socket";
import styles from "./ProfileEditOverlay.module.css";

export default function ProfileEditOverlay({ profile, onClose, onUpdated }) {
  const navigate = useNavigate();
  const [username] = useState(profile.username || "");
  const [website, setWebsite] = useState(profile.website || "");
  const [bio, setBio] = useState(profile.bio || "");
  const [avatarPreview, setAvatarPreview] = useState(
    profile.avatarUrl || "/placeholder-avatar.png"
  );
  const [avatarBase64, setAvatarBase64] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showNotif, setShowNotif] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const bioLimit = 150;
  const bioCount = useMemo(() => bio.length, [bio]);

  const handlePickAvatar = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarPreview(URL.createObjectURL(file));
    const reader = new FileReader();
    reader.onload = () => setAvatarBase64(String(reader.result || ""));
    reader.readAsDataURL(file);
  };

  const normalizeUrl = (u) => {
    if (!u) return "";
    const t = u.trim();
    return /^https?:\/\//i.test(t) ? t : `https://${t}`;
  };

  const handleSubmit = async (evt) => {
    evt.preventDefault();
    try {
      setSaving(true);
      setError("");

      const payload = {
        bio: bio.trim(),
        website: website.trim() ? normalizeUrl(website) : undefined,
        avatarUrl: avatarBase64 || undefined,
      };

      const { data } = await api.patch(`/users/me`, payload);

      onUpdated({
        bio: data.bio ?? bio,
        avatarUrl: data.avatarUrl ?? profile.avatarUrl,
        website: data.website ?? website,
      });
      onClose();
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        "Failed to save changes. Please check your connection and try again.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const clearAuthState = () => {
    clearAccessToken();
    try {
      localStorage.removeItem("me");
      localStorage.removeItem("user");
    } catch (storageError) {
      console.warn("Failed to clear auth storage", storageError);
    }
    disconnectSocket();
  };

  const handleLogout = () => {
    clearAuthState();
    setShowLogoutConfirm(false);
    onClose?.();
    navigate("/login", { replace: true });
  };

  const handleDeleteAccount = async () => {
    try {
      setDeleteBusy(true);
      setDeleteError("");
      await api.delete("/users/me");
      try {
        await authService.logout();
      } catch (logoutError) {
        console.warn("Logout after delete failed", logoutError);
      }
      clearAuthState();
      setShowDeleteConfirm(false);
      onClose?.();
      navigate("/login", { replace: true });
    } catch (e) {
      const message =
        e?.response?.data?.message ||
        "Failed to delete account. Please try again later.";
      setDeleteError(message);
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <div className={styles.backdrop}>
      <div className={styles.shell}>
        <aside className={styles.sidebar}>
          <Sidebar onOpenNotifications={() => setShowNotif(true)} />
        </aside>

        <main className={styles.main}>
          <div className={styles.topBar}>
            <h1 className={styles.pageTitle}>Edit profile</h1>
            <div className={styles.topActions}>
              <button
                type="button"
                className={styles.instagramLogoutBtn}
                onClick={() => setShowLogoutConfirm(true)}
              >
                Switch Account
              </button>
              <button
                type="button"
                className={styles.instagramDeleteBtn}
                onClick={() => setShowDeleteConfirm(true)}
              >
                Delete Account
              </button>
            </div>
          </div>

          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.headerLeft}>
                <img
                  src={avatarPreview}
                  alt={username}
                  className={styles.avatar}
                />
                <div className={styles.headerText}>
                  <div className={styles.profileTitle}>
                    {username || "profile"}
                  </div>
                  <div className={styles.profileSub}>
                    •
                    <br />
                  </div>
                </div>
              </div>

              <label className={styles.photoBtn}>
                New photo
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePickAvatar}
                  hidden
                />
              </label>
            </div>

            <form className={styles.form} onSubmit={handleSubmit}>
              <label className={styles.field}>
                <span className={styles.label}>Username</span>
                <input
                  className={styles.input}
                  value={username}
                  readOnly
                  disabled
                  aria-readonly="true"
                />
              </label>

              <label className={styles.field}>
                <span className={styles.label}>Website</span>
                <div className={styles.withIcon}>
                  <span className={styles.linkIcon}>🔗</span>
                  <input
                    className={`${styles.input} ${styles.pl48}`}
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="bit.ly/3rpilbh"
                  />
                </div>
              </label>

              <label className={styles.field}>
                <span className={styles.label}>About</span>
                <div className={styles.textareaWrap}>
                  <textarea
                    className={styles.textarea}
                    value={bio}
                    maxLength={bioLimit}
                    onChange={(e) => setBio(e.target.value.slice(0, bioLimit))}
                    placeholder={"•  "}
                    rows={4}
                  />
                  <span className={styles.counterBox}>
                    {bioCount} / {bioLimit}
                  </span>
                </div>
              </label>

              {error && <div className={styles.error}>{error}</div>}

              <div className={styles.actions}>
                <button
                  type="submit"
                  className={styles.saveBtn}
                  disabled={saving}
                >
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </section>

          <div className={styles.footerSlot}>
            <Footer />
          </div>
        </main>
      </div>

      {showNotif && <NotificationsPanel onClose={() => setShowNotif(false)} />}

      {showLogoutConfirm && (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true">
          <div className={styles.modal}>
            <h2 className={styles.modalTitle}>Switch Account</h2>
            <p className={styles.modalText}>
              Are you sure you want to switch accounts? You'll need to log in
              again.
            </p>
            <div className={styles.modalActions}>
              <button
                className={styles.modalSecondary}
                onClick={() => setShowLogoutConfirm(false)}
              >
                Cancel
              </button>
              <button className={styles.modalPrimary} onClick={handleLogout}>
                Switch
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true">
          <div className={styles.modal}>
            <h2 className={styles.modalTitle}>Delete Account</h2>
            <p className={styles.modalText}>
              This action cannot be undone. All your posts, messages, and
              followers will be permanently deleted.
            </p>
            {deleteError && (
              <div className={styles.modalError}>{deleteError}</div>
            )}
            <div className={styles.modalActions}>
              <button
                className={styles.modalSecondary}
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteError("");
                }}
                disabled={deleteBusy}
              >
                Cancel
              </button>
              <button
                className={styles.modalDanger}
                onClick={handleDeleteAccount}
                disabled={deleteBusy}
              >
                {deleteBusy ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
