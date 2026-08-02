import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { authClient } from "../../lib/auth-client";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        if (!token) {
            setStatus("error");
            setMessage("Invalid or missing verification token.");
            return;
        }

        const verify = async () => {
            const { data, error } = await authClient.verifyEmail({
                query: { token }
            });
            
            if (error) {
                setStatus("error");
                setMessage(error.message || "Failed to verify email. The link may have expired.");
            } else {
                setStatus("success");
                setMessage("Your email has been successfully verified!");
                setTimeout(() => navigate("/"), 3000);
            }
        };

        verify();
    }, [token, navigate]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-8 shadow-2xl text-center"
            >
                <div className="mb-6 flex justify-center">
                    {status === "loading" && <Loader2 className="h-12 w-12 text-indigo-500 animate-spin" />}
                    {status === "success" && <CheckCircle className="h-12 w-12 text-emerald-500" />}
                    {status === "error" && <XCircle className="h-12 w-12 text-rose-500" />}
                </div>

                <h1 className="mb-2 text-2xl font-bold text-slate-100 tracking-tight">
                    {status === "loading" && "Verifying Email"}
                    {status === "success" && "Email Verified"}
                    {status === "error" && "Verification Failed"}
                </h1>
                
                <p className="text-slate-400 mb-8">{status === "loading" ? "Please wait a moment while we verify your email address..." : message}</p>
                
                {status !== "loading" && (
                    <button
                        onClick={() => navigate("/")}
                        className="w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-500 transition-colors"
                    >
                        Return to App
                    </button>
                )}
            </motion.div>
        </div>
    );
}
