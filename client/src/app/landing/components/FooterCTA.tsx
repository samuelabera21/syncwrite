import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export function FooterCTA() {
    return (
        <section className="w-full relative overflow-hidden py-32 mt-20 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 transition-colors">
            
            {/* Background glow */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-t from-indigo-100/80 dark:from-indigo-900/40 to-transparent blur-[100px] pointer-events-none transition-colors" />
            
            <div className="relative w-full max-w-4xl mx-auto px-6 text-center z-10">
                <motion.h2 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-4xl md:text-6xl font-bold text-slate-900 dark:text-white mb-8 tracking-tight transition-colors"
                >
                    Stop sending documents back and forth.
                </motion.h2>
                
                <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="text-xl text-slate-600 dark:text-slate-400 mb-12 max-w-2xl mx-auto transition-colors"
                >
                    Join thousands of teams who have already switched to a faster, more collaborative way of writing.
                </motion.p>
                
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    <Link 
                        to="/register"
                        className="inline-flex items-center justify-center px-10 py-4 text-lg font-semibold text-white rounded-xl bg-indigo-600 hover:bg-indigo-500 transition-all shadow-lg hover:shadow-indigo-500/30 group"
                    >
                        Get Started for Free
                        <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </motion.div>

                <div className="mt-32 pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between text-sm text-slate-500 transition-colors">
                    <div className="flex items-center space-x-2 mb-4 md:mb-0">
                        <div className="w-5 h-5 rounded bg-indigo-500 flex items-center justify-center">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M12 19l7-7 3 3-7 7-3-3z"></path><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path><path d="M2 2l7.586 7.586"></path><circle cx="11" cy="11" r="2"></circle></svg>
                        </div>
                        <span className="font-semibold text-slate-700 dark:text-slate-300 transition-colors">SyncWrite</span>
                        <span>© 2026. All rights reserved.</span>
                    </div>
                    <div className="flex space-x-6">
                        <a href="#" className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors">Privacy</a>
                        <a href="#" className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors">Terms</a>
                        <a href="#" className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors">Twitter</a>
                    </div>
                </div>
            </div>
        </section>
    );
}
