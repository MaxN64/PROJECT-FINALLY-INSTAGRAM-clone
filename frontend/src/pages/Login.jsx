import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import styles from "./Login.module.css";
import { authService } from "../services/authService";
import { setAccessToken } from "../services/authToken";
import { reconnectWithFreshToken } from "../services/socket";
import { api } from "../services/api";

export default function Login() {
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.identifier || !form.password) {
      setError("Enter username/email and password");
      return;
    }

    try {
      setLoading(true);

      const { data } = await authService.login({
        identifier: form.identifier.trim(),
        password: form.password,
      });

      if (data?.accessToken) {
        setAccessToken(data.accessToken);
      }

      reconnectWithFreshToken();

      let user = data?.user;
      if (!user) {
        const meRes = await api.get("/auth/me");
        user = meRes.data.user;
      }

      try {
        localStorage.setItem("me", JSON.stringify({ user }));
      } catch {}

      navigate(`/profile/${user.username}`, { replace: true });
    } catch (err) {
      const msg = err?.response?.data?.message || "Invalid credentials";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.imageSection}>
        <img
          src="/images/Background.png"
          alt="App preview"
          className={styles.image}
        />
      </div>

      <div className={styles.formWrapper}>
        <div className={styles.card}>
          <div className={styles.logo}>
            <img
              src="/images/ICHGRA.png"
              alt="ICHGRAM"
              className={styles.imageICH}
            />
          </div>

          {error && <p className={styles.errorText}>{error}</p>}

          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <input
              type="text"
              name="identifier"
              placeholder="Username, or email"
              autoComplete="username"
              className={styles.input}
              value={form.identifier}
              onChange={handleChange}
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              autoComplete="current-password"
              className={styles.input}
              value={form.password}
              onChange={handleChange}
            />

            <button type="submit" className={styles.button} disabled={loading}>
              {loading ? "Logging in…" : "Log in"}
            </button>

            <div className={styles.divider}>
              <span>OR</span>
            </div>

            <Link to="/reset" className={styles.forgot}>
              Forgot password?
            </Link>
          </form>
        </div>

        <div className={styles.signup}>
          <span>Don't have an account?</span>{" "}
          <Link to="/register" className={styles.signupLink}>
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
