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
                className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-900/50 border border-slate-800 text-sm text-slate-300 mb-8 backdrop-blur-md"
            >
                <Sparkles className="h-4 w-4 text-indigo-400" />
                <span>SyncWrite is here</span>
            </motion.div>

            <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight text-white mb-8 max-w-4xl"
                style={{ lineHeight: 1.1 }}
            >
                Write together, <br className="hidden sm:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-400 animate-gradient-x">
                    in perfect sync.
                </span>
            </motion.h1>

            <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-lg sm:text-xl text-slate-400 mb-10 max-w-2xl leading-relaxed"
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
                    className="group relative flex items-center justify-center px-8 py-3.5 text-base font-semibold text-white rounded-xl bg-indigo-600 hover:bg-indigo-500 transition-all shadow-[0_0_40px_rgba(79,70,229,0.3)] hover:shadow-[0_0_60px_rgba(79,70,229,0.5)]"
                >
                    Start writing for free
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <a
                    href="#features"
                    className="px-8 py-3.5 text-base font-semibold text-slate-300 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:text-white transition-all"
                >
                    Explore Features
                </a>
            </motion.div>

        </section>
    );
}
