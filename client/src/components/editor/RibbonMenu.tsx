import React, { useState } from "react";
import { Editor } from "@tiptap/react";
import {
    Bold, Italic, Underline as UnderlineIcon, Strikethrough,
    AlignLeft, AlignCenter, AlignRight, AlignJustify,
    List, ListOrdered, Link as LinkIcon, Image as ImageIcon,
    Table as TableIcon, Minus, ChevronDown, Highlighter,
    Type, RemoveFormatting, Indent as IndentIcon,
    Outdent as OutdentIcon,
    Eye, MessageSquare, Clipboard, Scissors, Copy
} from "lucide-react";

interface RibbonMenuProps {
    editor: Editor | null;
    disabled?: boolean;
    role?: "OWNER" | "EDITOR" | "COMMENTER" | "VIEWER";
}

const standardColors = [
    '#000000', '#434343', '#666666', '#999999', '#B7B7B7', '#CCCCCC', '#D9D9D9', '#EFEFEF', '#F3F3F3', '#FFFFFF',
    '#980000', '#FF0000', '#FF9900', '#FFFF00', '#00FF00', '#00FFFF', '#4A86E8', '#0000FF', '#9900FF', '#FF00FF',
    '#E6B8AF', '#F4CCCC', '#FCE5CD', '#FFF2CC', '#D9EAD3', '#D0E0E3', '#C9DAF8', '#CFE2F3', '#D9D2E9', '#EAD1DC',
    '#DD7E6B', '#EA9999', '#F9CB9C', '#FFE599', '#B6D7A8', '#A2C4C9', '#A4C2F4', '#9FC5E8', '#B4A7D6', '#D5A6BD',
    '#CC4125', '#E06666', '#F6B26B', '#FFD966', '#93C47D', '#76A5AF', '#6D9EEB', '#6FA8DC', '#8E7CC3', '#C27BA0',
    '#A61C00', '#CC0000', '#E69138', '#F1C232', '#6AA84F', '#45818E', '#3C78D8', '#3D85C6', '#674EA7', '#A64D79',
    '#5B0F00', '#660000', '#783F04', '#7F6000', '#274E13', '#0C343D', '#1C4587', '#073763', '#20124D', '#4C1130'
];

export function RibbonMenu({ editor, disabled = false, role = "OWNER" }: RibbonMenuProps) {
    const [activeTab, setActiveTab] = useState<"Home" | "Insert" | "Design" | "Layout" | "View">("Home");
    const [showFontMenu, setShowFontMenu] = useState(false);
    const [showSizeMenu, setShowSizeMenu] = useState(false);
    const [showColorMenu, setShowColorMenu] = useState(false);
    const [showHighlightMenu, setShowHighlightMenu] = useState(false);
    const [showBulletMenu, setShowBulletMenu] = useState(false);
    const [showNumberMenu, setShowNumberMenu] = useState(false);
    
    if (!editor) return null;

    if (disabled || role === "VIEWER" || role === "COMMENTER") {
        return (
            <div className="flex items-center justify-between border-b border-slate-200/80 bg-[#f3f2f1] px-6 py-2 shadow-sm text-xs text-slate-500">
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

    const setLink = () => {
        const previousUrl = editor.getAttributes("link").href;
        const url = window.prompt("URL", previousUrl);
        if (url === null) return;
        if (url === "") {
            editor.chain().focus().extendMarkRange("link").unsetLink().run();
            return;
        }
        editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    };

    const addImage = () => {
        const url = window.prompt("Image URL");
        if (url) {
            editor.chain().focus().setImage({ src: url }).run();
        }
    };

    const insertTable = () => {
        editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    };

    const RibbonButton = ({ icon: Icon, label, isActive = false, onClick, className = "" }: any) => (
        <button
            onClick={onClick}
            title={label}
            className={`p-1 rounded flex items-center justify-center transition-colors ${
                isActive ? "bg-slate-300 outline outline-1 outline-slate-400" : "hover:bg-slate-200"
            } ${className}`}
        >
            <Icon className="w-[18px] h-[18px] text-[#2b579a]" />
        </button>
    );

    const RibbonGroup = ({ children, title }: { children: React.ReactNode, title: string }) => (
        <div className="flex flex-col items-center justify-between border-r border-slate-300 px-3 py-1 min-h-[85px]">
            <div className="flex flex-wrap gap-1 justify-center items-start flex-1">
                {children}
            </div>
            <span className="text-[11px] text-slate-500 mt-1">{title}</span>
        </div>
    );

    return (
        <div className="flex flex-col bg-[#f3f2f1] border-b border-slate-300 select-none font-sans">
            {/* Tabs */}
            <div className="flex px-2 pt-1 space-x-1 border-b border-slate-300 bg-white/50">
                {["Home", "Insert", "Design", "Layout", "References", "Review", "View", "Help"].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`px-3 py-1.5 text-sm transition-colors border-b-2 ${
                            activeTab === tab 
                                ? "border-[#2b579a] text-[#2b579a] font-semibold bg-[#f3f2f1]" 
                                : "border-transparent text-slate-600 hover:bg-slate-200"
                        }`}
                        style={activeTab === tab ? { marginBottom: "-1px" } : {}}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Toolbar Area */}
            <div className="bg-[#f3f2f1] flex flex-wrap items-stretch overflow-x-auto min-h-[95px]">
                {activeTab === "Home" && (
                    <>
                        {/* Clipboard */}
                        <RibbonGroup title="Clipboard">
                            <div className="flex flex-col gap-1 items-center mr-2">
                                <button className="flex flex-col items-center p-1 hover:bg-slate-200 rounded" title="Paste">
                                    <Clipboard className="w-6 h-6 text-[#2b579a] mb-1" />
                                    <span className="text-[10px] text-[#2b579a]">Paste</span>
                                </button>
                            </div>
                            <div className="flex flex-col gap-0.5 justify-center">
                                <button className="flex items-center space-x-1 p-0.5 hover:bg-slate-200 rounded text-[11px]" title="Cut">
                                    <Scissors className="w-3.5 h-3.5 text-[#2b579a]" />
                                    <span>Cut</span>
                                </button>
                                <button className="flex items-center space-x-1 p-0.5 hover:bg-slate-200 rounded text-[11px]" title="Copy">
                                    <Copy className="w-3.5 h-3.5 text-[#2b579a]" />
                                    <span>Copy</span>
                                </button>
                            </div>
                        </RibbonGroup>

                        {/* Font */}
                        <RibbonGroup title="Font">
                            <div className="flex flex-col gap-1 w-full">
                                <div className="flex items-center space-x-1">
                                    <div className="relative">
                                        <button onClick={() => setShowFontMenu(!showFontMenu)} className="flex items-center space-x-2 px-1.5 py-0.5 bg-white border border-slate-300 hover:border-[#2b579a] rounded-sm text-xs min-w-[110px] justify-between h-[22px]">
                                            <span className="truncate">{editor.getAttributes('textStyle').fontFamily || 'Calibri'}</span>
                                            <ChevronDown className="w-3 h-3 text-slate-500" />
                                        </button>
                                        {showFontMenu && (
                                            <>
                                                <div className="fixed inset-0 z-40" onClick={() => setShowFontMenu(false)} />
                                                <div className="absolute top-full mt-1 left-0 bg-white border border-slate-300 rounded-sm shadow-xl z-50 max-h-64 overflow-y-auto w-48 py-1">
                                                    {['Arial', 'Calibri', 'Cambria', 'Comic Sans MS', 'Courier New', 'Georgia', 'Inter', 'Times New Roman', 'Verdana'].map(font => (
                                                        <button
                                                            key={font}
                                                            onClick={() => { editor.chain().focus().setFontFamily(font).run(); setShowFontMenu(false); }}
                                                            className="block w-full text-left px-3 py-1 hover:bg-slate-100"
                                                            style={{ fontFamily: font }}
                                                        >
                                                            {font}
                                                        </button>
                                                    ))}
                                                    <button onClick={() => { editor.chain().focus().unsetFontFamily().run(); setShowFontMenu(false); }} className="block w-full text-left px-3 py-1 hover:bg-slate-100 italic text-slate-500 text-xs border-t mt-1 pt-1">Default</button>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    <div className="relative">
                                        <button onClick={() => setShowSizeMenu(!showSizeMenu)} className="flex items-center space-x-1 px-1.5 py-0.5 bg-white border border-slate-300 hover:border-[#2b579a] rounded-sm text-xs min-w-[45px] justify-between h-[22px]">
                                            <span>{editor.getAttributes('textStyle').fontSize || '11'}</span>
                                            <ChevronDown className="w-3 h-3 text-slate-500" />
                                        </button>
                                        {showSizeMenu && (
                                            <>
                                                <div className="fixed inset-0 z-40" onClick={() => setShowSizeMenu(false)} />
                                                <div className="absolute top-full mt-1 left-0 bg-white border border-slate-300 rounded-sm shadow-xl z-50 h-64 overflow-y-auto w-16 py-1">
                                                    {['8', '9', '10', '11', '12', '14', '16', '18', '20', '22', '24', '26', '28', '36', '48', '72'].map(size => (
                                                        <button
                                                            key={size}
                                                            onClick={() => { editor.chain().focus().setFontSize(`${size}pt`).run(); setShowSizeMenu(false); }}
                                                            className="block w-full text-left px-2 py-0.5 hover:bg-slate-100 text-xs"
                                                        >
                                                            {size}
                                                        </button>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    <div className="w-px h-4 bg-slate-300 mx-1" />
                                    <RibbonButton icon={RemoveFormatting} label="Clear All Formatting" onClick={() => editor.chain().focus().unsetAllMarks().unsetFontFamily().unsetFontSize().run()} />
                                </div>

                                <div className="flex items-center space-x-0.5">
                                    <RibbonButton icon={Bold} label="Bold (Ctrl+B)" isActive={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} />
                                    <RibbonButton icon={Italic} label="Italic (Ctrl+I)" isActive={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} />
                                    <RibbonButton icon={UnderlineIcon} label="Underline (Ctrl+U)" isActive={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} />
                                    <RibbonButton icon={Strikethrough} label="Strikethrough" isActive={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()} />
                                    
                                    <div className="w-px h-4 bg-slate-300 mx-1" />
                                    
                                    {/* Text Highlight Color Split Button */}
                                    <div className="relative flex items-center group">
                                        <button 
                                            className="p-1 rounded-l hover:bg-slate-200 flex flex-col items-center" 
                                            onClick={() => editor.chain().focus().toggleHighlight({ color: editor.getAttributes('highlight').color || '#ffff00' }).run()}
                                        >
                                            <Highlighter className="w-[18px] h-[18px] text-[#2b579a]" style={{ borderBottom: `3px solid ${editor.getAttributes('highlight').color || '#ffff00'}` }} />
                                        </button>
                                        <button className="p-1 rounded-r hover:bg-slate-200 border-l border-transparent group-hover:border-slate-300" onClick={() => setShowHighlightMenu(!showHighlightMenu)}>
                                            <ChevronDown className="w-2.5 h-2.5 text-slate-700" />
                                        </button>
                                        {showHighlightMenu && (
                                            <>
                                                <div className="fixed inset-0 z-40" onClick={() => setShowHighlightMenu(false)} />
                                                <div className="absolute top-full mt-1 left-0 bg-white border border-slate-300 shadow-xl z-50 p-2 w-40 rounded-sm">
                                                    <div className="text-xs font-semibold mb-2 text-slate-700 border-b pb-1">Theme Colors</div>
                                                    <div className="flex flex-wrap gap-1">
                                                        {['#ffff00', '#00ff00', '#00ffff', '#ff00ff', '#0000ff', '#ff0000', '#000080', '#008080', '#008000', '#800080', '#800000', '#808000', '#808080', '#c0c0c0', '#000000'].map(color => (
                                                            <button
                                                                key={color}
                                                                className="w-5 h-5 border border-slate-300 hover:border-black"
                                                                style={{ backgroundColor: color }}
                                                                onClick={() => { editor.chain().focus().toggleHighlight({ color }).run(); setShowHighlightMenu(false); }}
                                                                title={color}
                                                            />
                                                        ))}
                                                    </div>
                                                    <button 
                                                        className="w-full text-left mt-2 text-xs hover:bg-slate-100 p-1"
                                                        onClick={() => { editor.chain().focus().unsetHighlight().run(); setShowHighlightMenu(false); }}
                                                    >
                                                        No Color
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {/* Text Color Split Button */}
                                    <div className="relative flex items-center group">
                                        <button 
                                            className="p-1 rounded-l hover:bg-slate-200 flex flex-col items-center"
                                            onClick={() => editor.chain().focus().setColor(editor.getAttributes('textStyle').color || '#000000').run()}
                                        >
                                            <Type className="w-[18px] h-[18px] text-[#2b579a]" style={{ borderBottom: `3px solid ${editor.getAttributes('textStyle').color || '#000000'}` }} />
                                        </button>
                                        <button className="p-1 rounded-r hover:bg-slate-200 border-l border-transparent group-hover:border-slate-300" onClick={() => setShowColorMenu(!showColorMenu)}>
                                            <ChevronDown className="w-2.5 h-2.5 text-slate-700" />
                                        </button>
                                        {showColorMenu && (
                                            <>
                                                <div className="fixed inset-0 z-40" onClick={() => setShowColorMenu(false)} />
                                                <div className="absolute top-full mt-1 left-0 bg-white border border-slate-300 shadow-xl z-50 p-2 w-56 rounded-sm">
                                                    <div className="text-xs font-semibold mb-2 text-slate-700 border-b pb-1">Theme Colors</div>
                                                    <div className="flex flex-wrap gap-0.5">
                                                        {standardColors.map(color => (
                                                            <button
                                                                key={color}
                                                                className="w-4 h-4 border border-transparent hover:border-black hover:scale-110 transition-transform"
                                                                style={{ backgroundColor: color }}
                                                                onClick={() => { editor.chain().focus().setColor(color).run(); setShowColorMenu(false); }}
                                                                title={color}
                                                            />
                                                        ))}
                                                    </div>
                                                    <button 
                                                        className="w-full text-left mt-2 text-xs hover:bg-slate-100 p-1 border-t"
                                                        onClick={() => { editor.chain().focus().unsetColor().run(); setShowColorMenu(false); }}
                                                    >
                                                        Automatic
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </RibbonGroup>

                        {/* Paragraph */}
                        <RibbonGroup title="Paragraph">
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center space-x-0.5">
                                    {/* Bullet List Split Button */}
                                    <div className="relative flex items-center group">
                                        <button 
                                            className={`p-1 rounded-l flex items-center justify-center transition-colors ${editor.isActive("bulletList") ? "bg-slate-300 outline outline-1 outline-slate-400" : "hover:bg-slate-200"}`}
                                            onClick={() => editor.chain().focus().toggleBulletList().run()}
                                        >
                                            <List className="w-[18px] h-[18px] text-[#2b579a]" />
                                        </button>
                                        <button className="p-1 rounded-r hover:bg-slate-200 border-l border-transparent group-hover:border-slate-300" onClick={() => setShowBulletMenu(!showBulletMenu)}>
                                            <ChevronDown className="w-2.5 h-2.5 text-slate-700" />
                                        </button>
                                        {showBulletMenu && (
                                            <>
                                                <div className="fixed inset-0 z-40" onClick={() => setShowBulletMenu(false)} />
                                                <div className="absolute top-full mt-1 left-0 bg-white border border-slate-300 shadow-xl z-50 p-2 w-48 rounded-sm">
                                                    <div className="text-xs font-semibold mb-2 text-slate-700 border-b pb-1">Bullet Library</div>
                                                    <div className="grid grid-cols-4 gap-2">
                                                        <button className="w-10 h-10 border border-slate-300 flex items-center justify-center hover:bg-indigo-50" onClick={() => { editor.chain().focus().toggleBulletList().run(); setShowBulletMenu(false); }}>
                                                            None
                                                        </button>
                                                        <button className="w-10 h-10 border border-slate-300 flex items-center justify-center hover:bg-indigo-50" onClick={() => { editor.chain().focus().toggleBulletList().run(); setShowBulletMenu(false); }}>
                                                            <div className="w-2 h-2 bg-black rounded-full" />
                                                        </button>
                                                        <button className="w-10 h-10 border border-slate-300 flex items-center justify-center hover:bg-indigo-50" onClick={() => { editor.chain().focus().toggleBulletList().run(); setShowBulletMenu(false); }}>
                                                            <div className="w-2 h-2 border border-black rounded-full" />
                                                        </button>
                                                        <button className="w-10 h-10 border border-slate-300 flex items-center justify-center hover:bg-indigo-50" onClick={() => { editor.chain().focus().toggleBulletList().run(); setShowBulletMenu(false); }}>
                                                            <div className="w-2 h-2 bg-black" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {/* Numbered List Split Button */}
                                    <div className="relative flex items-center group">
                                        <button 
                                            className={`p-1 rounded-l flex items-center justify-center transition-colors ${editor.isActive("orderedList") ? "bg-slate-300 outline outline-1 outline-slate-400" : "hover:bg-slate-200"}`}
                                            onClick={() => editor.chain().focus().toggleOrderedList().run()}
                                        >
                                            <ListOrdered className="w-[18px] h-[18px] text-[#2b579a]" />
                                        </button>
                                        <button className="p-1 rounded-r hover:bg-slate-200 border-l border-transparent group-hover:border-slate-300" onClick={() => setShowNumberMenu(!showNumberMenu)}>
                                            <ChevronDown className="w-2.5 h-2.5 text-slate-700" />
                                        </button>
                                        {showNumberMenu && (
                                            <>
                                                <div className="fixed inset-0 z-40" onClick={() => setShowNumberMenu(false)} />
                                                <div className="absolute top-full mt-1 left-0 bg-white border border-slate-300 shadow-xl z-50 p-2 w-48 rounded-sm">
                                                    <div className="text-xs font-semibold mb-2 text-slate-700 border-b pb-1">Numbering Library</div>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        <button className="h-12 border border-slate-300 flex items-center justify-center hover:bg-indigo-50 text-xs" onClick={() => { editor.chain().focus().toggleOrderedList().run(); setShowNumberMenu(false); }}>
                                                            None
                                                        </button>
                                                        <button className="h-12 border border-slate-300 flex flex-col items-center justify-center hover:bg-indigo-50 text-[10px]" onClick={() => { editor.chain().focus().toggleOrderedList().run(); setShowNumberMenu(false); }}>
                                                            <span>1. —</span>
                                                            <span>2. —</span>
                                                            <span>3. —</span>
                                                        </button>
                                                        <button className="h-12 border border-slate-300 flex flex-col items-center justify-center hover:bg-indigo-50 text-[10px]" onClick={() => { editor.chain().focus().toggleOrderedList().run(); setShowNumberMenu(false); }}>
                                                            <span>1) —</span>
                                                            <span>2) —</span>
                                                            <span>3) —</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    
                                    <div className="w-px h-4 bg-slate-300 mx-1" />
                                    
                                    <RibbonButton icon={OutdentIcon} label="Decrease Indent" onClick={() => editor.chain().focus().decreaseIndent().run()} />
                                    <RibbonButton icon={IndentIcon} label="Increase Indent" onClick={() => editor.chain().focus().increaseIndent().run()} />
                                </div>
                                <div className="flex items-center space-x-0.5">
                                    <RibbonButton icon={AlignLeft} label="Align Left" isActive={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()} />
                                    <RibbonButton icon={AlignCenter} label="Center" isActive={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()} />
                                    <RibbonButton icon={AlignRight} label="Align Right" isActive={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()} />
                                    <RibbonButton icon={AlignJustify} label="Justify" isActive={editor.isActive({ textAlign: "justify" })} onClick={() => editor.chain().focus().setTextAlign("justify").run()} />
                                </div>
                            </div>
                        </RibbonGroup>

                        {/* Styles (Simplified) */}
                        <RibbonGroup title="Styles">
                            <div className="flex bg-white border border-slate-300 p-0.5 space-x-1 h-[52px] overflow-hidden items-center">
                                <button className={`flex flex-col items-center justify-center w-16 h-full border border-transparent hover:border-blue-300 hover:bg-blue-50 ${!editor.isActive('heading') ? 'bg-blue-50/50 border-blue-200' : ''}`} onClick={() => editor.chain().focus().setParagraph().run()}>
                                    <span className="text-xs">AaBbCc</span>
                                    <span className="text-[10px] text-slate-500">Normal</span>
                                </button>
                                <button className={`flex flex-col items-center justify-center w-16 h-full border border-transparent hover:border-blue-300 hover:bg-blue-50 ${editor.isActive('heading', { level: 1 }) ? 'bg-blue-50/50 border-blue-200' : ''}`} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
                                    <span className="text-[14px] text-blue-700 font-semibold leading-tight">AaBb</span>
                                    <span className="text-[10px] text-slate-500">Heading 1</span>
                                </button>
                                <button className={`flex flex-col items-center justify-center w-16 h-full border border-transparent hover:border-blue-300 hover:bg-blue-50 ${editor.isActive('heading', { level: 2 }) ? 'bg-blue-50/50 border-blue-200' : ''}`} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
                                    <span className="text-sm text-blue-700 font-medium leading-tight">AaBbC</span>
                                    <span className="text-[10px] text-slate-500">Heading 2</span>
                                </button>
                                <button className={`flex flex-col items-center justify-center w-16 h-full border border-transparent hover:border-blue-300 hover:bg-blue-50 ${editor.isActive('heading', { level: 3 }) ? 'bg-blue-50/50 border-blue-200' : ''}`} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
                                    <span className="text-xs text-blue-700 font-medium leading-tight">AaBbCc</span>
                                    <span className="text-[10px] text-slate-500">Heading 3</span>
                                </button>
                            </div>
                        </RibbonGroup>
                    </>
                )}

                {activeTab !== "Home" && (
                    <RibbonGroup title={activeTab}>
                        <div className="flex space-x-2 p-2">
                            {activeTab === "Insert" && (
                                <>
                                    <div className="flex flex-col items-center justify-center p-1 px-3 hover:bg-slate-200 rounded cursor-pointer transition-colors" onClick={insertTable}>
                                        <TableIcon className="w-6 h-6 text-[#2b579a] mb-1" />
                                        <span className="text-xs text-slate-700">Table</span>
                                    </div>
                                    <div className="flex flex-col items-center justify-center p-1 px-3 hover:bg-slate-200 rounded cursor-pointer transition-colors" onClick={addImage}>
                                        <ImageIcon className="w-6 h-6 text-[#2b579a] mb-1" />
                                        <span className="text-xs text-slate-700">Pictures</span>
                                    </div>
                                    <div className="flex flex-col items-center justify-center p-1 px-3 hover:bg-slate-200 rounded cursor-pointer transition-colors" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
                                        <Minus className="w-6 h-6 text-[#2b579a] mb-1" />
                                        <span className="text-xs text-slate-700">Divider</span>
                                    </div>
                                    <div className="flex flex-col items-center justify-center p-1 px-3 hover:bg-slate-200 rounded cursor-pointer transition-colors" onClick={setLink}>
                                        <LinkIcon className="w-6 h-6 text-[#2b579a] mb-1" />
                                        <span className="text-xs text-slate-700">Link</span>
                                    </div>
                                </>
                            )}
                            {activeTab !== "Insert" && (
                                <div className="text-slate-400 text-sm flex items-center justify-center h-full px-4 italic">
                                    More {activeTab} options coming soon...
                                </div>
                            )}
                        </div>
                    </RibbonGroup>
                )}
            </div>
        </div>
    );
}
