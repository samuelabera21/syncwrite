import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Edit3 } from "lucide-react";
import { useSession } from "../../../lib/auth-client";

export function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const { data: session } = useSession();
    const navigate = useNavigate();

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <motion.nav 
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className={`fixed top-0 inset-x-0 z-50 flex items-center justify-center p-4 transition-all duration-300`}
        >
            <div 
                className={`flex items-center justify-between w-full max-w-5xl px-6 py-3 rounded-2xl transition-all duration-300 ${
                    scrolled 
                        ? "bg-slate-900/60 backdrop-blur-md border border-slate-700/50 shadow-2xl shadow-black/20" 
                        : "bg-transparent border border-transparent"
                }`}
            >
                {/* Logo */}
                <Link to="/" className="flex items-center space-x-2 group">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-shadow">
                        <Edit3 className="h-5 w-5" />
                    </div>
                    <span className="text-lg font-bold text-slate-100 tracking-tight">SyncWrite</span>
                </Link>

                {/* Right Actions */}
                <div className="flex items-center space-x-4">
                    {session ? (
                        <button 
                            onClick={() => navigate("/")}
                            className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
                        >
                            Go to Dashboard
                        </button>
                    ) : (
                        <Link 
                            to="/login"
                            className="text-sm font-medium text-slate-300 hover:text-white transition-colors hidden sm:block"
                        >
                            Log in
                        </Link>
                    )}
                    
                    <Link
                        to={session ? "/" : "/register"}
                        className="relative group px-4 py-2 text-sm font-medium text-white rounded-lg overflow-hidden bg-slate-800 border border-slate-700 transition-all hover:border-slate-600 shadow-lg"
                    >
                        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-indigo-500 to-violet-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <span className="relative z-10 flex items-center">
                            {session ? "Open App" : "Get Started"}
                        </span>
                    </Link>
                </div>
            </div>
        </motion.nav>
    );
}
