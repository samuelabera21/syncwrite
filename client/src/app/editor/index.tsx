import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Collaboration from "@tiptap/extension-collaboration";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { api } from "../../lib/api";
import { useSession } from "../../lib/auth-client";
import {
    ArrowLeft, Share2, MessageSquare, History, Cloud, CloudCheck,
    RotateCcw, Trash2, Shield, UserPlus, Lock, AlertCircle, Loader2, CheckCircle2
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

import { CollaborationCursor } from "../../lib/collaboration-cursor";
import { EditorToolbar } from "../../components/editor/EditorToolbar";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

interface CollaborativeEditorProps {
    id: string;
    ydoc: Y.Doc;
    provider: WebsocketProvider;
    session: any;
}

function CollaborativeEditor({ id, ydoc, provider, session }: CollaborativeEditorProps) {
    const navigate = useNavigate();

    const [documentTitle, setDocumentTitle] = useState("Untitled Document");
    const [myRole, setMyRole] = useState<"OWNER" | "EDITOR" | "COMMENTER" | "VIEWER">("OWNER");
    const [docOwner, setDocOwner] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<"comments" | "history" | "share" | null>(null);

    // Comments state
    const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState("");
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState("");
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState("");


    // Revisions state
    const [revisions, setRevisions] = useState<any[]>([]);

    // Sharing state
    const [shares, setShares] = useState<any[]>([]);
    const [shareEmail, setShareEmail] = useState("");
    const [sharePermission, setSharePermission] = useState("VIEWER");
    const [isSharing, setIsSharing] = useState(false);
    const [updatingShareId, setUpdatingShareId] = useState<string | null>(null);

    // Presence state
    const [onlineUsers, setOnlineUsers] = useState<any[]>([]);

    const isEditable = myRole === "OWNER" || myRole === "EDITOR";
    const canComment = myRole === "OWNER" || myRole === "EDITOR" || myRole === "COMMENTER";
    const isOwner = myRole === "OWNER";

    const editor = useEditor({
        editable: isEditable,
        extensions: [
            StarterKit.configure({
                undoRedo: false, // Collaboration extension handles undo/redo
                link: { openOnClick: false },
            }),
            Placeholder.configure({
                placeholder: isEditable ? "Start typing your collaborative document..." : "Document is empty."
            }),
            TextAlign.configure({ types: ["heading", "paragraph"] }),
            Collaboration.configure({ document: ydoc }),
            CollaborationCursor.configure({
                provider,
                user: {
                    name: session?.user?.name || "Guest",
                    color: "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0"),
                },
            }),
        ],
        editorProps: {
            attributes: {
                class: `prose prose-slate prose-lg max-w-none focus:outline-none min-h-[700px] px-10 py-12 ${!isEditable ? "cursor-default select-text" : ""}`,
            },
        },
    }, [id, ydoc, provider]);

    // Keep editor editable status in sync with permission role
    useEffect(() => {
        if (editor) {
            editor.setEditable(isEditable);
        }
    }, [editor, isEditable]);

    // Fetch document metadata & role
    useEffect(() => {
        if (!id) return;

        api.get(`/documents/${id}`)
            .then((res) => {
                if (res.data?.document?.title) {
                    setDocumentTitle(res.data.document.title);
                }
                if (res.data?.role) {
                    setMyRole(res.data.role);
                }
                if (res.data?.document?.owner) {
                    setDocOwner(res.data.document.owner);
                }
            })
            .catch((err) => {
                console.error("Failed to load document metadata:", err);
                toast.error("Failed to load document");
            });

        fetchComments();
        fetchRevisions();
        fetchShares();
    }, [id]);

    // Setup awareness & provider status
    useEffect(() => {
        if (!provider) return;

        const updateAwareness = () => {
            const states = Array.from(provider.awareness.getStates().values());
            setOnlineUsers(states.filter((s: any) => s.user));
        };
        provider.awareness.on("change", updateAwareness);

        if (session?.user?.name) {
            provider.awareness.setLocalStateField("user", {
                name: session.user.name,
                color: "#6366f1",
            });
        }

        const handleStatus = (event: { status: string }) => {
            setIsSaving(event.status !== "connected");
        };
        provider.on("status", handleStatus);

        return () => {
            provider.awareness.off("change", updateAwareness);
            provider.off("status", handleStatus);
        };
    }, [provider, session?.user?.name]);

    const handleTitleChange = async (newTitle: string) => {
        if (!isEditable) return;
        setDocumentTitle(newTitle);
        try {
            await api.patch(`/documents/${id}`, { title: newTitle });
        } catch (err) {
            toast.error("Failed to update title");
        }
    };

    const fetchComments = () =>
        api.get(`/documents/${id}/comments`)
            .then((res) => setComments(res.data.comments || []))
            .catch(console.error);

    const fetchRevisions = () =>
        api.get(`/documents/${id}/revisions`)
            .then((res) => setRevisions(res.data.revisions || []))
            .catch(console.error);

    const fetchShares = () =>
        api.get(`/documents/${id}/shares`)
            .then((res) => setShares(res.data.shares || []))
            .catch(console.error);

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        setIsSubmittingComment(true);
        try {
            await api.post(`/documents/${id}/comments`, { content: newComment });
            setNewComment("");
            fetchComments();
            toast.success("Comment added");
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to add comment");
        } finally {
            setIsSubmittingComment(false);
        }
    };

    const handleAddReply = async (parentId: string) => {
        if (!replyContent.trim()) return;
        try {
            await api.post(`/documents/${id}/comments`, { content: replyContent, parentId });
            setReplyContent("");
            setReplyingTo(null);
            fetchComments();
            toast.success("Reply added");
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to add reply");
        }
    };

    const handleEditComment = async (commentId: string) => {
        if (!editContent.trim()) return;
        try {
            await api.patch(`/documents/${id}/comments/${commentId}`, { content: editContent });
            setEditContent("");
            setEditingCommentId(null);
            fetchComments();
            toast.success("Comment updated");
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to update comment");
        }
    };

    const handleToggleResolve = async (commentId: string, currentResolved: boolean) => {
        try {
            await api.patch(`/documents/${id}/comments/${commentId}`, { isResolved: !currentResolved });
            fetchComments();
            toast.success(currentResolved ? "Comment unresolved" : "Comment resolved");
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to update comment status");
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        try {
            await api.delete(`/documents/${id}/comments/${commentId}`);
            fetchComments();
            toast.success("Comment deleted");
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to delete comment");
        }
    };

    // Polling for comments
    useEffect(() => {
        if (activeTab !== "comments") return;
        const interval = setInterval(() => {
            fetchComments();
        }, 4000);
        return () => clearInterval(interval);
    }, [activeTab, id]);

    // Compute total discussion count
    const totalDiscussionCount = comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0);


    const handleAddShare = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!shareEmail.trim()) return;
        setIsSharing(true);
        try {
            await api.post(`/documents/${id}/shares`, {
                email: shareEmail.trim(),
                role: sharePermission,
            });
            setShareEmail("");
            fetchShares();
            toast.success("Collaborator invited");
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to invite collaborator");
        } finally {
            setIsSharing(false);
        }
    };

    const handleUpdateShareRole = async (shareId: string, newRole: string) => {
        setUpdatingShareId(shareId);
        try {
            await api.patch(`/documents/${id}/shares/${shareId}`, { role: newRole });
            fetchShares();
            toast.success("Collaborator role updated");
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to update role");
        } finally {
            setUpdatingShareId(null);
        }
    };

    const handleRevokeShare = async (shareId: string) => {
        if (!confirm("Are you sure you want to revoke access for this user?")) return;
        setUpdatingShareId(shareId);
        try {
            await api.delete(`/documents/${id}/shares/${shareId}`);
            fetchShares();
            toast.success("Collaborator access revoked");
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to revoke access");
        } finally {
            setUpdatingShareId(null);
        }
    };

    const handleCreateRevision = async () => {
        try {
            await api.post(`/documents/${id}/revisions`, {});
            fetchRevisions();
            toast.success("Snapshot created");
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to create snapshot");
        }
    };

    const handleRestoreRevision = async (revId: string) => {
        if (!confirm("Are you sure you want to restore this revision? Current unsaved changes may be overwritten.")) return;
        try {
            await api.post(`/documents/${id}/revisions/${revId}/restore`);
            fetchRevisions();
            toast.success("Document restored from revision");
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to restore revision");
        }
    };

    return (
        <div className="flex h-screen flex-col bg-slate-50 overflow-hidden font-sans">
            <Toaster position="bottom-right" />

            {/* Document Header */}
            <header className="flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/80 backdrop-blur-md px-6 z-20">
                <div className="flex items-center space-x-4 flex-1 min-w-0">
                    <button
                        onClick={() => navigate("/dashboard")}
                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                        title="Back to Dashboard"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div className="flex flex-col flex-1 min-w-0 max-w-lg">
                        <input
                            type="text"
                            value={documentTitle}
                            disabled={!isEditable}
                            onChange={(e) => setDocumentTitle(e.target.value)}
                            onBlur={(e) => handleTitleChange(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.currentTarget.blur();
                                }
                            }}
                            className={`font-semibold text-slate-900 bg-transparent text-lg border-b border-transparent focus:border-indigo-500 focus:outline-none truncate transition-colors ${
                                !isEditable ? "cursor-default text-slate-700" : "hover:border-slate-300"
                            }`}
                            placeholder="Untitled Document"
                        />
                        <div className="flex items-center space-x-2 text-xs text-slate-400">
                            {isSaving ? (
                                <span className="flex items-center space-x-1 text-amber-600">
                                    <Cloud className="h-3 w-3 animate-pulse" />
                                    <span>Syncing...</span>
                                </span>
                            ) : (
                                <span className="flex items-center space-x-1 text-emerald-600">
                                    <CloudCheck className="h-3 w-3" />
                                    <span>Saved to cloud</span>
                                </span>
                            )}
                            <span>•</span>
                            <span className="flex items-center space-x-1 font-medium text-slate-500">
                                <Shield className="h-3 w-3 text-indigo-500" />
                                <span>Role: <strong className="text-indigo-600">{myRole}</strong></span>
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right Header: Online Users & Action Buttons */}
                <div className="flex items-center space-x-3">
                    {/* Collaborator Avatars */}
                    <div className="flex -space-x-1.5 overflow-hidden mr-2">
                        {onlineUsers.map((u, i) => (
                            <div
                                key={i}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-full ring-2 ring-white text-xs font-bold text-white shadow-sm"
                                style={{ backgroundColor: u.user?.color || "#6366f1" }}
                                title={u.user?.name || "Collaborator"}
                            >
                                {u.user?.name?.[0]?.toUpperCase() || "U"}
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center space-x-2">
                        <Button
                            variant={activeTab === "share" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setActiveTab(activeTab === "share" ? null : "share")}
                        >
                            <Share2 className="h-4 w-4 mr-1.5" />
                            <span className="hidden sm:inline">Share</span>
                            {shares.length > 0 && (
                                <span className="ml-1.5 rounded-full bg-indigo-100 px-1.5 py-0.2 text-[10px] font-bold text-indigo-700">
                                    {shares.length}
                                </span>
                            )}
                        </Button>

                        <Button
                            variant={activeTab === "comments" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setActiveTab(activeTab === "comments" ? null : "comments")}
                        >
                            <MessageSquare className="h-4 w-4 mr-1.5" />
                            <span className="hidden sm:inline">Comments</span>
                            {totalDiscussionCount > 0 && (
                                <span className="ml-1.5 rounded-full bg-slate-200 px-1.5 py-0.2 text-[10px] font-bold text-slate-700">
                                    {totalDiscussionCount}
                                </span>
                            )}
                        </Button>

                        <Button
                            variant={activeTab === "history" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setActiveTab(activeTab === "history" ? null : "history")}
                        >
                            <History className="h-4 w-4 mr-1.5" />
                            <span className="hidden sm:inline">History</span>
                        </Button>
                    </div>
                </div>
            </header>

            {/* Formatting Toolbar */}
            <EditorToolbar editor={editor} disabled={!isEditable} role={myRole} />

            {/* Main Workspace & Sidebar */}
            <div className="flex flex-1 overflow-hidden relative">
                <main className="flex-1 overflow-y-auto px-4 py-8 flex justify-center">
                    <div className="w-full max-w-4xl bg-white rounded-xl shadow-sm border border-slate-200 min-h-[800px] mb-20">
                        <EditorContent editor={editor} />
                    </div>
                </main>

                {/* Collapsible Sidebar */}
                {activeTab && (
                    <aside className="w-84 sm:w-96 border-l border-slate-200/80 bg-white flex flex-col shadow-lg z-10 transition-all duration-300">
                        <div className="flex items-center justify-between border-b border-slate-200/80 px-5 py-4">
                            <h3 className="font-semibold text-slate-900 capitalize tracking-tight">{activeTab}</h3>
                            <button
                                onClick={() => setActiveTab(null)}
                                className="text-slate-400 hover:text-slate-700 transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-5 space-y-4">
                            {/* Comments Tab */}
                            {activeTab === "comments" && (
                                <div className="space-y-5">
                                    {canComment ? (
                                        <form onSubmit={handleAddComment} className="space-y-3">
                                            <textarea
                                                value={newComment}
                                                onChange={(e) => setNewComment(e.target.value)}
                                                placeholder="Add a comment..."
                                                className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors resize-none shadow-sm"
                                                rows={3}
                                            />
                                            <Button
                                                type="submit"
                                                className="w-full"
                                                size="sm"
                                                disabled={isSubmittingComment || !newComment.trim()}
                                            >
                                                {isSubmittingComment ? "Posting..." : "Post Comment"}
                                            </Button>
                                        </form>
                                    ) : (
                                        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 flex items-start space-x-2">
                                            <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                                            <span>You have view-only access and cannot post comments on this document.</span>
                                        </div>
                                    )}
                                    <div className="space-y-6 pt-2 pb-4">
                                        {comments.map((c) => {
                                            const isEditing = editingCommentId === c.id;
                                            const isMyComment = session?.user?.id === c.userId;
                                            
                                            return (
                                                <div key={c.id} className={`space-y-3 ${c.isResolved ? "opacity-70 transition-opacity hover:opacity-100" : ""}`}>
                                                    {/* Top-level comment */}
                                                    <div className={`flex w-full ${isMyComment ? "justify-end" : "justify-start"}`}>
                                                        <div className={`w-[90%] rounded-2xl p-3 space-y-2 ${isMyComment ? "bg-indigo-50 border border-indigo-100 rounded-tr-sm" : "bg-white border border-slate-200 shadow-sm rounded-tl-sm"} ${c.isResolved ? "bg-slate-50 border-slate-200" : ""}`}>
                                                            <div className={`flex items-center justify-between ${isMyComment ? "flex-row-reverse" : "flex-row"}`}>
                                                                <div className={`flex items-center space-x-2 ${isMyComment ? "space-x-reverse" : ""}`}>
                                                                    <div className={`h-6 w-6 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${isMyComment ? "bg-indigo-200 text-indigo-800" : "bg-slate-100 text-slate-700"} ${c.isResolved ? "bg-slate-200 text-slate-500" : ""}`}>
                                                                        {c.user?.name?.[0]?.toUpperCase() || "U"}
                                                                    </div>
                                                                    <div className={`flex flex-col ${isMyComment ? "items-end" : "items-start"}`}>
                                                                        <div className="flex items-center space-x-1">
                                                                            <p className="text-xs font-semibold text-slate-800">{c.user?.name || "Anonymous"}</p>
                                                                            {c.isResolved && (
                                                                                <span className="flex items-center text-[9px] font-medium text-emerald-600 bg-emerald-50 px-1 rounded border border-emerald-100 ml-1">
                                                                                    <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />
                                                                                    Resolved
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <p className="text-[9px] text-slate-400">
                                                                            {new Date(c.createdAt).toLocaleDateString()} at {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                            {c.createdAt !== c.updatedAt && " (edited)"}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center space-x-1">
                                                                    {canComment && (
                                                                        <button
                                                                            onClick={() => { setReplyingTo(replyingTo === c.id ? null : c.id); setReplyContent(""); }}
                                                                            className="text-slate-400 hover:text-indigo-600 transition-colors p-1 rounded text-[10px] font-medium"
                                                                        >
                                                                            Reply
                                                                        </button>
                                                                    )}
                                                                    {(isMyComment || isOwner) && (
                                                                        <>
                                                                            <button
                                                                                onClick={() => handleToggleResolve(c.id, c.isResolved)}
                                                                                className={`p-1 rounded text-[10px] font-medium transition-colors ${c.isResolved ? "text-slate-400 hover:text-amber-600" : "text-emerald-500 hover:text-emerald-700"}`}
                                                                            >
                                                                                {c.isResolved ? "Unresolve" : "Resolve"}
                                                                            </button>
                                                                            <button
                                                                                onClick={() => { setEditingCommentId(isEditing ? null : c.id); setEditContent(c.content); }}
                                                                                className="text-slate-400 hover:text-indigo-600 transition-colors p-1 rounded text-[10px] font-medium"
                                                                            >
                                                                                Edit
                                                                            </button>
                                                                            <button
                                                                                onClick={() => handleDeleteComment(c.id)}
                                                                                className="text-slate-400 hover:text-red-600 transition-colors p-1 rounded"
                                                                                title="Delete comment"
                                                                            >
                                                                                <Trash2 className="h-3 w-3" />
                                                                            </button>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            
                                                            {isEditing ? (
                                                                <div className="space-y-2 mt-2">
                                                                    <textarea
                                                                        value={editContent}
                                                                        onChange={(e) => setEditContent(e.target.value)}
                                                                        className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                                                                        rows={2}
                                                                    />
                                                                    <div className={`flex items-center space-x-2 ${isMyComment ? "justify-end" : "justify-start"}`}>
                                                                        <Button size="sm" onClick={() => handleEditComment(c.id)} disabled={!editContent.trim()} className="h-7 px-3 text-xs">Save</Button>
                                                                        <Button size="sm" variant="outline" onClick={() => setEditingCommentId(null)} className="h-7 px-3 text-xs bg-white">Cancel</Button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <p className={`text-xs text-slate-700 whitespace-pre-wrap ${isMyComment ? "text-right mr-8" : "text-left ml-8"}`}>{c.content}</p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Replies */}
                                                    {c.replies && c.replies.length > 0 && (
                                                        <div className="space-y-3 mt-3">
                                                            {c.replies.map((r: any) => {
                                                                const isEditingReply = editingCommentId === r.id;
                                                                const isMyReply = session?.user?.id === r.userId;
                                                                return (
                                                                    <div key={r.id} className={`flex w-full ${isMyReply ? "justify-end" : "justify-start"} ${r.isResolved ? "opacity-70 transition-opacity hover:opacity-100" : ""}`}>
                                                                        <div className={`w-[85%] rounded-2xl p-2.5 space-y-1.5 ${isMyReply ? "bg-indigo-50/70 border border-indigo-100 rounded-tr-sm" : "bg-white border border-slate-100 shadow-sm rounded-tl-sm"} ${r.isResolved ? "bg-slate-50 border-slate-200" : ""}`}>
                                                                            <div className={`flex items-center justify-between ${isMyReply ? "flex-row-reverse" : "flex-row"}`}>
                                                                                <div className={`flex items-center space-x-2 ${isMyReply ? "space-x-reverse" : ""}`}>
                                                                                    <div className={`h-5 w-5 rounded-full flex items-center justify-center font-bold text-[10px] flex-shrink-0 ${isMyReply ? "bg-indigo-200 text-indigo-800" : "bg-slate-100 text-slate-600"} ${r.isResolved ? "bg-slate-200 text-slate-500" : ""}`}>
                                                                                        {r.user?.name?.[0]?.toUpperCase() || "U"}
                                                                                    </div>
                                                                                    <div className={`flex flex-col ${isMyReply ? "items-end" : "items-start"}`}>
                                                                                        <div className="flex items-center space-x-1">
                                                                                            <p className="text-[11px] font-semibold text-slate-800">{r.user?.name || "Anonymous"}</p>
                                                                                            {r.isResolved && (
                                                                                                <span className="flex items-center text-[8px] font-medium text-emerald-600 bg-emerald-50 px-1 rounded border border-emerald-100 ml-1">
                                                                                                    <CheckCircle2 className="w-2 h-2 mr-0.5" />
                                                                                                    Resolved
                                                                                                </span>
                                                                                            )}
                                                                                        </div>
                                                                                        <p className="text-[9px] text-slate-400">
                                                                                            {new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                                            {r.createdAt !== r.updatedAt && " (edited)"}
                                                                                        </p>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="flex items-center space-x-1">
                                                                                    {canComment && (
                                                                                        <button
                                                                                            onClick={() => { setReplyingTo(replyingTo === c.id ? null : c.id); setReplyContent(""); }}
                                                                                            className="text-slate-400 hover:text-indigo-600 transition-colors p-1 rounded text-[10px] font-medium"
                                                                                        >
                                                                                            Reply
                                                                                        </button>
                                                                                    )}
                                                                                    {(isMyReply || isOwner) && (
                                                                                        <>
                                                                                            <button
                                                                                                onClick={() => handleToggleResolve(r.id, r.isResolved)}
                                                                                                className={`p-1 rounded text-[10px] font-medium transition-colors ${r.isResolved ? "text-slate-400 hover:text-amber-600" : "text-emerald-500 hover:text-emerald-700"}`}
                                                                                            >
                                                                                                {r.isResolved ? "Unresolve" : "Resolve"}
                                                                                            </button>
                                                                                            <button
                                                                                                onClick={() => { setEditingCommentId(isEditingReply ? null : r.id); setEditContent(r.content); }}
                                                                                                className="text-slate-400 hover:text-indigo-600 transition-colors p-1 rounded text-[10px] font-medium"
                                                                                            >
                                                                                                Edit
                                                                                            </button>
                                                                                            <button
                                                                                                onClick={() => handleDeleteComment(r.id)}
                                                                                                className="text-slate-400 hover:text-red-600 transition-colors p-1 rounded"
                                                                                                title="Delete reply"
                                                                                            >
                                                                                                <Trash2 className="h-3 w-3" />
                                                                                            </button>
                                                                                        </>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                            
                                                                            {isEditingReply ? (
                                                                                <div className="space-y-2 mt-1">
                                                                                    <textarea
                                                                                        value={editContent}
                                                                                        onChange={(e) => setEditContent(e.target.value)}
                                                                                        className="w-full rounded border border-slate-300 p-1.5 text-xs focus:border-indigo-500 focus:outline-none bg-white"
                                                                                        rows={2}
                                                                                    />
                                                                                    <div className={`flex items-center space-x-2 ${isMyReply ? "justify-end" : "justify-start"}`}>
                                                                                        <Button size="sm" onClick={() => handleEditComment(r.id)} disabled={!editContent.trim()} className="h-6 text-[10px] px-2">Save</Button>
                                                                                        <Button size="sm" variant="outline" onClick={() => setEditingCommentId(null)} className="h-6 text-[10px] px-2 bg-white">Cancel</Button>
                                                                                    </div>
                                                                                </div>
                                                                            ) : (
                                                                                <p className={`text-[11px] text-slate-700 whitespace-pre-wrap ${isMyReply ? "text-right mr-7" : "text-left ml-7"}`}>{r.content}</p>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}

                                                    {/* Reply Composer */}
                                                    {replyingTo === c.id && (
                                                        <div className="flex w-full justify-end mt-2">
                                                            <div className="w-[90%] bg-indigo-50/50 rounded-2xl p-3 border border-indigo-100">
                                                                <textarea
                                                                    value={replyContent}
                                                                    onChange={(e) => setReplyContent(e.target.value)}
                                                                    placeholder="Write a reply..."
                                                                    className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-indigo-500 focus:outline-none bg-white"
                                                                    rows={2}
                                                                />
                                                                <div className="flex items-center justify-end space-x-2 mt-2">
                                                                    <Button size="sm" variant="outline" onClick={() => setReplyingTo(null)} className="h-7 px-3 text-xs bg-white">Cancel</Button>
                                                                    <Button size="sm" onClick={() => handleAddReply(c.id)} disabled={!replyContent.trim()} className="h-7 px-3 text-xs">Reply</Button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                        {comments.length === 0 && (
                                            <p className="text-xs text-slate-400 italic text-center py-4">No comments yet</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* History / Revisions Tab */}
                            {activeTab === "history" && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                        <p className="text-xs text-slate-500">Document snapshot history</p>
                                        {isEditable && (
                                            <Button size="sm" variant="outline" onClick={handleCreateRevision}>
                                                Create Snapshot
                                            </Button>
                                        )}
                                    </div>
                                    <div className="space-y-3">
                                        {revisions.map((r) => (
                                            <div key={r.id} className="rounded-lg border border-slate-200 p-3 space-y-2 bg-white">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-medium text-slate-700">
                                                        {new Date(r.createdAt).toLocaleDateString()} {new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    {isEditable && (
                                                        <button
                                                            onClick={() => handleRestoreRevision(r.id)}
                                                            className="text-indigo-600 hover:text-indigo-800 text-xs font-semibold flex items-center space-x-1"
                                                        >
                                                            <RotateCcw className="h-3 w-3" />
                                                            <span>Restore</span>
                                                        </button>
                                                    )}
                                                </div>
                                                <p className="text-[11px] text-slate-400">Created by {r.creator?.name || "Unknown"}</p>
                                            </div>
                                        ))}
                                        {revisions.length === 0 && (
                                            <p className="text-xs text-slate-400 italic text-center py-4">No snapshot revisions recorded</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Share Tab */}
                            {activeTab === "share" && (
                                <div className="space-y-5">
                                    {isOwner ? (
                                        <form onSubmit={handleAddShare} className="space-y-3">
                                            <div>
                                                <label className="text-xs font-semibold text-slate-700 mb-1 block">Invite Collaborator</label>
                                                <Input
                                                    type="email"
                                                    placeholder="colleague@example.com"
                                                    value={shareEmail}
                                                    onChange={(e) => setShareEmail(e.target.value)}
                                                    className="w-full text-xs"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-slate-700 mb-1 block">Role</label>
                                                <select
                                                    value={sharePermission}
                                                    onChange={(e) => setSharePermission(e.target.value)}
                                                    className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-indigo-500 focus:outline-none shadow-sm bg-white"
                                                >
                                                    <option value="VIEWER">Viewer (Read Only)</option>
                                                    <option value="COMMENTER">Commenter (Read & Comment)</option>
                                                    <option value="EDITOR">Editor (Full Edit)</option>
                                                </select>
                                            </div>
                                            <Button type="submit" className="w-full" size="sm" disabled={isSharing}>
                                                <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                                                {isSharing ? "Sharing..." : "Send Invite"}
                                            </Button>
                                        </form>
                                    ) : (
                                        <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs text-slate-600 flex items-center space-x-2">
                                            <Lock className="h-4 w-4 text-slate-400 flex-shrink-0" />
                                            <span>Only the document owner can invite or manage collaborators.</span>
                                        </div>
                                    )}

                                    <div className="space-y-3 pt-3 border-t border-slate-100">
                                        <h4 className="text-xs font-semibold text-slate-900">Collaborators</h4>
                                        <div className="space-y-2">
                                            {/* Document Owner entry */}
                                            {docOwner && (
                                                <div className="flex items-center justify-between p-2.5 rounded-lg border border-amber-200 bg-amber-50/40 text-xs">
                                                    <div className="flex items-center space-x-2 truncate">
                                                        <div className="h-6 w-6 rounded-full bg-amber-200 flex items-center justify-center text-amber-800 font-bold text-[10px]">
                                                            {docOwner.name?.[0]?.toUpperCase() || "O"}
                                                        </div>
                                                        <div className="truncate">
                                                            <p className="font-medium text-slate-900 truncate">{docOwner.name}</p>
                                                            <p className="text-[10px] text-slate-500 truncate">{docOwner.email}</p>
                                                        </div>
                                                    </div>
                                                    <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[10px] font-semibold flex-shrink-0">
                                                        Owner
                                                    </span>
                                                </div>
                                            )}

                                            {/* Shared users list */}
                                            {shares.map((s) => (
                                                <div key={s.id} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-white text-xs hover:border-slate-300 transition-colors">
                                                    <div className="flex items-center space-x-2 truncate pr-2">
                                                        <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-[10px] flex-shrink-0">
                                                            {s.user?.name?.[0]?.toUpperCase() || s.user?.email?.[0]?.toUpperCase() || "U"}
                                                        </div>
                                                        <div className="truncate">
                                                            <p className="font-medium text-slate-800 truncate">{s.user?.name || s.user?.email}</p>
                                                            <p className="text-[10px] text-slate-400 truncate">{s.user?.email}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center space-x-1.5 flex-shrink-0">
                                                        {isOwner ? (
                                                            <>
                                                                <select
                                                                    value={s.role}
                                                                    disabled={updatingShareId === s.id}
                                                                    onChange={(e) => handleUpdateShareRole(s.id, e.target.value)}
                                                                    className="rounded border border-slate-300 py-1 px-1.5 text-[11px] font-medium bg-white text-slate-700 focus:border-indigo-500 focus:outline-none"
                                                                >
                                                                    <option value="VIEWER">Viewer</option>
                                                                    <option value="COMMENTER">Commenter</option>
                                                                    <option value="EDITOR">Editor</option>
                                                                </select>
                                                                <button
                                                                    type="button"
                                                                    disabled={updatingShareId === s.id}
                                                                    onClick={() => handleRevokeShare(s.id)}
                                                                    className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                                                                    title="Revoke access"
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 capitalize text-[10px] font-semibold">
                                                                {s.role}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                            {shares.length === 0 && !docOwner && (
                                                <p className="text-xs text-slate-400 italic text-center py-2">No collaborators yet</p>
                                            )}
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

export default function Editor() {
    const { id } = useParams<{ id: string }>();
    const { data: session, isPending: isSessionPending } = useSession();
    const [yjsState, setYjsState] = useState<{ ydoc: Y.Doc; provider: WebsocketProvider } | null>(null);

    useEffect(() => {
        if (!id) return;

        const ydoc = new Y.Doc();
        const provider = new WebsocketProvider("ws://localhost:5000", id, ydoc);

        setYjsState({ ydoc, provider });

        return () => {
            provider.destroy();
            ydoc.destroy();
            setYjsState(null);
        };
    }, [id]);

    if (isSessionPending || !yjsState || !id) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center space-y-3">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                    <p className="text-sm font-medium text-slate-600">Loading document...</p>
                </div>
            </div>
        );
    }

    return (
        <CollaborativeEditor
            key={id}
            id={id}
            ydoc={yjsState.ydoc}
            provider={yjsState.provider}
            session={session}
        />
    );
}