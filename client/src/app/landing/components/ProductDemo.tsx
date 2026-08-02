import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, Lock, Share2, MoreHorizontal } from "lucide-react";

export function ProductDemo() {
    const [text, setText] = useState("");
    const fullText = "Welcome to SyncWrite. This is a live demonstration of real-time collaboration. Start typing and see changes instantly synced across all devices.";
    
    useEffect(() => {
        let i = 0;
        const interval = setInterval(() => {
            setText(fullText.substring(0, i));
            i++;
            if (i > fullText.length) {
                setTimeout(() => { i = 0; }, 3000); // Reset after 3 seconds
            }
        }, 50);
        return () => clearInterval(interval);
    }, []);

    return (
        <section className="relative w-full max-w-5xl mx-auto px-6 py-10 z-10">
            <motion.div 
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
                className="relative rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-700/50 bg-white dark:bg-slate-900 shadow-2xl shadow-indigo-500/10 dark:shadow-black/50 transition-colors"
            >
                {/* Editor Header Mock */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-sm transition-colors">
                    <div className="flex items-center space-x-3">
                        <div className="flex space-x-1.5">
                            <div className="w-3 h-3 rounded-full bg-red-500/80" />
                            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                            <div className="w-3 h-3 rounded-full bg-green-500/80" />
                        </div>
                        <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-2 transition-colors" />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 transition-colors">Project_Proposal.md</span>
                        <div className="flex items-center text-xs text-slate-500 transition-colors">
                            <Lock className="h-3 w-3 mr-1" />
                            Private
                        </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                        <div className="flex -space-x-2">
                            <div className="w-6 h-6 rounded-full bg-indigo-500 border-2 border-white dark:border-slate-900 z-20 flex items-center justify-center text-[10px] font-bold text-white transition-colors">S</div>
                            <div className="w-6 h-6 rounded-full bg-pink-500 border-2 border-white dark:border-slate-900 z-10 flex items-center justify-center text-[10px] font-bold text-white transition-colors">A</div>
                        </div>
                        <div className="h-6 px-2 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center text-xs text-slate-600 dark:text-slate-300 transition-colors">
                            <Share2 className="h-3 w-3 mr-1.5" />
                            Share
                        </div>
                    </div>
                </div>

                {/* Editor Toolbar Mock */}
                <div className="flex items-center px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 space-x-2 transition-colors">
                    <div className="h-5 w-5 rounded bg-slate-200 dark:bg-slate-800 transition-colors" />
                    <div className="h-5 w-5 rounded bg-slate-200 dark:bg-slate-800 transition-colors" />
                    <div className="h-5 w-5 rounded bg-slate-200 dark:bg-slate-800 transition-colors" />
                    <div className="w-px h-4 bg-slate-200 dark:bg-slate-800 mx-2 transition-colors" />
                    <div className="h-5 w-20 rounded bg-slate-200 dark:bg-slate-800 transition-colors" />
                    <div className="h-5 w-16 rounded bg-slate-200 dark:bg-slate-800 transition-colors" />
                </div>

                {/* Editor Body Mock */}
                <div className="p-8 md:p-12 min-h-[400px] bg-white dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-200 text-lg relative transition-colors">
                    
                    <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-6 transition-colors">Q3 Project Proposal</h1>
                    
                    <div className="relative inline-block">
                        {text}
                        <motion.span 
                            animate={{ opacity: [1, 0] }}
                            transition={{ repeat: Infinity, duration: 0.8 }}
                            className="inline-block w-0.5 h-5 bg-indigo-500 ml-0.5 align-middle"
                        />
                        
                        {/* Fake collaborator cursor */}
                        <motion.div 
                            animate={{ 
                                x: [0, 50, 20, 100],
                                y: [0, 20, -10, 30] 
                            }}
                            transition={{ 
                                duration: 5, 
                                repeat: Infinity,
                                repeatType: "mirror",
                                ease: "easeInOut"
                            }}
                            className="absolute top-10 left-20 pointer-events-none"
                        >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-md">
                                <path d="M2.5 14.5L13.5 8.5L2.5 2.5V14.5Z" fill="#ec4899" />
                            </svg>
                            <div className="bg-pink-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap absolute top-4 left-2">
                                Alice
                            </div>
                        </motion.div>
                    </div>

                </div>
            </motion.div>
        </section>
    );
}
