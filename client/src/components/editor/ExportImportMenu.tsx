import React, { useRef, useState } from "react";
import { Download, Upload, MoreHorizontal, FileText, FileCode, Loader2 } from "lucide-react";
import { Button } from "../ui/Button";
import toast from "react-hot-toast";

// We'll lazy import the heavy libraries or use dynamic imports, but since they are small, standard imports work.
import html2pdf from "html2pdf.js";
import TurndownService from "turndown";
import { marked } from "marked";
import { Editor } from "@tiptap/react";

interface ExportImportMenuProps {
    editor: Editor | null;
    documentTitle: string;
}

export function ExportImportMenu({ editor, documentTitle }: ExportImportMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleExportPDF = async () => {
        if (!editor) return;
        setIsExporting(true);
        setIsOpen(false);
        try {
            const htmlContent = editor.getHTML();
            if (!htmlContent) throw new Error("Editor content not found");

            // To completely avoid Tailwind's oklch() color variables crashing html2canvas,
            // we must not only render the content in an iframe, but RUN html2canvas inside the iframe.
            // html2canvas parses the global document.styleSheets of the window it runs in.
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
        }
    };

    const handleExportMarkdown = () => {
        if (!editor) return;
        setIsOpen(false);
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
        }
    };

    const handleImportMarkdown = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !editor) return;
        
        setIsImporting(true);
        setIsOpen(false);
        
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const markdown = e.target?.result as string;
                // Parse markdown to HTML (await because marked might be async in some configurations, though usually sync)
                const html = await marked.parse(markdown);
                
                // Inject the HTML into the editor. 
                // Because TipTap uses Yjs natively, setContent will sync this automatically to all clients!
                editor.commands.setContent(html);
                
                toast.success("Markdown imported successfully!");
            } catch (error) {
                console.error("Markdown import failed:", error);
                toast.error("Failed to import Markdown");
            } finally {
                setIsImporting(false);
                // Reset file input
                if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }
            }
        };
        reader.onerror = () => {
            toast.error("Failed to read file");
            setIsImporting(false);
        };
        reader.readAsText(file);
    };

    return (
        <div className="relative">
            <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(!isOpen)}
                className="hidden sm:flex text-slate-600"
                disabled={isExporting || isImporting}
            >
                {isExporting || isImporting ? (
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                ) : (
                    <MoreHorizontal className="h-4 w-4 mr-1.5" />
                )}
                <span>Tools</span>
            </Button>

            {/* Mobile simplified button */}
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(!isOpen)}
                className="sm:hidden text-slate-600"
                disabled={isExporting || isImporting}
            >
                {isExporting || isImporting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                    <MoreHorizontal className="h-5 w-5" />
                )}
            </Button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 top-10 z-50 w-48 rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden py-1">
                        <button
                            onClick={handleExportPDF}
                            className="flex w-full items-center px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                            <FileText className="h-4 w-4 mr-2.5 text-slate-400" />
                            Export to PDF
                        </button>
                        <button
                            onClick={handleExportMarkdown}
                            className="flex w-full items-center px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                            <FileCode className="h-4 w-4 mr-2.5 text-slate-400" />
                            Export to Markdown
                        </button>
                        <div className="border-t border-slate-100 my-1"></div>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex w-full items-center px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                            <Upload className="h-4 w-4 mr-2.5 text-slate-400" />
                            Import Markdown
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImportMarkdown}
                            accept=".md,.markdown"
                            className="hidden"
                        />
                    </div>
                </>
            )}
        </div>
    );
}
