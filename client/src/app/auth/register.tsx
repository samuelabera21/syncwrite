import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signUp } from "../../lib/auth-client";
import { FileText } from "lucide-react";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";

export default function Register() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const { error: err } = await signUp.email({
                name,
                email,
                password,
            });

            if (err) {
                setError(err.message || "Failed to create account");
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
                    <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Create Account</h1>
                    <p className="text-sm text-slate-500 mt-1.5">Join SyncWrite for real-time collaboration</p>
                </div>

                {error && (
                    <div className="mb-6 rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-100">
                        {error}
                    </div>
                )}

                <form onSubmit={handleRegister} className="space-y-5">
                    <Input
                        label="Full Name"
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                    />

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
                        Create Account
                    </Button>
                </form>

                <p className="mt-8 text-center text-sm text-slate-500">
                    Already have an account?{" "}
                    <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}