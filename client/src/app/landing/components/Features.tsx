import React from "react";
import { motion } from "framer-motion";
import { Zap, Shield, FileOutput, Users } from "lucide-react";

const features = [
    {
        title: "Real-time Syncing",
        description: "Built on Yjs and WebSockets, changes appear on everyone's screen with absolute zero perceptible latency.",
        icon: <Zap className="h-6 w-6 text-yellow-400" />,
        color: "from-yellow-500/20 to-orange-500/20"
    },
    {
        title: "Granular Permissions",
        description: "Role-based access control (RBAC). Invite users as Viewers, Commenters, Editors, or co-Owners with a single click.",
        icon: <Shield className="h-6 w-6 text-green-400" />,
        color: "from-green-500/20 to-emerald-500/20"
    },
    {
        title: "Export Anywhere",
        description: "Flawlessly export your rich-text documents to standardized Markdown or high-quality PDF files instantly.",
        icon: <FileOutput className="h-6 w-6 text-pink-400" />,
        color: "from-pink-500/20 to-rose-500/20"
    },
    {
        title: "Live Presence",
        description: "See exactly who is online, where their cursor is, and what they are typing in real-time.",
        icon: <Users className="h-6 w-6 text-blue-400" />,
        color: "from-blue-500/20 to-cyan-500/20"
    }
];

export function Features() {
    return (
        <section id="features" className="w-full max-w-6xl mx-auto px-6 py-32 relative">
            
            <div className="text-center mb-20">
                <motion.h2 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight"
                >
                    Everything you need to <br className="hidden sm:block" />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
                        collaborate flawlessly.
                    </span>
                </motion.h2>
                <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="text-lg text-slate-400 max-w-2xl mx-auto"
                >
                    We've stripped away the noise so your team can focus on what matters: the content.
                </motion.p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {features.map((feature, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ duration: 0.5, delay: idx * 0.1 }}
                        className="group relative rounded-3xl border border-slate-800 bg-slate-900/50 p-8 hover:bg-slate-800/50 transition-colors overflow-hidden"
                    >
                        <div className={`absolute -right-20 -top-20 w-64 h-64 bg-gradient-to-br ${feature.color} blur-[80px] rounded-full opacity-50 group-hover:opacity-100 transition-opacity`} />
                        
                        <div className="relative z-10">
                            <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-6 shadow-lg">
                                {feature.icon}
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">{feature.title}</h3>
                            <p className="text-slate-400 leading-relaxed">
                                {feature.description}
                            </p>
                        </div>
                    </motion.div>
                ))}
            </div>

        </section>
    );
}
