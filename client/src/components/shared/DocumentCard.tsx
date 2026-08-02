import React from "react";
import { FileText, Copy, Trash2, Clock, MessageSquare } from "lucide-react";
import { DocumentItem } from "../../types";

interface DocumentCardProps {
    doc: DocumentItem;
    isOwner: boolean;
    onClick: () => void;
    onDuplicate: (id: string, e: React.MouseEvent) => void;
    onDelete: (id: string, e: React.MouseEvent) => void;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
    doc,
    isOwner,
    onClick,
    onDuplicate,
    onDelete,
}) => {
    return (
        <div
            onClick={onClick}
            className="group relative flex flex-col justify-between rounded-xl border border-slate-200/60 bg-white p-5 shadow-sm hover:border-indigo-300 hover:shadow-md cursor-pointer transition-all"
        >
            <div>
                <div className="flex items-start justify-between mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <FileText className="h-5 w-5" />
                    </div>
                    <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={(e) => onDuplicate(doc.id, e)}
                            title="Duplicate"
                            className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-slate-100 transition-colors"
                        >
                            <Copy className="h-4 w-4" />
                        </button>
                        {isOwner && (
                            <button
                                onClick={(e) => onDelete(doc.id, e)}
                                title="Delete"
                                className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-slate-100 transition-colors"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                </div>

                <h3 className="font-semibold text-slate-900 truncate mb-1.5">{doc.title}</h3>
                <p className="text-xs text-slate-500 flex items-center space-x-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Modified {new Date(doc.lastModified).toLocaleDateString()}</span>
                    {doc.commentCount !== undefined && (
                        <span className="flex items-center ml-2">
                            <MessageSquare className="h-3.5 w-3.5 mr-0.5" />
                            {doc.commentCount}
                        </span>
                    )}
                </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                <span className="truncate pr-2">By {doc.owner?.name || "Owner"}</span>
                {!isOwner && (
                    <span className="rounded bg-indigo-50 px-2 py-0.5 text-indigo-600 shrink-0">Shared</span>
                )}
            </div>
        </div>
    );
};
