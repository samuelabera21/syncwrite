import React, { useRef, useState } from "react";
import { Download, Upload, FileText, FileCode, Printer, Info, Copy, X, FolderOpen, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import html2pdf from "html2pdf.js";
import TurndownService from "turndown";
import { marked } from "marked";
import { Editor } from "@tiptap/react";
import { useNavigate } from "react-router-dom";

interface FileMenuProps {
    editor: Editor | null;
    documentTitle: string;
    isOpen: boolean;
    onClose: () => void;
}

export function FileMenu({ editor, documentTitle, isOpen, onClose }: FileMenuProps) {
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    if (!isOpen) return null;

    const handleExportPDF = async () => {
        if (!editor) return;
        setIsExporting(true);
        try {
            const htmlContent = editor.getHTML();
            if (!htmlContent) throw new Error("Editor content not found");

            return new Promise<void>((resolve, reject) => {
                const iframe = document.createElement("iframe");
                iframe.style.position = "absolute";
                iframe.style.width = "800px";
                iframe.style.height = "1000px";
                iframe.style.left = "-9999px";
                document.body.appendChild(iframe);

                const iframeDoc = iframe.contentWindow?.document;
                if (!iframeDoc) {
                    document.body.removeChild(iframe);
                    return reject(new Error("Failed to create isolated rendering context"));
                }

                const handleMessage = (event: MessageEvent) => {
                    if (event.data?.type === 'pdf-done') {
                        window.removeEventListener('message', handleMessage);
                        document.body.removeChild(iframe);
                        toast.success("Exported to PDF successfully!");
                        resolve();
                    } else if (event.data?.type === 'pdf-error') {
                        window.removeEventListener('message', handleMessage);
                        document.body.removeChild(iframe);
                        reject(new Error(event.data.error));
                    }
                };
                window.addEventListener('message', handleMessage);

                iframeDoc.open();
                iframeDoc.write(`
                    <!DOCTYPE html>
                    <html>
                        <head>
                            <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
                            <style>
                                body { font-family: Arial, sans-serif; font-size: 12pt; line-height: 1.5; color: #000; padding: 40px; background: #fff; }
                                * { border-color: transparent; }
                            </style>
                        </head>
                        <body>
                            <div id="pdf-content">${htmlContent}</div>
                            <script>
                                window.onload = function() {
                                    try {
                                        const element = document.getElementById('pdf-content');
                                        const opt = {
                                            margin: 0.5,
                                            filename: '${(documentTitle || "document").replace(/'/g, "\\'")}.pdf',
                                            image: { type: 'jpeg', quality: 0.98 },
                                            html2canvas: { scale: 2, useCORS: true },
                                            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
                                        };
                                        html2pdf().set(opt).from(element).save().then(() => {
                                            window.parent.postMessage({ type: 'pdf-done' }, '*');
                                        }).catch(err => {
                                            window.parent.postMessage({ type: 'pdf-error', error: err.message || String(err) }, '*');
                                        });
                                    } catch (err) {
                                        window.parent.postMessage({ type: 'pdf-error', error: err.message || String(err) }, '*');
                                    }
                                };
                            </script>
                        </body>
                    </html>
                `);
                iframeDoc.close();
            });
        } catch (error: any) {
            console.error("PDF export failed:", error);
            toast.error(`Failed to export PDF: ${error.message || String(error)}`);
        } finally {
            setIsExporting(false);
            onClose();
        }
    };

    const handleExportMarkdown = () => {
        if (!editor) return;
        try {
            const html = editor.getHTML();
            const turndownService = new TurndownService({ headingStyle: 'atx' });
            const markdown = turndownService.turndown(html);
            
            const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `${documentTitle || "document"}.md`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            toast.success("Exported to Markdown successfully!");
        } catch (error) {
            console.error("Markdown export failed:", error);
            toast.error("Failed to export Markdown");
        } finally {
            onClose();
        }
    };

    const handleImportMarkdown = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !editor) return;
        
        setIsImporting(true);
        
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const markdown = e.target?.result as string;
                const html = await marked.parse(markdown);
                editor.commands.setContent(html);
                toast.success("Markdown imported successfully!");
            } catch (error) {
                console.error("Markdown import failed:", error);
                toast.error("Failed to import Markdown");
            } finally {
                setIsImporting(false);
                if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }
                onClose();
            }
        };
        reader.onerror = () => {
            toast.error("Failed to read file");
            setIsImporting(false);
            onClose();
        };
        reader.readAsText(file);
    };

    const handlePrint = () => {
        window.print();
        onClose();
    };

    const MenuItem = ({ icon: Icon, label, onClick, disabled = false }: any) => (
        <button
            onClick={onClick}
            disabled={disabled}
            className="flex items-center w-full px-6 py-3 text-left text-sm text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
            <Icon className="w-5 h-5 mr-4 text-slate-500" />
            <span className="font-medium">{label}</span>
        </button>
    );

    return (
        <>
            <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />
            <div className="absolute left-0 top-full mt-1 z-50 w-64 bg-white border border-slate-200 shadow-xl rounded-b-lg overflow-hidden flex flex-col py-2">
                <MenuItem 
                    icon={FolderOpen} 
                    label="Back to Dashboard" 
                    onClick={() => navigate('/')} 
                />
                
                <div className="h-px bg-slate-200 my-2" />

                <MenuItem 
                    icon={FileText} 
                    label={isExporting ? "Exporting PDF..." : "Export as PDF"} 
                    onClick={handleExportPDF} 
                    disabled={isExporting}
                />
                <MenuItem 
                    icon={FileCode} 
                    label="Export as Markdown" 
                    onClick={handleExportMarkdown} 
                />
                
                <div className="h-px bg-slate-200 my-2" />
                
                <MenuItem 
                    icon={Upload} 
                    label={isImporting ? "Importing..." : "Import Markdown"} 
                    onClick={() => fileInputRef.current?.click()} 
                    disabled={isImporting}
                />
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImportMarkdown}
                    accept=".md,.markdown"
                    className="hidden"
                />

                <div className="h-px bg-slate-200 my-2" />
                
                <MenuItem 
                    icon={Printer} 
                    label="Print" 
                    onClick={handlePrint} 
                />
            </div>
        </>
    );
}
