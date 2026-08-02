import React, { useState } from "react";
import { authClient } from "../../lib/auth-client";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        
        const { error } = await authClient.requestPasswordReset({
            email,
            redirectTo: "http://localhost:5173/reset-password",
        });

        setIsLoading(false);

        if (error) {
            setError(error.message || "Something went wrong. Please try again.");
        } else {
            setIsSent(true);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-8 shadow-2xl"
            >
                {!isSent ? (
                    <>
                        <div className="mb-8 text-center">
                            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Forgot Password</h1>
                            <p className="text-slate-400 mt-2 text-sm">Enter your email address to receive a password reset link.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1.5">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                                        <Mail className="h-5 w-5" />
                                    </div>
                                    <input
                                        type="email"
                                        id="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full rounded-xl bg-slate-950 border border-slate-800 py-3 pl-10 pr-4 text-slate-200 placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                                        placeholder="name@example.com"
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-4">
                                    <p className="text-sm text-rose-400 font-medium">{error}</p>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex items-center justify-center rounded-xl bg-indigo-600 py-3 px-4 font-semibold text-white hover:bg-indigo-500 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Send Reset Link"}
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="text-center py-6">
                        <div className="flex justify-center mb-6">
                            <CheckCircle2 className="h-16 w-16 text-emerald-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-100 mb-2">Check your inbox</h2>
                        <p className="text-slate-400 text-sm mb-8">
                            We have sent a password reset link to <span className="font-semibold text-slate-300">{email}</span>.
                            <br/><br/>
                            <span className="text-xs text-indigo-400">(Dev Note: Check the backend server console if testing without email credentials)</span>
                        </p>
                    </div>
                )}

                <div className="mt-8 text-center border-t border-slate-800 pt-6">
                    <Link to="/login" className="inline-flex items-center text-sm font-medium text-slate-400 hover:text-indigo-400 transition-colors">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Login
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}
