"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupWebSocketServer = void 0;
const Y = __importStar(require("yjs"));
const db_1 = require("../config/db");
const { setupWSConnection, setPersistence } = require("y-websocket/bin/utils");
// Configure y-websocket persistence to PostgreSQL via Prisma
setPersistence({
    bindState: async (docName, ydoc) => {
        try {
            const dbDoc = await db_1.prisma.document.findUnique({
                where: { id: docName },
            });
            if (dbDoc && dbDoc.content) {
                Y.applyUpdate(ydoc, new Uint8Array(dbDoc.content));
            }
        }
        catch (err) {
            console.error(`Failed to load document ${docName} content from DB:`, err);
        }
    },
    writeState: async (docName, ydoc) => {
        try {
            await db_1.prisma.document.update({
                where: { id: docName },
                data: {
                    content: Buffer.from(Y.encodeStateAsUpdate(ydoc)),
                    lastModified: new Date(),
                },
            });
        }
        catch (dbErr) {
            console.error(`Auto-save error for document ${docName}:`, dbErr);
        }
    },
});
const auth_1 = require("../config/auth");
const node_1 = require("better-auth/node");
const setupWebSocketServer = (wss) => {
    wss.on("connection", async (ws, req) => {
        const url = req.url || "";
        const parts = url.split("/");
        const documentId = parts[parts.length - 1];
        if (!documentId) {
            ws.close(4000, "Document ID required");
            return;
        }
        // 1. Authenticate user via Better Auth using WS request headers
        let isViewer = true; // Default to safest permission
        try {
            const sessionData = await auth_1.auth.api.getSession({
                headers: (0, node_1.fromNodeHeaders)(req.headers),
            });
            if (sessionData && sessionData.user) {
                const userId = sessionData.user.id;
                const document = await db_1.prisma.document.findUnique({
                    where: { id: documentId },
                    include: { shares: true },
                });
                if (document) {
                    const isOwner = document.ownerId === userId;
                    const share = document.shares.find((s) => s.userId === userId);
                    // Only Owners and Editors can modify Yjs CRDT state
                    // Commenters are restricted here because they only modify REST Comments, not document text.
                    if (isOwner || share?.role === "EDITOR") {
                        isViewer = false;
                    }
                }
            }
        }
        catch (err) {
            console.error("WS Auth error:", err);
        }
        // 2. Intercept WebSocket messages for Viewers to drop Yjs Document Updates
        if (isViewer) {
            const originalOn = ws.on.bind(ws);
            ws.on = function (event, listener) {
                if (event === "message") {
                    const wrappedListener = (message, ...args) => {
                        try {
                            const arr = new Uint8Array(message);
                            // Yjs protocol message type 0 is 'Sync'
                            if (arr.length > 0 && arr[0] === 0) {
                                // Sync Step 2 (Update) is message type 2
                                if (arr.length > 1 && arr[1] === 2) {
                                    // Block malicious or accidental document updates from viewers!
                                    return;
                                }
                            }
                        }
                        catch (e) {
                            console.error("Error parsing Yjs message", e);
                        }
                        listener(message, ...args);
                    };
                    return originalOn(event, wrappedListener);
                }
                return originalOn(event, listener);
            };
        }
        // 3. Connect to y-websocket engine
        setupWSConnection(ws, req, { docName: documentId });
    });
};
exports.setupWebSocketServer = setupWebSocketServer;
