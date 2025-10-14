import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { api } from "../services/api";
import EMOJI_PRESETS from "../utils/emojiPresets";
import styles from "./CreatePostOverlay.module.css";
import useModalPlacement from "../utils/useModalPlacement";

export default function CreatePostOverlay({ onClose, onCreated }) {
  const me = useMemo(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("me") || "{}")?.user;
      const legacy = JSON.parse(localStorage.getItem("user") || "{}");
      return stored || legacy || {};
    } catch {
      return {};
    }
  }, []);

  const fileInputRef = useRef(null);
  const emojiTriggerRef = useRef(null);
  const emojiPickerRef = useRef(null);

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [caption, setCaption] = useState("");
  const [posting, setPosting] = useState(false);
  const [err, setErr] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const { backdrop: backdropStyle, window: windowStyle } = useModalPlacement();

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

  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const openFileDialog = () => fileInputRef.current?.click();

  const pickFile = (f) => {
    if (!f) return;
    setFile(f);
    setPreview((prevUrl) => {
      if (prevUrl) URL.revokeObjectURL(prevUrl);
      return URL.createObjectURL(f);
    });
  };

  const onInput = (event) => pickFile(event.target.files?.[0]);

  const onDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    pickFile(event.dataTransfer.files?.[0]);
  };

  const onDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleEmojiInsert = (emoji) => {
    setCaption((prev) => (prev + emoji).slice(0, 2200));
    setShowEmoji(false);
  };

  const share = async () => {
    if (!file) {
      setErr("Please select an image to publish");
      return;
    }
    try {
      setPosting(true);
      setErr("");

      const form = new FormData();
      form.append("image", file);
      form.append("caption", caption);

      const { data } = await api.post("/posts", form, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      onCreated?.(data);
      onClose?.();
    } catch (error) {
      setErr(error?.response?.data?.message || "Failed to create post");
    } finally {
      setPosting(false);
    }
  };

  const handleBackdropClick = () => {
    if (posting) return;
    onClose?.();
  };

  return createPortal(
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
            aria-label="Close create post dialog"
          ></button>
          <h3 className={styles.title}>Create Post</h3>
          <button
            type="button"
            className={styles.share}
            onClick={share}
            disabled={posting || !file}
          >
            {posting ? "Publishing" : "Share"}
          </button>
        </header>

        <div className={styles.body}>
          <section className={styles.left}>
            {preview ? (
              <div className={styles.previewFrame}>
                <img src={preview} alt="Post preview" />
                <button
                  type="button"
                  className={styles.replaceBtn}
                  onClick={openFileDialog}
                >
                  Replace image
                </button>
              </div>
            ) : (
              <div
                className={styles.dropzone}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onClick={openFileDialog}
              >
                <img
                  src="/images/cloud.png"
                  alt="Upload media"
                  className={styles.cloudIcon}
                />
              </div>
            )}
            <input
              ref={fileInputRef}
              id="fileInput"
              type="file"
              accept="image/*"
              onChange={onInput}
              hidden
            />
          </section>

          <section className={styles.right}>
            <div className={styles.userRow}>
              <img
                src={me.avatarUrl || "/placeholder-avatar.png"}
                alt={me.username || "user"}
                className={styles.userAvatar}
              />
              <span className={styles.userName}>{me.username || "user"}</span>
            </div>

            <div className={styles.captionSection}>
              <label className={styles.captionLabel} htmlFor="create-caption">
                Caption
              </label>
              <div className={styles.captionEditor}>
                <textarea
                  id="create-caption"
                  value={caption}
                  onChange={(event) =>
                    setCaption(event.target.value.slice(0, 2200))
                  }
                  placeholder="Write a caption..."
                  maxLength={2200}
                />
                <div className={styles.captionFooter}>
                  <div className={styles.emojiArea}>
                    <button
                      type="button"
                      className={styles.emojiBtn}
                      onClick={() => setShowEmoji((prev) => !prev)}
                      ref={emojiTriggerRef}
                      disabled={posting}
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
          </section>
        </div>
      </div>
    </div>,
    document.body
  );
}

