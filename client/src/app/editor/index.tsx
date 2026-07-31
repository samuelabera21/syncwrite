import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { api } from "../../lib/api";
import { useSession } from "../../lib/auth-client";
import {
    ArrowLeft, Share2, MessageSquare, History, Cloud, CloudCheck, RotateCcw
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

import { EditorToolbar } from "../../components/editor/EditorToolbar";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

export default function Editor() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { data: session } = useSession();

    const [documentTitle, setDocumentTitle] = useState("Untitled Document");
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<"comments" | "history" | "share" | null>(null);

    // Comments state
    const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState("");

    // Revisions state
    const [revisions, setRevisions] = useState<any[]>([]);

    // Sharing state
    const [shares, setShares] = useState<any[]>([]);
    const [shareEmail, setShareEmail] = useState("");
    const [sharePermission, setSharePermission] = useState("Viewer");

    // Presence state
    const [onlineUsers, setOnlineUsers] = useState<any[]>([]);

    // Yjs doc and provider
    const ydoc = useRef(new Y.Doc()).current;
    const provider = useRef(
        new WebsocketProvider("ws://localhost:5000", id || "default", ydoc)
    ).current;

    const editor = useEditor({
        extensions: [
            StarterKit.configure({ history: false }), // Collaboration handles history
            Placeholder.configure({ placeholder: "Start typing your collaborative document..." }),
            Link.configure({ openOnClick: false }),
            TextAlign.configure({ types: ["heading", "paragraph"] }),
            Underline,
            Collaboration.configure({ document: ydoc }),
            CollaborationCursor.configure({
                provider,
                user: {
                    name: session?.user?.name || "Guest",
                    color: "#" + Math.floor(Math.random() * 16777215).toString(16),
                },
            }),
        ],
        editorProps: {
            attributes: {
                class: "prose prose-slate prose-lg max-w-none focus:outline-none min-h-[700px] px-10 py-12",
            },
        },
    });

    useEffect(() => {
        if (!id) return;

        api.get(`/documents/${id}`).then((res) => {
            setDocumentTitle(res.data.document.title);
        });

        // Setup awareness
        const updateAwareness = () => {
            const states = Array.from(provider.awareness.getStates().values());
            setOnlineUsers(states.filter((s: any) => s.user));
        };
        provider.awareness.on("change", updateAwareness);
        provider.awareness.setLocalStateField("user", {
            name: session?.user?.name || "Guest",
            color: "#6366f1"
        });

        provider.on("status", (event: { status: string }) => {
            setIsSaving(event.status !== "connected");
        });

        fetchComments();
        fetchRevisions();
        fetchShares();

        return () => {
            provider.destroy();
            ydoc.destroy();
        };
    }, [id, session?.user?.name, provider]);

    const handleTitleChange = async (newTitle: string) => {
        setDocumentTitle(newTitle);
        try {
            await api.patch(`/documents/${id}`, { title: newTitle });
        } catch (err) {
            toast.error("Failed to update title");
        }
    };

    const fetchComments = () => api.get(`/documents/${id}/comments`).then((res) => setComments(res.data.comments)).catch(console.error);
    const fetchRevisions = () => api.get(`/documents/${id}/revisions`).then((res) => setRevisions(res.data.revisions)).catch(console.error);
    const fetchShares = () => api.get(`/documents/${id}/share`).then((res) => setShares(res.data.shares || res.data || [])).catch(console.error);

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        try {
            await api.post(`/documents/${id}/comments`, { content: newComment });
            setNewComment("");
            fetchComments();
            toast.success("Comment posted");
        } catch (err) {
            toast.error("Failed to add comment");
        }
    };

    const handleCreateRevision = async () => {
        try {
            await api.post(`/documents/${id}/revisions`);
            toast.success("Snapshot created");
            fetchRevisions();
        } catch (err) {
            toast.error("Failed to create revision");
        }
    };

    const handleRestoreRevision = async (revisionId: string) => {
        if (!confirm("Restore this version? Current content will be overwritten.")) return;
        try {
            await api.post(`/documents/${id}/revisions/${revisionId}/restore`);
            toast.success("Revision restored!");
            setTimeout(() => window.location.reload(), 1000);
        } catch (err) {
            toast.error("Failed to restore revision");
        }
    };

    const handleAddShare = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post(`/documents/${id}/share`, { email: shareEmail, permission: sharePermission.toUpperCase() });
            setShareEmail("");
            fetchShares();
            toast.success("Shared successfully");
        } catch (err) {
            toast.error("Failed to share document");
        }
    };

    return (
        <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
            <Toaster position="bottom-right" />
            {/* Top Header */}
            <header className="flex items-center justify-between border-b border-slate-200/80 bg-white px-4 sm:px-6 py-2.5 z-20 shadow-sm relative">
                <div className="flex items-center space-x-2 sm:space-x-4">
                    <button
                        onClick={() => navigate("/")}
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div className="flex flex-col">
                        <input
                            type="text"
                            value={documentTitle}
                            onChange={(e) => handleTitleChange(e.target.value)}
                            className="font-semibold text-slate-900 bg-transparent hover:bg-slate-100 focus:bg-white px-2 py-1 rounded-md border border-transparent focus:border-indigo-500 focus:outline-none transition-colors sm:text-lg"
                        />
                    </div>
                    <div className="hidden sm:flex items-center space-x-1.5 text-xs text-slate-400 pl-4 border-l border-slate-200">
                        {isSaving ? (
                            <Cloud className="h-4 w-4 text-slate-400" />
                        ) : (
                            <CloudCheck className="h-4 w-4 text-emerald-500" />
                        )}
                        <span>{isSaving ? "Saving..." : "Saved to cloud"}</span>
                    </div>
                </div>

                <div className="flex items-center space-x-4">
                    {/* Online Users */}
                    <div className="hidden sm:flex items-center -space-x-2 mr-2">
                        {onlineUsers.map((client, idx) => (
                            <div
                                key={idx}
                                className="h-7 w-7 rounded-full flex items-center justify-center text-white text-xs font-bold ring-2 ring-white"
                                style={{ backgroundColor: client.user.color || "#6366f1" }}
                                title={client.user.name}
                            >
                                {client.user.name?.[0]?.toUpperCase()}
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center space-x-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setActiveTab(activeTab === "share" ? null : "share")}
                            className={activeTab === "share" ? "bg-slate-100" : ""}
                        >
                            <Share2 className="h-4 w-4 mr-1.5" />
                            <span className="hidden sm:inline">Share</span>
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setActiveTab(activeTab === "comments" ? null : "comments")}
                            className={activeTab === "comments" ? "bg-slate-100" : ""}
                        >
                            <MessageSquare className="h-4 w-4 mr-1.5" />
                            <span className="hidden sm:inline">Comments</span>
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setActiveTab(activeTab === "history" ? null : "history")}
                            className={activeTab === "history" ? "bg-slate-100" : ""}
                        >
                            <History className="h-4 w-4 mr-1.5" />
                            <span className="hidden sm:inline">History</span>
                        </Button>
                    </div>
                </div>
            </header>

            {/* Formatting Toolbar */}
            <EditorToolbar editor={editor} />

            {/* Main Workspace & Sidebar */}
            <div className="flex flex-1 overflow-hidden relative">
                <main className="flex-1 overflow-y-auto px-4 py-8 flex justify-center">
                    <div className="w-full max-w-4xl bg-white rounded-xl shadow-sm border border-slate-200 min-h-[800px] mb-20">
                        <EditorContent editor={editor} />
                    </div>
                </main>

                {/* Collapsible Sidebar */}
                {activeTab && (
                    <aside className="w-80 border-l border-slate-200/80 bg-white flex flex-col shadow-lg z-10 transition-all duration-300">
                        <div className="flex items-center justify-between border-b border-slate-200/80 px-5 py-4">
                            <h3 className="font-semibold text-slate-900 capitalize tracking-tight">{activeTab}</h3>
                            <button onClick={() => setActiveTab(null)} className="text-slate-400 hover:text-slate-700 transition-colors">✕</button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-5 space-y-4">
                            {/* Comments Tab */}
                            {activeTab === "comments" && (
                                <div className="space-y-5">
                                    <form onSubmit={handleAddComment} className="space-y-3">
                                        <textarea
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            placeholder="Add a comment..."
                                            className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors resize-none shadow-sm"
                                            rows={3}
                                        />
                                        <Button type="submit" className="w-full" size="sm">
                                            Post Comment
                                        </Button>
                                    </form>
                                    <div className="space-y-4 pt-2">
                                        {comments.map((c) => (
                                            <div key={c.id} className="rounded-xl border border-slate-200 p-3.5 text-sm bg-slate-50/50 shadow-sm">
                                                <div className="flex items-center space-x-2 mb-2">
                                                    <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                                                        {c.user?.name?.[0]?.toUpperCase() || "?"}
                                                    </div>
                                                    <p className="font-semibold text-slate-900 text-xs">{c.user?.name}</p>
                                                </div>
                                                <p className="text-slate-700 leading-relaxed">{c.content}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* History Tab */}
                            {activeTab === "history" && (
                                <div className="space-y-4">
                                    <Button onClick={handleCreateRevision} className="w-full" size="sm" variant="outline">
                                        Take Snapshot
                                    </Button>
                                    <div className="space-y-3">
                                        {revisions.map((rev) => (
                                            <div key={rev.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-3.5 bg-white shadow-sm hover:border-indigo-300 transition-colors">
                                                <div>
                                                    <p className="font-semibold text-slate-900 text-sm">Version {rev.versionNum}</p>
                                                    <p className="text-slate-500 text-xs mt-0.5">{new Date(rev.createdAt).toLocaleString()}</p>
                                                    <p className="text-indigo-600 font-medium text-[10px] mt-1">by {rev.creator?.name || 'Unknown'}</p>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleRestoreRevision(rev.id)}
                                                >
                                                    <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                                                    Restore
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Share Tab */}
                            {activeTab === "share" && (
                                <div className="space-y-6">
                                    <form onSubmit={handleAddShare} className="space-y-4">
                                        <Input
                                            label="User Email"
                                            type="email"
                                            required
                                            value={shareEmail}
                                            onChange={(e) => setShareEmail(e.target.value)}
                                            placeholder="colleague@example.com"
                                        />
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Permission Level</label>
                                            <select
                                                value={sharePermission}
                                                onChange={(e) => setSharePermission(e.target.value)}
                                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white shadow-sm"
                                            >
                                                <option value="Viewer">Viewer</option>
                                                <option value="Commenter">Commenter</option>
                                                <option value="Editor">Editor</option>
                                            </select>
                                        </div>
                                        <Button type="submit" className="w-full">
                                            Share Document
                                        </Button>
                                    </form>

                                    <div className="pt-4 border-t border-slate-200">
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Access List</p>
                                        <div className="space-y-3">
                                            {shares.map((s) => (
                                                <div key={s.id} className="flex items-center justify-between text-sm">
                                                    <span className="truncate text-slate-700 font-medium">{s.user?.email}</span>
                                                    <span className="rounded bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600 border border-indigo-100">{s.role || s.permission}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </aside>
                )}
            </div>
        </div>
    );
}