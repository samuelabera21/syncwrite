import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";

export function Hero() {
    return (
        <section className="relative w-full max-w-6xl mx-auto px-6 pt-32 pb-20 flex flex-col items-center text-center">

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-300 mb-8 dark:backdrop-blur-md transition-colors"
            >
                <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <span>SyncWrite is here</span>
            </motion.div>

            <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 dark:text-slate-50 mb-6 transition-colors"
            >
                Write together, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                    think as one.
                </span>
            </motion.h1>

            <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-2xl leading-relaxed transition-colors"
            >
                The lightning-fast collaborative editor for modern teams.
                Experience real-time presence, rich text, and granular permissions without the clutter.
            </motion.p>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="flex flex-col sm:flex-row items-center gap-4"
            >
                <Link
                    to="/register"
                    className="inline-flex h-12 items-center justify-center rounded-lg bg-indigo-600 px-8 text-sm font-medium text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all dark:focus:ring-offset-slate-950"
                >
                    Start writing for free
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                    to="/login"
                    className="inline-flex h-12 items-center justify-center rounded-lg border border-slate-300 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 px-8 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white dark:backdrop-blur-md transition-all"
                >
                    Explore Features
                </Link>
            </motion.div>

        </section>
    );
}
