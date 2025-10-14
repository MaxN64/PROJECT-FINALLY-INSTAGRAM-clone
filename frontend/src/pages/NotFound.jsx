import React from "react";
import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";
import styles from "./NotFound.module.css";

export default function NotFound() {
  return (
    <div className={styles.page}>
      <Sidebar />

      <main className={styles.main}>
        <section className={styles.hero}>
          <div className={styles.phones}>
            <img
              className={styles.phoneBack}
              src="/images/Background.png"
              alt="phone mock"
            />
          </div>

          <div className={styles.textBlock}>
            <h1 className={styles.title}>Oops! Page Not Found (404 Error)</h1>
            <p className={styles.lead}>
              We&apos;re sorry, but the page you&apos;re looking for
              doesn&apos;t seem to exist.
            </p>
            <p className={styles.sub}>
              If you typed the URL manually, please double-check the spelling.
              If you clicked on a link, it may be outdated or broken.
            </p>
          </div>
        </section>

        <Footer />
      </main>
    </div>
  );
}
