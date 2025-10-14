import React from "react";
import styles from "./PostActionsSheet.module.css";

export default function PostActionsSheet({
  open,
  onClose,
  post,
  canEdit = false,
  onDelete,
  onEdit,
}) {
  if (!open) return null;

  const copyLink = async () => {
    const url = `${window.location.origin}/posts/${post._id}`;
    try {
      await navigator.clipboard.writeText(url);
      onClose?.();
    } catch {
      const ta = document.createElement("textarea");
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      onClose?.();
    }
  };

  const goToPost = () => {
    window.location.href = `/posts/${post._id}`;
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
        {canEdit && (
          <button
            className={`${styles.item} ${styles.danger}`}
            onClick={() => onDelete?.(post)}
          >
            Delete
          </button>
        )}
        {canEdit && (
          <button className={styles.item} onClick={() => onEdit?.(post)}>
            Edit
          </button>
        )}
        <button className={styles.item} onClick={goToPost}>
          Go to post
        </button>
        <button className={styles.item} onClick={copyLink}>
          Copy link
        </button>

        <div className={styles.sep} />
        <button className={styles.item} onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}
