import React from "react";
import { Editor } from "@tiptap/react";
import {
    Bold, Italic, Underline as UnderlineIcon, Strikethrough, Heading1, Heading2,
    List, ListOrdered, AlignLeft, AlignCenter, AlignRight
} from "lucide-react";

interface EditorToolbarProps {
    editor: Editor | null;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({ editor }) => {
    if (!editor) return null;

    const ToolbarButton = ({
        onClick,
        isActive,
        children
    }: {
        onClick: () => void;
        isActive: boolean;
        children: React.ReactNode;
    }) => (
        <button
            onClick={onClick}
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
            >
                <Bold className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleItalic().run()}
                isActive={editor.isActive("italic")}
            >
                <Italic className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                isActive={editor.isActive("underline")}
            >
                <UnderlineIcon className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleStrike().run()}
                isActive={editor.isActive("strike")}
            >
                <Strikethrough className="h-4 w-4" />
            </ToolbarButton>

            <div className="h-5 w-px bg-slate-200 mx-2" />

            <ToolbarButton
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                isActive={editor.isActive("heading", { level: 1 })}
            >
                <Heading1 className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                isActive={editor.isActive("heading", { level: 2 })}
            >
                <Heading2 className="h-4 w-4" />
            </ToolbarButton>

            <div className="h-5 w-px bg-slate-200 mx-2" />

            <ToolbarButton
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                isActive={editor.isActive("bulletList")}
            >
                <List className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                isActive={editor.isActive("orderedList")}
            >
                <ListOrdered className="h-4 w-4" />
            </ToolbarButton>

            <div className="h-5 w-px bg-slate-200 mx-2" />

            <ToolbarButton
                onClick={() => editor.chain().focus().setTextAlign('left').run()}
                isActive={editor.isActive({ textAlign: 'left' })}
            >
                <AlignLeft className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
                onClick={() => editor.chain().focus().setTextAlign('center').run()}
                isActive={editor.isActive({ textAlign: 'center' })}
            >
                <AlignCenter className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
                onClick={() => editor.chain().focus().setTextAlign('right').run()}
                isActive={editor.isActive({ textAlign: 'right' })}
            >
                <AlignRight className="h-4 w-4" />
            </ToolbarButton>
        </div>
    );
};
