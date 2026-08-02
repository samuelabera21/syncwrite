import React from "react";
import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { ProductDemo } from "./components/ProductDemo";
import { Features } from "./components/Features";
import { FooterCTA } from "./components/FooterCTA";

export default function Landing() {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-indigo-500/30">
            <Navbar />
            
            <main className="relative flex flex-col items-center overflow-hidden pt-24">
                {/* Background glow effects */}
                <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none" />
                <div className="absolute top-[40%] right-[-10%] w-[500px] h-[500px] bg-violet-600/10 blur-[100px] rounded-full pointer-events-none" />

                <Hero />
                
                <ProductDemo />

                <Features />
                
                <FooterCTA />
            </main>
        </div>
    );
}
