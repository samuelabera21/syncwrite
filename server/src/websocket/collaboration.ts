import { WebSocketServer, WebSocket } from "ws";
import * as Y from "yjs";
import { prisma } from "../config/db";
const { setupWSConnection, setPersistence } = require("y-websocket/bin/utils");

// Configure y-websocket persistence to PostgreSQL via Prisma
setPersistence({
    bindState: async (docName: string, ydoc: Y.Doc) => {
        try {
            const dbDoc = await prisma.document.findUnique({
                where: { id: docName },
            });
            if (dbDoc && dbDoc.content) {
                Y.applyUpdate(ydoc, new Uint8Array(dbDoc.content));
            }
        } catch (err) {
            console.error(`Failed to load document ${docName} content from DB:`, err);
        }
    },
    writeState: async (docName: string, ydoc: Y.Doc) => {
        try {
            await prisma.document.update({
                where: { id: docName },
                data: {
                    content: Buffer.from(Y.encodeStateAsUpdate(ydoc)),
                    lastModified: new Date(),
                },
            });
        } catch (dbErr) {
            console.error(`Auto-save error for document ${docName}:`, dbErr);
        }
    },
});

export const setupWebSocketServer = (wss: WebSocketServer) => {
    wss.on("connection", (ws: WebSocket, req) => {
        const url = req.url || "";
        const parts = url.split("/");
        const documentId = parts[parts.length - 1];

        if (!documentId) {
            ws.close(4000, "Document ID required");
            return;
        }

        // Use standard y-websocket protocol which handles Sync (0) and Awareness (1) automatically
        setupWSConnection(ws, req, { docName: documentId });
    });
};