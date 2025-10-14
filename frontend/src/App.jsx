import React, { useEffect } from "react";
import AppRoutes from "./routes";
import { connectSocket } from "./services/socket";

export default function App() {
  useEffect(() => {
    connectSocket();
  }, []);

  return (
    <div className="app-container">
      <AppRoutes />
    </div>
  );
}
