'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Info, Calendar, HelpCircle, CheckCircle2, ChevronRight, FileText } from 'lucide-react';
import { Button } from '@/components/livekit/button';

export const ActionCenter = () => {
    const [showSummary, setShowSummary] = useState(false);
    const [activeAction, setActiveAction] = useState<string | null>(null);

    // Simulate conversation completion trigger
    useEffect(() => {
        const timer = setTimeout(() => {
            setShowSummary(true);
        }, 10000); // Show summary after 10 seconds for demo
        return () => clearTimeout(timer);
    }, []);

    const actions = [
        { id: 'qna', label: 'QNA', icon: HelpCircle, color: 'text-blue-400', bg: 'bg-blue-400/10' },
        { id: 'info', label: 'Know more about Hosla', icon: Info, color: 'text-teal-400', bg: 'bg-teal-400/10' },
        { id: 'callback', label: 'Schedule a callback', icon: Calendar, color: 'text-amber-400', bg: 'bg-amber-400/10' },
    ];

    const handleAction = (id: string) => {
        setActiveAction(id);
        // In a real app, this would trigger a modal or API call
        setTimeout(() => setActiveAction(null), 2000);
    };

    return (
        <div className="flex h-full w-full flex-col gap-6 p-6">
            {/* Live Status / Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <h3 className="text-lg font-semibold tracking-tight text-white">Hosla Assistant</h3>
                <div className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 ring-1 ring-white/10">
                    <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                    </span>
                    <span className="text-[10px] font-medium uppercase tracking-wider text-emerald-400">Active</span>
                </div>
            </div>

            {/* Summary Card (Conditional) */}
            <AnimatePresence>
                {showSummary && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 backdrop-blur-sm">
                            <div className="mb-3 flex items-center gap-2 text-amber-400">
                                <FileText className="h-4 w-4" />
                                <span className="text-xs font-bold uppercase tracking-wider">Conversation Summary</span>
                            </div>
                            <p className="text-sm leading-relaxed text-muted-foreground/90">
                                User is inquiring about premium care packages for elderly parents.
                                Interested in daily check-ins and medical companionship.
                                All initial queries answered.
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Actions Grid */}
            <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground/50">Suggested Actions</h4>
                <div className="grid gap-3">
                    {actions.map((action) => (
                        <motion.button
                            key={action.id}
                            whileHover={{ scale: 1.02, backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleAction(action.id)}
                            className="group relative flex items-center gap-4 overflow-hidden rounded-xl border border-white/5 bg-white/5 p-4 text-left transition-all hover:border-white/10 hover:shadow-lg"
                        >
                            <div className={`rounded-lg p-2.5 ${action.bg} ${action.color} transition-colors group-hover:bg-white/10`}>
                                <action.icon className="h-5 w-5" />
                            </div>
                            <div className="flex flex-1 flex-col gap-0.5">
                                <span className="font-medium text-gray-200 group-hover:text-white">{action.label}</span>
                                <span className="text-[10px] text-muted-foreground">Click to execute</span>
                            </div>

                            {activeAction === action.id ? (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="rounded-full bg-green-500/20 p-1"
                                >
                                    <CheckCircle2 className="h-5 w-5 text-green-400" />
                                </motion.div>
                            ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground/50 transition-all group-hover:translate-x-1 group-hover:text-white" />
                            )}
                        </motion.button>
                    ))}
                </div>
            </div>
        </div>
    );
};
