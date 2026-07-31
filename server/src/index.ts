import "dotenv/config";
import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import cors from "cors";
import cookieParser from "cookie-parser";
import documentRoutes from "./routes/document.routes";
import { setupWebSocketServer } from "./websocket/collaboration";
import { auth } from "./config/auth";
import { toNodeHandler } from "better-auth/node";

const app = express();
const server = http.createServer(app);

// Setup WebSocket Server attached to HTTP server
const wss = new WebSocketServer({ noServer: true });
setupWebSocketServer(wss);

server.on("upgrade", (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
    });
});

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(cookieParser());
app.use(express.json());

// Routes
app.use("/api/auth", toNodeHandler(auth));
app.use("/api/documents", documentRoutes);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});