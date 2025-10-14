import "dotenv/config";
import http from "http";

import connectDB from "./src/config/db.js";
import { createApp } from "./src/app.js";
import { initSocket } from "./src/socket.js";

const app = createApp();

connectDB();

const PORT = process.env.PORT || 4000;
const server = http.createServer(app);

initSocket(server, app);

server.listen(PORT, () => console.log(`HTTP + WS on http://localhost:${PORT}`));
