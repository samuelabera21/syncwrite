import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import { useSession, signOut } from "../../lib/auth-client";
import {
    FileText, Plus, Search, LogOut, Loader2
} from "lucide-react";
import { DocumentItem } from "../../types";
import { DocumentCard } from "../../components/shared/DocumentCard";
import { Button } from "../../components/ui/Button";
import { NotificationsDropdown } from "../../components/shared/NotificationsDropdown";
import { ProfileSettingsModal } from "../../components/shared/ProfileSettingsModal";

export default function Dashboard() {
    const { data: session } = useSession();
    const navigate = useNavigate();
    const [documents, setDocuments] = useState<DocumentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState<"recent" | "owned" | "shared">("recent");
    const [creating, setCreating] = useState(false);
    const [showProfileSettings, setShowProfileSettings] = useState(false);

    const fetchDocuments = async () => {
        try {
            const res = await api.get("/documents");
            const combined = [...res.data.owned, ...res.data.shared];
            combined.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());
            setDocuments(combined);
        } catch (err) {
            console.error("Failed to fetch documents", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, []);

    const handleCreateDocument = async () => {
        setCreating(true);
        try {
            const res = await api.post("/documents", { title: "Untitled Document" });
            navigate(`/document/${res.data.document.id}`);
        } catch (err) {
            console.error("Failed to create document", err);
        } finally {
            setCreating(false);
        }
    };

    const handleDeleteDocument = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this document?")) return;
        try {
            await api.delete(`/documents/${id}`);
            setDocuments(documents.filter((doc) => doc.id !== id));
        } catch (err) {
            console.error("Failed to delete document", err);
        }
    };

    const handleDuplicateDocument = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const res = await api.post(`/documents/${id}/duplicate`);
            setDocuments([res.data.document, ...documents]);
        } catch (err) {
            console.error("Failed to duplicate document", err);
        }
    };

    const filteredDocs = documents.filter((doc) => {
        const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase());
        const isOwner = session?.user?.id === doc.ownerId;
        if (activeTab === "recent") return matchesSearch;
        if (activeTab === "owned") return matchesSearch && isOwner;
        return matchesSearch && !isOwner;
    });

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Top Navigation */}
            <header className="border-b border-slate-200/80 bg-white px-6 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center space-x-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
                        <FileText className="h-5 w-5" />
                    </div>
                    <span className="text-xl font-bold text-slate-900 tracking-tight">SyncWrite</span>
                </div>

                <div className="flex items-center space-x-5">
                    <NotificationsDropdown />
                    <div 
                        className="hidden sm:block text-right cursor-pointer hover:bg-slate-50 px-2 py-1 rounded-lg transition-colors"
                        onClick={() => setShowProfileSettings(true)}
                    >
                        <p className="text-sm font-semibold text-slate-900 leading-tight">
                            {session?.user?.name}
                        </p>
                        <p className="text-xs text-slate-500">{session?.user?.email}</p>
                    </div>
                    {session?.user?.image && (
                        <img 
                            src={session.user.image} 
                            alt="Avatar" 
                            className="h-8 w-8 rounded-full object-cover cursor-pointer hover:ring-2 ring-indigo-500 transition-all"
                            onClick={() => setShowProfileSettings(true)}
                        />
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => signOut().then(() => navigate("/login"))}
                        className="text-slate-600 border border-slate-200"
                    >
                        <LogOut className="h-4 w-4 mr-2" />
                        <span>Sign Out</span>
                    </Button>
                </div>
            </header>

            {/* Main Container */}
            <main className="max-w-6xl mx-auto px-6 py-10">
                {/* Actions & Search Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
                    <div className="flex items-center space-x-2 w-full sm:w-96">
                        <div className="relative w-full shadow-sm rounded-lg">
                            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search documents..."
                                className="w-full rounded-lg border border-slate-300 bg-white pl-10 pr-4 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors placeholder:text-slate-400"
                            />
                        </div>
                    </div>

                    <Button
                        onClick={handleCreateDocument}
                        isLoading={creating}
                        className="w-full sm:w-auto"
                    >
                        {!creating && <Plus className="h-4 w-4 mr-2" />}
                        New Document
                    </Button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-200 mb-8 space-x-6 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab("recent")}
                        className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === "recent"
                                ? "border-indigo-600 text-indigo-700"
                                : "border-transparent text-slate-500 hover:text-slate-800"
                            }`}
                    >
                        Recently Opened
                    </button>
                    <button
                        onClick={() => setActiveTab("owned")}
                        className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === "owned"
                                ? "border-indigo-600 text-indigo-700"
                                : "border-transparent text-slate-500 hover:text-slate-800"
                            }`}
                    >
                        My Documents
                    </button>
                    <button
                        onClick={() => setActiveTab("shared")}
                        className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === "shared"
                                ? "border-indigo-600 text-indigo-700"
                                : "border-transparent text-slate-500 hover:text-slate-800"
                            }`}
                    >
                        Shared With Me
                    </button>
                </div>

                {/* Document Grid */}
                {loading ? (
                    <div className="flex justify-center items-center py-20 text-indigo-400">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : filteredDocs.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-14 text-center shadow-sm">
                        <div className="mx-auto h-14 w-14 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                            <FileText className="h-6 w-6 text-slate-400" />
                        </div>
                        <h3 className="text-base font-semibold text-slate-900">No documents found</h3>
                        <p className="text-sm text-slate-500 mt-1.5 max-w-sm mx-auto">Get started by creating a new collaborative document or adjust your search.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredDocs.map((doc) => (
                            <DocumentCard
                                key={doc.id}
                                doc={doc}
                                isOwner={session?.user?.id === doc.ownerId}
                                onClick={() => navigate(`/document/${doc.id}`)}
                                onDuplicate={handleDuplicateDocument}
                                onDelete={handleDeleteDocument}
                            />
                        ))}
                    </div>
                )}
            </main>

            <ProfileSettingsModal 
                isOpen={showProfileSettings} 
                onClose={() => setShowProfileSettings(false)} 
            />
        </div>
    );
}