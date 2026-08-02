import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useSession } from "./lib/auth-client";
import { Toaster } from "react-hot-toast";

import Login from "./app/auth/login";
import { ThemeProvider } from "./contexts/ThemeContext";
import Register from "./app/auth/register";
import VerifyEmail from "./app/auth/VerifyEmail";
import ForgotPassword from "./app/auth/ForgotPassword";
import ResetPassword from "./app/auth/ResetPassword";
import Dashboard from "./app/dashboard/index";
import Editor from "./app/editor/index";
import Landing from "./app/landing/index";

export default function App() {
    const { data: session, isPending } = useSession();

    if (isPending) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-600">
                Loading SyncWrite...
            </div>
        );
    }

    return (
        <ThemeProvider>
            <Router>
                <Routes>
                    <Route
                        path="/login"
                        element={!session ? <Login /> : <Navigate to="/" />}
                    />
                    <Route
                        path="/register"
                        element={!session ? <Register /> : <Navigate to="/" />}
                    />
                    <Route path="/verify-email" element={<VerifyEmail />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route
                        path="/"
                        element={session ? <Dashboard /> : <Landing />}
                    />
                    <Route
                        path="/document/:id"
                        element={session ? <Editor /> : <Navigate to="/login" />}
                    />
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
                <Toaster position="bottom-right" />
            </Router>
        </ThemeProvider>
    );
}