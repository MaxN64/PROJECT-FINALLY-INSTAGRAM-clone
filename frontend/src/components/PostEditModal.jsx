import React, { useEffect, useRef, useState } from "react";
import { api } from "../services/api";
import EMOJI_PRESETS from "../utils/emojiPresets";
import styles from "./PostEditModal.module.css";
import useModalPlacement from "../utils/useModalPlacement";

export default function PostEditModal({ open, post, onClose, onUpdated }) {
  const [caption, setCaption] = useState(post?.caption || "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const { backdrop: backdropStyle, window: windowStyle } = useModalPlacement();

  const formRef = useRef(null);
  const emojiTriggerRef = useRef(null);
  const emojiPickerRef = useRef(null);

  useEffect(() => {
    if (open) {
      setCaption(post?.caption || "");
      setErr("");
      setShowEmoji(false);
    }
  }, [open, post?._id]);

  useEffect(() => {
    if (!showEmoji) return undefined;
    const handleClick = (event) => {
      if (
        emojiPickerRef.current &&
        emojiTriggerRef.current &&
        !emojiPickerRef.current.contains(event.target) &&
        !emojiTriggerRef.current.contains(event.target)
      ) {
        setShowEmoji(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showEmoji]);

  if (!open) return null;

  const submit = async (event) => {
    event.preventDefault();
    if (!post?._id) return;
    try {
      setSaving(true);
      setErr("");
      const { data } = await api.patch(`/posts/${post._id}`, { caption });
      onUpdated?.(data);
      onClose?.();
    } catch (error) {
      setErr(error?.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleEmojiInsert = (emoji) => {
    setCaption((prev) => (prev + emoji).slice(0, 2200));
    setShowEmoji(false);
  };

  const handleSaveClick = () => {
    formRef.current?.requestSubmit();
  };

  const handleBackdropClick = () => {
    if (saving) return;
    onClose?.();
  };

  return (
    <div
      className={styles.backdrop}
      style={backdropStyle}
      onClick={handleBackdropClick}
    >
      <div
        className={styles.window}
        style={windowStyle}
        onClick={(event) => event.stopPropagation()}
      >
        <header className={styles.header}>
          <button
            type="button"
            className={styles.close}
            onClick={handleBackdropClick}
            aria-label="Close edit post dialog"
          ></button>
          <h3>Edit Post</h3>
          <button
            type="button"
            className={styles.save}
            onClick={handleSaveClick}
            disabled={saving}
          >
            {saving ? "Saving" : "Save"}
          </button>
        </header>

        <form ref={formRef} className={styles.body} onSubmit={submit}>
          <section className={styles.left}>
            <img src={post?.imageUrl} alt={post?.caption || "Post"} />
          </section>

          <section className={styles.right}>
            <div className={styles.captionSection}>
              <label className={styles.captionLabel} htmlFor="edit-caption">
                Caption
              </label>
              <div className={styles.captionEditor}>
                <textarea
                  id="edit-caption"
                  value={caption}
                  onChange={(event) =>
                    setCaption(event.target.value.slice(0, 2200))
                  }
                  placeholder="Write a caption..."
                  maxLength={2200}
                  disabled={saving}
                />
                <div className={styles.captionFooter}>
                  <div className={styles.emojiArea}>
                    <button
                      type="button"
                      className={styles.emojiBtn}
                      onClick={() => setShowEmoji((prev) => !prev)}
                      disabled={saving}
                      ref={emojiTriggerRef}
                      aria-label="Add emoji"
                    >
                      <i className="ri-emotion-line" />
                    </button>
                    {showEmoji && (
                      <div className={styles.emojiPicker} ref={emojiPickerRef}>
                        {EMOJI_PRESETS.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => handleEmojiInsert(emoji)}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className={styles.counter}>{caption.length}/2200</span>
                </div>
              </div>
            </div>

            {err && <div className={styles.error}>{err}</div>}

            <div className={styles.footer}>
              <button
                type="button"
                className={styles.cancel}
                onClick={handleBackdropClick}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </section>
        </form>
      </div>
    </div>
  );
}
