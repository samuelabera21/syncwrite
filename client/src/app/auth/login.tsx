import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signIn } from "../../lib/auth-client";
import { FileText } from "lucide-react";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

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

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm border border-slate-200/60">
                <div className="flex flex-col items-center mb-8">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white mb-4 shadow-sm">
                        <FileText className="h-6 w-6" />
                    </div>
                    <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Welcome to SyncWrite</h1>
                    <p className="text-sm text-slate-500 mt-1.5">Sign in to access your collaborative documents</p>
                </div>

                {error && (
                    <div className="mb-6 rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-100">
                        {error}
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

                    <Input
                        label="Password"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                    />

                    <Button
                        type="submit"
                        isLoading={loading}
                        className="w-full mt-2"
                    >
                        Sign In
                    </Button>
                </form>

                <p className="mt-8 text-center text-sm text-slate-500">
                    Don't have an account?{" "}
                    <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
                        Create account
                    </Link>
                </p>
            </div>
        </div>
    );
}