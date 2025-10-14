import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import styles from "./Register.module.css";
import { authService } from "../services/authService";

export default function Register() {
  const [form, setForm] = useState({
    email: "",
    fullName: "",
    username: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
    setGeneralError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!form.email) newErrors.email = "Email is required.";
    if (!form.fullName) newErrors.fullName = "Full name is required.";
    if (form.username.length < 3)
      newErrors.username = "Username must be at least 3 characters.";
    if (form.password.length < 6)
      newErrors.password = "Password must be at least 6 characters.";

    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }

    try {
      setSubmitting(true);
      setGeneralError("");

      await authService.register({
        email: form.email,
        username: form.username,
        name: form.fullName,
        password: form.password,
      });

      navigate("/login", { replace: true });
    } catch (err) {
      const status = err?.response?.status;
      const message =
        err?.response?.data?.message || "Something went wrong. Try again.";

      if (status === 409) {
        if (message.toLowerCase().includes("username")) {
          setErrors((prev) => ({
            ...prev,
            username: "This username is already taken.",
          }));
        } else if (message.toLowerCase().includes("email")) {
          setErrors((prev) => ({
            ...prev,
            email: "This email is already registered.",
          }));
        } else {
          setGeneralError(message);
        }
      } else if (status === 400) {
        setGeneralError(message);
      } else {
        setGeneralError("Server error. Please try again later.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.formWrapper}>
        <div className={styles.card}>
          <div className={styles.logo}>
            <img
              src="/images/ICHGRA.png"
              alt="ICHGRAM"
              className={styles.imageICH}
            />
          </div>

          <p className={styles.subtitle}>
            Sign up to see photos and videos from your friends.
          </p>

          {generalError && <p className={styles.errorText}>{generalError}</p>}

          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <input
              type="email"
              name="email"
              placeholder="Email"
              className={styles.input}
              value={form.email}
              onChange={handleChange}
              aria-invalid={!!errors.email}
            />
            {errors.email && <p className={styles.errorText}>{errors.email}</p>}

            <input
              type="text"
              name="fullName"
              placeholder="Full Name"
              className={styles.input}
              value={form.fullName}
              onChange={handleChange}
              aria-invalid={!!errors.fullName}
            />
            {errors.fullName && (
              <p className={styles.errorText}>{errors.fullName}</p>
            )}

            <input
              type="text"
              name="username"
              placeholder="Username"
              className={styles.input}
              value={form.username}
              onChange={handleChange}
              aria-invalid={!!errors.username}
            />
            {errors.username && (
              <p className={styles.errorText}>{errors.username}</p>
            )}

            <input
              type="password"
              name="password"
              placeholder="Password"
              className={styles.input}
              value={form.password}
              onChange={handleChange}
              aria-invalid={!!errors.password}
            />
            {errors.password && (
              <p className={styles.errorText}>{errors.password}</p>
            )}

            <button
              type="submit"
              className={styles.button}
              disabled={submitting}
            >
              {submitting ? "Signing up…" : "Sign up"}
            </button>
          </form>

          <p className={styles.legal}>
            People who use our service may have uploaded your contact
            information to Instagram.{" "}
            <a href="#" className={styles.link}>
              Learn More
            </a>
          </p>
          <p className={styles.legal}>
            By signing up, you agree to our{" "}
            <a href="#" className={styles.link}>
              Terms
            </a>
            ,{" "}
            <a href="#" className={styles.link}>
              Privacy Policy
            </a>{" "}
            and{" "}
            <a href="#" className={styles.link}>
              Cookies Policy
            </a>
            .
          </p>
        </div>

        <div className={styles.signin}>
          Have an account?{" "}
          <Link to="/login" className={styles.signinLink}>
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
