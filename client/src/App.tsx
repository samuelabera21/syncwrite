import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useSession } from "./lib/auth-client";

import Login from "./app/auth/login";
import Register from "./app/auth/register";
import Dashboard from "./app/dashboard/index";
import Editor from "./app/editor/index";

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
                <Route
                    path="/"
                    element={session ? <Dashboard /> : <Navigate to="/login" />}
                />
                <Route
                    path="/document/:id"
                    element={session ? <Editor /> : <Navigate to="/login" />}
                />
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </Router>
    );
}