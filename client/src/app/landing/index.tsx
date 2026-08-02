import React, { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";
import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { ProductDemo } from "./components/ProductDemo";
import { Features } from "./components/Features";
import { FooterCTA } from "./components/FooterCTA";

export default function Landing() {
    const [showBackToTop, setShowBackToTop] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setShowBackToTop(window.scrollY > 300);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 font-sans selection:bg-indigo-500/30 transition-colors">
            <Navbar />
            
            <main className="relative flex flex-col items-center overflow-hidden pt-24">
                {/* Background glow effects */}
                <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-indigo-500/10 dark:bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none transition-colors" />
                <div className="absolute top-[40%] right-[-10%] w-[500px] h-[500px] bg-violet-500/10 dark:bg-violet-600/10 blur-[100px] rounded-full pointer-events-none transition-colors" />

                <Hero />
                
                <ProductDemo />

                <Features />
                
                <FooterCTA />
            </main>

            {/* Back to Top Button */}
            <button
                onClick={scrollToTop}
                className={`fixed bottom-8 right-8 p-3 rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 transition-all z-50 flex items-center justify-center ${
                    showBackToTop ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"
                }`}
                aria-label="Back to top"
            >
                <ArrowUp className="h-5 w-5" />
            </button>
        </div>
    );
}
