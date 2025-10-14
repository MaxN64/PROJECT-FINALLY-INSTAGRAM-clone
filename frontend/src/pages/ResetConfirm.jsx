import React, { useEffect, useMemo, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import styles from "./Reset.module.css";
import { api } from "../services/api";

export default function ResetConfirm() {
  const [params] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const tokenFromState = useMemo(() => {
    const maybe = location.state && location.state.tokenRedirect;
    if (!maybe) return "";
    const match = /token=([^&]+)/i.exec(String(maybe));
    return match ? match[1] : "";
  }, [location.state]);
  const token = params.get("token") || tokenFromState || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(
    token ? "" : "Invalid or missing reset link"
  );
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) setError("Invalid or expired reset link");
  }, [token]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!token) return;
    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await api.post("/auth/password/reset", { token, password });
      setSuccess(true);
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.innerCard}>
        <h2 className={styles.title}>Set a new password</h2>
        <p className={styles.subtitle}>
          Enter and confirm your new password to finish the reset.
        </p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="New password"
            className={styles.input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading || success}
          />
          <input
            type="password"
            placeholder="Confirm password"
            className={styles.input}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            disabled={loading || success}
          />
          {error && <p className={styles.error}>{error}</p>}
          {success && (
            <p className={styles.success}>
              Password updated. You can <Link to="/login">log in</Link> with
              your new credentials.
            </p>
          )}
          <button
            type="submit"
            className={styles.button}
            disabled={loading || success || !token}
          >
            {loading ? "Saving" : "Save new password"}
          </button>
        </form>

        <div className={styles.orDivider}>
          <span>OR</span>
        </div>

        <button
          type="button"
          className={styles.linkButton}
          onClick={() => navigate("/login")}
        >
          Back to login
        </button>
      </div>
    </div>
  );
}
