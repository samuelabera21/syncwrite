"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const ws_1 = require("ws");
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const document_routes_1 = __importDefault(require("./routes/document.routes"));
const collaboration_1 = require("./websocket/collaboration");
const auth_1 = require("./config/auth");
const node_1 = require("better-auth/node");
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
// Setup WebSocket Server attached to HTTP server
const wss = new ws_1.WebSocketServer({ noServer: true });
(0, collaboration_1.setupWebSocketServer)(wss);
server.on("upgrade", (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
    });
});
app.use((0, cors_1.default)({ origin: "http://localhost:5173", credentials: true }));
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json());
// Routes
app.use("/api/auth", (0, node_1.toNodeHandler)(auth_1.auth));
app.use("/api/documents", document_routes_1.default);
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
