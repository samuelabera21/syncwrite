import React, { useState, useEffect } from "react";
import { authClient } from "../../lib/auth-client";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Lock, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export default function ResetPassword() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token") || "";
    const navigate = useNavigate();

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!token) {
            setError("Invalid or missing reset token.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        if (password.length < 8) {
            setError("Password must be at least 8 characters long.");
            return;
        }

        setIsLoading(true);
        
        const { error } = await authClient.resetPassword({
            newPassword: password,
            token: token
        });

        setIsLoading(false);

        if (error) {
            setError(error.message || "Failed to reset password. The link might be expired.");
        } else {
            setIsSuccess(true);
            setTimeout(() => navigate("/login"), 3000);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-8 shadow-2xl"
            >
                {!isSuccess ? (
                    <>
                        <div className="mb-8 text-center">
                            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Reset Password</h1>
                            <p className="text-slate-400 mt-2 text-sm">Create a new secure password for your account.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1.5">
                                    New Password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                                        <Lock className="h-5 w-5" />
                                    </div>
                                    <input
                                        type="password"
                                        id="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full rounded-xl bg-slate-950 border border-slate-800 py-3 pl-10 pr-4 text-slate-200 placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-1.5">
                                    Confirm New Password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                                        <Lock className="h-5 w-5" />
                                    </div>
                                    <input
                                        type="password"
                                        id="confirmPassword"
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full rounded-xl bg-slate-950 border border-slate-800 py-3 pl-10 pr-4 text-slate-200 placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                                        placeholder="••••••••"
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
                                disabled={isLoading || !token}
                                className="w-full flex items-center justify-center rounded-xl bg-indigo-600 py-3 px-4 font-semibold text-white hover:bg-indigo-500 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Reset Password"}
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="text-center py-6">
                        <div className="flex justify-center mb-6">
                            <CheckCircle2 className="h-16 w-16 text-emerald-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-100 mb-2">Password Reset!</h2>
                        <p className="text-slate-400 text-sm mb-8">
                            Your password has been changed successfully. You are being redirected to login...
                        </p>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
