/// <reference types="vite/client" />
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signIn, authClient } from "../../lib/auth-client";
import { FileText, ArrowLeft } from "lucide-react";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { ThemeToggle } from "../../components/shared/ThemeToggle";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const [resendLoading, setResendLoading] = useState(false);
    const [resendSuccess, setResendSuccess] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const { error: err } = await signIn.email({
                email,
                password,
            });

            if (err) {
                setError(err.message || "Failed to sign in");
            } else {
                navigate("/");
            }
        } catch (err: any) {
            setError("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    const handleResendVerification = async () => {
        setResendLoading(true);
        try {
            await authClient.sendVerificationEmail({
                email,
                callbackURL: `${import.meta.env.VITE_FRONTEND_URL || "http://localhost:5173"}/login`
            });
            setResendSuccess(true);
        } catch (e) {
            setError("Failed to resend verification email");
        } finally {
            setResendLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 font-sans selection:bg-indigo-500/30 transition-colors">
            <Link to="/" className="absolute top-8 left-8 flex items-center text-sm font-medium text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
            </Link>
            <div className="absolute top-8 right-8">
                <ThemeToggle />
            </div>
            <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900/50 p-8 shadow-sm dark:shadow-[0_0_40px_rgba(79,70,229,0.1)] border border-slate-200/60 dark:border-slate-800 dark:backdrop-blur-md transition-colors">
                <div className="flex flex-col items-center mb-8">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 dark:bg-indigo-600/20 text-white dark:text-indigo-400 mb-4 shadow-sm dark:border dark:border-indigo-500/20">
                        <FileText className="h-6 w-6" />
                    </div>
                    <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50 tracking-tight transition-colors">Welcome to SyncWrite</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 transition-colors">Sign in to access your collaborative documents</p>
                </div>

                {error && (
                    <div className="mb-6 rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-100 flex flex-col gap-2">
                        <span>{error}</span>
                        {error.toLowerCase().includes("not verified") && (
                            <Button 
                                type="button" 
                                onClick={handleResendVerification}
                                isLoading={resendLoading}
                                disabled={resendSuccess}
                                className="w-full mt-2"
                            >
                                {resendSuccess ? "Verification Sent! Check your email." : "Resend Verification Email"}
                            </Button>
                        )}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-5">
                    <Input
                        label="Email Address"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com"
                    />

                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
                            <Link to="/forgot-password" className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">
                                Forgot password?
                            </Link>
                        </div>
                        <Input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                        />
                    </div>

                    <Button
                        type="submit"
                        isLoading={loading}
                        className="w-full mt-2"
                    >
                        Sign In
                    </Button>
                </form>

                <div className="mt-6">
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="bg-white dark:bg-slate-900 px-2 text-slate-500 dark:text-slate-400 transition-colors">Or continue with</span>
                        </div>
                    </div>

                    <div className="mt-6">
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full flex items-center justify-center gap-2 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-200 dark:hover:bg-slate-700/50 dark:hover:text-white transition-colors"
                            onClick={async () => {
                                setLoading(true);
                                try {
                                    await signIn.social({
                                        provider: "google",
                                        callbackURL: `${import.meta.env.VITE_FRONTEND_URL || "http://localhost:5173"}/`,
                                    });
                                } catch (err) {
                                    setError("Failed to sign in with Google");
                                } finally {
                                    setLoading(false);
                                }
                            }}
                            disabled={loading}
                        >
                            <svg className="h-5 w-5" viewBox="0 0 24 24">
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    fill="#EA4335"
                                />
                            </svg>
                            Google
                        </Button>
                    </div>
                </div>

                <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400 transition-colors">
                    Don't have an account?{" "}
                    <Link to="/register" className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">
                        Create account
                    </Link>
                </p>
            </div>
        </div>
    );
}