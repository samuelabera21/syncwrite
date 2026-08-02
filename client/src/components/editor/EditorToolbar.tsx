import React from "react";
import { Editor } from "@tiptap/react";
import {
    Bold, Italic, Underline as UnderlineIcon, Strikethrough, Heading1, Heading2,
    List, ListOrdered, AlignLeft, AlignCenter, AlignRight, Eye, MessageSquare
} from "lucide-react";

interface EditorToolbarProps {
    editor: Editor | null;
    disabled?: boolean;
    role?: "OWNER" | "EDITOR" | "COMMENTER" | "VIEWER";
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({ editor, disabled = false, role = "OWNER" }) => {
    if (!editor) return null;

    if (disabled || role === "VIEWER" || role === "COMMENTER") {
        return (
            <div className="flex items-center justify-between border-b border-slate-200/80 bg-slate-50/80 px-6 py-2 shadow-sm text-xs text-slate-500">
                <div className="flex items-center space-x-2">
                    {role === "VIEWER" ? (
                        <>
                            <Eye className="h-4 w-4 text-slate-400" />
                            <span className="font-medium text-slate-600">Viewing mode</span>
                            <span className="text-slate-400">— You have read-only access to this document.</span>
                        </>
                    ) : (
                        <>
                            <MessageSquare className="h-4 w-4 text-indigo-500" />
                            <span className="font-medium text-indigo-700">Commenter mode</span>
                            <span className="text-slate-400">— You can view content and post comments. Content editing is disabled.</span>
                        </>
                    )}
                </div>
            </div>
        );
    }

    const ToolbarButton = ({
        onClick,
        isActive,
        children,
        title,
    }: {
        onClick: () => void;
        isActive: boolean;
        children: React.ReactNode;
        title?: string;
    }) => (
        <button
            type="button"
            onClick={onClick}
            title={title}
            className={`p-2 rounded-lg transition-colors ${
                isActive ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100"
            }`}
        >
            {children}
        </button>
    );

    return (
        <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200/80 bg-white px-6 py-2 shadow-sm">
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleBold().run()}
                isActive={editor.isActive("bold")}
                title="Bold"
            >
                <Bold className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleItalic().run()}
                isActive={editor.isActive("italic")}
                title="Italic"
            >
                <Italic className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                isActive={editor.isActive("underline")}
                title="Underline"
            >
                <UnderlineIcon className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleStrike().run()}
                isActive={editor.isActive("strike")}
                title="Strikethrough"
            >
                <Strikethrough className="h-4 w-4" />
            </ToolbarButton>

            <div className="h-5 w-px bg-slate-200 mx-2" />

            <ToolbarButton
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                isActive={editor.isActive("heading", { level: 1 })}
                title="Heading 1"
            >
                <Heading1 className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                isActive={editor.isActive("heading", { level: 2 })}
                title="Heading 2"
            >
                <Heading2 className="h-4 w-4" />
            </ToolbarButton>

            <div className="h-5 w-px bg-slate-200 mx-2" />

            <ToolbarButton
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                isActive={editor.isActive("bulletList")}
                title="Bullet List"
            >
                <List className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                isActive={editor.isActive("orderedList")}
                title="Numbered List"
            >
                <ListOrdered className="h-4 w-4" />
            </ToolbarButton>

            <div className="h-5 w-px bg-slate-200 mx-2" />

            <ToolbarButton
                onClick={() => editor.chain().focus().setTextAlign("left").run()}
                isActive={editor.isActive({ textAlign: "left" })}
                title="Align Left"
            >
                <AlignLeft className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
                onClick={() => editor.chain().focus().setTextAlign("center").run()}
                isActive={editor.isActive({ textAlign: "center" })}
                title="Align Center"
            >
                <AlignCenter className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
                onClick={() => editor.chain().focus().setTextAlign("right").run()}
                isActive={editor.isActive({ textAlign: "right" })}
                title="Align Right"
            >
                <AlignRight className="h-4 w-4" />
            </ToolbarButton>
        </div>
    );
};
