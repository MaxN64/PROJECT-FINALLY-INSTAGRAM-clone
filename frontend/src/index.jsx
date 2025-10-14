import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";
import "./index.css";

if (typeof window !== "undefined") {
  window.addEventListener("error", (e) => {
    console.error("window.error", e.message, e.error);
  });
  window.addEventListener("unhandledrejection", (e) => {
    console.error("unhandledrejection", e.reason);
  });
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </BrowserRouter>
  </React.StrictMode>
);
