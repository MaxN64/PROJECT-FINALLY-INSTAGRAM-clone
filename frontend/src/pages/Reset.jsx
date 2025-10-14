import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./Reset.module.css";
import { api } from "../services/api";

export default function Reset() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [devLink, setDevLink] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError("Please enter email to continue");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setDevLink("");
      const { data } = await api.post("/auth/password/forgot", {
        email: identifier.trim(),
      });
      setMessage(
        data?.message || "If such an account exists, a link has been sent."
      );
      if (data?.resetUrl) {
        setDevLink(data.resetUrl);
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to send link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.logo}>
        <img
          src="/images/ICHGRA.png"
          alt="Mockup phones"
          className={styles.imageICH}
        />
      </div>
      <header className={styles.header}></header>

      <div className={styles.innerCard}>
        <div className={styles.iconWrapper}>
          <img
            src="/images/imgtrouble.png"
            alt="Lock icon"
            className={styles.icon}
          />
        </div>
        <h2 className={styles.title}>Trouble logging in?</h2>
        <p className={styles.subtitle}>
          Enter your email, phone, or username and we&apos;ll send you a link to
          get back into your account.
        </p>
        <form className={styles.form} onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Email or Username"
            className={styles.input}
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            disabled={loading}
          />
          {error && <p className={styles.error}>{error}</p>}
          {message && <p className={styles.success}>{message}</p>}
          {devLink && <p className={styles.devHelper}></p>}
          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? "Sending…" : "Reset your password"}
          </button>
        </form>

        <div className={styles.orDivider}>
          <span>OR</span>
        </div>

        <Link className={styles.linkButton} to="/register">
          Create new account
        </Link>
      </div>

      <footer className={styles.footer}>
        <button
          className={styles.backButton}
          type="button"
          onClick={() => navigate("/login")}
        >
          Back to login
        </button>
      </footer>
    </div>
  );
}
