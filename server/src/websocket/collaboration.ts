import { WebSocketServer, WebSocket } from "ws";
import * as http from "http";
import * as Y from "yjs";
import { prisma } from "../config/db";
import { auth } from "../config/auth";
import { fromNodeHeaders } from "better-auth/node";
import { getDocumentAndRole, hasMinimumRole, EffectiveRole } from "../middleware/permission.middleware";

// Protocols & encoding
const syncProtocol = require("y-protocols/sync");
const awarenessProtocol = require("y-protocols/awareness");
const encoding = require("lib0/encoding");
const decoding = require("lib0/decoding");

const messageSync = 0;
const messageAwareness = 1;

const wsReadyStateConnecting = 0;
const wsReadyStateOpen = 1;

// Active shared documents in memory
export class WSSharedDoc extends Y.Doc {
    name: string;
    conns: Map<WebSocket, Set<number>>;
    awareness: any;
    saveTimeout: NodeJS.Timeout | null = null;
    isSaving: boolean = false;

    constructor(name: string) {
        super({ gc: true });
        this.name = name;
        this.conns = new Map();
        this.awareness = new awarenessProtocol.Awareness(this);
        this.awareness.setLocalState(null);

        // Awareness change handler
        const awarenessChangeHandler = (
            { added, updated, removed }: { added: number[]; updated: number[]; removed: number[] },
            conn: WebSocket | null
        ) => {
            const changedClients = added.concat(updated, removed);
            if (conn !== null) {
                const connControlledIDs = this.conns.get(conn);
                if (connControlledIDs !== undefined) {
                    added.forEach((clientID) => connControlledIDs.add(clientID));
                    removed.forEach((clientID) => connControlledIDs.delete(clientID));
                }
            }
            const encoder = encoding.createEncoder();
            encoding.writeVarUint(encoder, messageAwareness);
            encoding.writeVarUint8Array(
                encoder,
                awarenessProtocol.encodeAwarenessUpdate(this.awareness, changedClients)
            );
            const buff = encoding.toUint8Array(encoder);
            this.conns.forEach((_, c) => {
                send(this, c, buff);
            });
        };
        this.awareness.on("update", awarenessChangeHandler);

        // Broadcast document updates to all connected clients
        this.on("update", (update: Uint8Array, origin: any) => {
            const encoder = encoding.createEncoder();
            encoding.writeVarUint(encoder, messageSync);
            syncProtocol.writeUpdate(encoder, update);
            const message = encoding.toUint8Array(encoder);
            this.conns.forEach((_, conn) => {
                if (conn !== origin) {
                    send(this, conn, message);
                }
            });

            // Debounced auto-save to PostgreSQL (1 second debounce)
            this.scheduleSave();
        });
    }

    scheduleSave() {
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
        }
        this.saveTimeout = setTimeout(() => {
            this.saveToDatabase();
        }, 1000);
    }

    async saveToDatabase(): Promise<void> {
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
            this.saveTimeout = null;
        }
        try {
            const state = Y.encodeStateAsUpdate(this);
            await prisma.document.update({
                where: { id: this.name },
                data: {
                    content: Buffer.from(state),
                    lastModified: new Date(),
                },
            });
            console.log(`[Diagnostic-Persistence] Document saved to DB. DocID: ${this.name}, DB content byte length after save: ${state.byteLength}`);
        } catch (error) {
            console.error(`Failed to persist document ${this.name} to database:`, error);
        }
    }
}

const docs: Map<string, WSSharedDoc> = new Map();
const docLoadingPromises: Map<string, Promise<WSSharedDoc>> = new Map();

/**
 * Get or load a WSSharedDoc with guaranteed PostgreSQL state synchronization
 */
export const getOrLoadDoc = async (documentId: string): Promise<WSSharedDoc> => {
    const existing = docs.get(documentId);
    if (existing) {
        return existing;
    }

    const pending = docLoadingPromises.get(documentId);
    if (pending) {
        return pending;
    }

    const loadPromise = (async () => {
        const doc = new WSSharedDoc(documentId);
        try {
            const dbDoc = await prisma.document.findUnique({
                where: { id: documentId },
            });
            const dbBytes = dbDoc?.content ? dbDoc.content.length : 0;
            console.log(`[Diagnostic-Persistence] Loading doc from DB. DocID: ${documentId}, DB content byte length: ${dbBytes}`);
            if (dbDoc && dbDoc.content && dbDoc.content.length > 0) {
                Y.applyUpdate(doc, new Uint8Array(dbDoc.content));
                const stateBytes = Y.encodeStateAsUpdate(doc).byteLength;
                console.log(`[Diagnostic-Persistence] Decoded Y.Doc state for DocID: ${documentId}, Y.Doc state byte length: ${stateBytes}`);
            }
        } catch (err) {
            console.error(`Error loading initial content for document ${documentId}:`, err);
        }
        docs.set(documentId, doc);
        docLoadingPromises.delete(documentId);
        return doc;
    })();

    docLoadingPromises.set(documentId, loadPromise);
    return loadPromise;
};

/**
 * Immediately flush an in-memory document to PostgreSQL
 */
export const flushDoc = async (documentId: string): Promise<void> => {
    const doc = docs.get(documentId);
    if (doc) {
        await doc.saveToDatabase();
    }
};

/**
 * Restore document state from a revision snapshot using CRDT transactions.
 * This guarantees that all connected clients will accept the restored state,
 * as it generates new deletion and insertion operations rather than rewinding time.
 */
export const restoreDocState = async (documentId: string, revisionContent: Buffer): Promise<Buffer> => {
    let doc = docs.get(documentId);
    let isDocActive = true;
    
    if (!doc) {
        doc = await getOrLoadDoc(documentId);
        isDocActive = false;
    }

    try {
        const tempDoc = new Y.Doc();
        Y.applyUpdate(tempDoc, new Uint8Array(revisionContent));

        const currentFragment = doc.getXmlFragment("default");
        const snapshotFragment = tempDoc.getXmlFragment("default");

        doc.transact(() => {
            if (currentFragment.length > 0) {
                currentFragment.delete(0, currentFragment.length);
            }
            
            const elementsToInsert = snapshotFragment.toArray().map(el => {
                if (el && typeof (el as any).clone === 'function') {
                    return (el as any).clone();
                }
                return el;
            });
            
            if (elementsToInsert.length > 0) {
                currentFragment.insert(0, elementsToInsert);
            }
        }, "restore");

        const newState = Buffer.from(Y.encodeStateAsUpdate(doc));

        if (!isDocActive) {
            docs.delete(documentId);
        }

        return newState;
    } catch (err) {
        console.error(`Failed to restore document ${documentId} state:`, err);
        throw err;
    }
};

/**
 * Send raw binary message to a WebSocket client
 */
const send = (doc: WSSharedDoc, conn: WebSocket, m: Uint8Array) => {
    if (conn.readyState !== wsReadyStateConnecting && conn.readyState !== wsReadyStateOpen) {
        closeConn(doc, conn);
        return;
    }
    try {
        conn.send(m, {}, (err) => {
            if (err != null) closeConn(doc, conn);
        });
    } catch (e) {
        closeConn(doc, conn);
    }
};

/**
 * Close and cleanup connection
 */
const closeConn = (doc: WSSharedDoc, conn: WebSocket) => {
    if (doc.conns.has(conn)) {
        const controlledIds = doc.conns.get(conn);
        doc.conns.delete(conn);
        if (controlledIds) {
            awarenessProtocol.removeAwarenessStates(doc.awareness, Array.from(controlledIds), null);
        }
        if (doc.conns.size === 0) {
            // Flush immediately to DB when the last client disconnects
            doc.saveToDatabase().catch((err) => {
                console.error(`Error saving on last disconnect for ${doc.name}:`, err);
            });
        }
    }
    try {
        conn.close();
    } catch (e) {}
};

/**
 * Handle incoming sync messages with RBAC enforcement
 */
const messageListener = (
    conn: WebSocket,
    doc: WSSharedDoc,
    message: Uint8Array,
    role: EffectiveRole
) => {
    try {
        const encoder = encoding.createEncoder();
        const decoder = decoding.createDecoder(message);
        const messageType = decoding.readVarUint(decoder);

        switch (messageType) {
            case messageSync: {
                encoding.writeVarUint(encoder, messageSync);
                const syncMessageType = decoding.readVarUint(decoder);

                if (syncMessageType === syncProtocol.messageYjsSyncStep1) {
                    // SyncStep1: client is requesting server state. Allowed for all roles (Owner, Editor, Commenter, Viewer)
                    syncProtocol.readSyncStep1(decoder, encoder, doc);
                    if (encoding.length(encoder) > 1) {
                        send(doc, conn, encoding.toUint8Array(encoder));
                    }
                } else if (syncMessageType === syncProtocol.messageYjsSyncStep2) {
                    // SyncStep2: Handshake response from client
                    if (hasMinimumRole(role, "EDITOR")) {
                        // Authorized: Apply client updates to the shared document
                        const updateBytes = decoding.readVarUint8Array(decoder);
                        if (updateBytes.byteLength > 0) {
                            console.log(`[Diagnostic-Persistence] Received syncStep2 update for DocID: ${doc.name}, update byte length: ${updateBytes.byteLength}`);
                            Y.applyUpdate(doc, updateBytes, conn);
                        }
                    } else {
                        // Read-only (Viewer or Commenter):
                        // Safely consume the syncStep2 payload without applying to the authoritative doc.
                        // Do NOT send syncStep1 back to prevent infinite protocol feedback loops.
                        decoding.readVarUint8Array(decoder);
                    }
                } else if (syncMessageType === syncProtocol.messageYjsUpdate) {
                    // Live incremental update message
                    if (hasMinimumRole(role, "EDITOR")) {
                        // Authorized: Apply update to the shared document
                        const updateBytes = decoding.readVarUint8Array(decoder);
                        if (updateBytes.byteLength > 0) {
                            console.log(`[Diagnostic-Persistence] Received live Yjs update for DocID: ${doc.name}, update byte length: ${updateBytes.byteLength}`);
                            Y.applyUpdate(doc, updateBytes, conn);
                        }
                    } else {
                        // Read-only (Viewer or Commenter):
                        // Safely consume the update without modifying the authoritative doc.
                        // Do NOT send syncStep1 to avoid feedback loops.
                        decoding.readVarUint8Array(decoder);
                    }
                }
                break;
            }
            case messageAwareness: {
                // Awareness (cursor/presence) is allowed for all connected users
                awarenessProtocol.applyAwarenessUpdate(
                    doc.awareness,
                    decoding.readVarUint8Array(decoder),
                    conn
                );
                break;
            }
        }
    } catch (err) {
        console.error(`Error processing message for document ${doc.name}:`, err);
        (doc as any).emit("error", [err]);
    }
};

/**
 * Configure and attach the WebSocket server
 */
export const setupWebSocketServer = (wss: WebSocketServer) => {
    wss.on("connection", async (ws: WebSocket, req: http.IncomingMessage) => {
        try {
            ws.binaryType = "arraybuffer";

            // Extract documentId from URL
            const pathname = (req.url || "").split("?")[0];
            const parts = pathname.split("/").filter(Boolean);
            const documentId = parts[parts.length - 1];

            if (!documentId) {
                ws.close(4000, "Document ID required");
                return;
            }

            // Authenticate session via Better Auth
            let user = null;
            try {
                const sessionData = await auth.api.getSession({
                    headers: fromNodeHeaders(req.headers),
                });
                if (sessionData && sessionData.user) {
                    user = sessionData.user;
                }
            } catch (err) {
                console.error("Error validating session on WS connection:", err);
            }

            if (!user) {
                ws.close(4001, "Unauthorized: Authentication required");
                return;
            }

            // Verify document authorization
            const { document, role } = await getDocumentAndRole(documentId, user.id);

            if (!document) {
                ws.close(4004, "Document not found");
                return;
            }

            if (role === "NONE" || !hasMinimumRole(role, "VIEWER")) {
                ws.close(4003, "Forbidden: No access to document");
                return;
            }

            // Ensure document is loaded from PostgreSQL BEFORE sending any sync messages
            const doc = await getOrLoadDoc(documentId);

            // Register connection
            doc.conns.set(ws, new Set());

            // Message handler with role enforcement
            ws.on("message", (message: ArrayBuffer) => {
                messageListener(ws, doc, new Uint8Array(message), role);
            });

            // Ping/pong heartbeat
            let pongReceived = true;
            const pingInterval = setInterval(() => {
                if (!pongReceived) {
                    if (doc.conns.has(ws)) {
                        closeConn(doc, ws);
                    }
                    clearInterval(pingInterval);
                } else if (doc.conns.has(ws)) {
                    pongReceived = false;
                    try {
                        ws.ping();
                    } catch (e) {
                        closeConn(doc, ws);
                        clearInterval(pingInterval);
                    }
                }
            }, 30000);

            ws.on("close", () => {
                closeConn(doc, ws);
                clearInterval(pingInterval);
            });

            ws.on("pong", () => {
                pongReceived = true;
            });

            // Send initial SyncStep1 to client
            const encoder = encoding.createEncoder();
            encoding.writeVarUint(encoder, messageSync);
            syncProtocol.writeSyncStep1(encoder, doc);
            send(doc, ws, encoding.toUint8Array(encoder));

            // Send current awareness states
            const awarenessStates = doc.awareness.getStates();
            if (awarenessStates.size > 0) {
                const awarenessEncoder = encoding.createEncoder();
                encoding.writeVarUint(awarenessEncoder, messageAwareness);
                encoding.writeVarUint8Array(
                    awarenessEncoder,
                    awarenessProtocol.encodeAwarenessUpdate(
                        doc.awareness,
                        Array.from(awarenessStates.keys())
                    )
                );
                send(doc, ws, encoding.toUint8Array(awarenessEncoder));
            }
        } catch (error) {
            console.error("WebSocket connection error:", error);
            ws.close(1011, "Internal server error during connection setup");
        }
    });
};