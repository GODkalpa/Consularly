"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Check, MessageSquare, Mic, Paperclip, Send, Smile, Image as ImageIcon } from "lucide-react";
import Image from "next/image";

export default function B2BHeroSection() {
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        setIsLoaded(true);
    }, []);

    return (
        <section className="w-full bg-background py-16 md:py-24 overflow-hidden">
            <div className="container mx-auto px-4">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-16 lg:gap-24">
                    {/* Left Content */}
                    <div className="w-full lg:w-1/2 space-y-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={isLoaded ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.5 }}
                        >
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/80 border border-border">
                                <span className="flex h-2 w-2 rounded-full bg-primary"></span>
                                <span className="text-sm font-medium">For Consultancies in Nepal</span>
                            </div>
                            <h2 className="mt-4 text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1]">
                                Grow your students with AI-powered visa preparation
                            </h2>
                            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
                                Stay on top of every student's progress, interview performance, and visa application status. Automate mock interviews, track results, and provide personalized feedback to ensure success like never before.
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={isLoaded ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="space-y-6"
                        >
                            <h3 className="text-lg font-bold text-foreground">Key Features:</h3>
                            <ul className="space-y-6">
                                <li className="flex gap-4">
                                    <Check className="h-6 w-6 text-foreground shrink-0 mt-0.5" />
                                    <div>
                                        <strong className="text-foreground">Streamlined student tracking.</strong>
                                        <span className="text-muted-foreground ml-1">
                                            Monitor every student's journey from enrollment to visa approval, fostering efficient management & transparent progress updates.
                                        </span>
                                    </div>
                                </li>
                                <li className="flex gap-4">
                                    <Check className="h-6 w-6 text-foreground shrink-0 mt-0.5" />
                                    <div>
                                        <strong className="text-foreground">AI-powered mock interviews.</strong>
                                        <span className="text-muted-foreground ml-1">
                                            Choose between standard interview sets or customized sessions tailored to specific universities and countries.
                                        </span>
                                    </div>
                                </li>
                                <li className="flex gap-4">
                                    <Check className="h-6 w-6 text-foreground shrink-0 mt-0.5" />
                                    <div>
                                        <strong className="text-foreground">Works with your workflow.</strong>
                                        <span className="text-muted-foreground ml-1">
                                            Experience the convenience of effortless data synchronization as student performance metrics seamlessly integrate with your existing dashboard.
                                        </span>
                                    </div>
                                </li>
                            </ul>
                        </motion.div>
                    </div>

                    {/* Right Content - Mock UI */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={isLoaded ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.7, delay: 0.4 }}
                        className="w-full lg:w-1/2"
                    >
                        <div className="relative">
                            {/* Background Decor */}
                            <div className="absolute -inset-4 bg-gradient-to-tr from-primary/5 to-secondary/5 rounded-[2rem] blur-2xl" />

                            {/* Main Card */}
                            <div className="relative bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
                                {/* Header */}
                                <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
                                    <div className="flex items-center gap-3">
                                        <div className="h-3 w-3 rounded-full bg-red-500" />
                                        <div className="h-3 w-3 rounded-full bg-yellow-500" />
                                        <div className="h-3 w-3 rounded-full bg-green-500" />
                                    </div>
                                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                        <MessageSquare className="h-4 w-4" />
                                        Interview Session
                                    </div>
                                </div>

                                {/* Chat Content */}
                                <div className="p-6 space-y-6 bg-background/50 min-h-[400px]">
                                    {/* AI Message */}
                                    <div className="flex gap-4">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                            <span className="font-bold text-primary text-xs">AI</span>
                                        </div>
                                        <div className="space-y-2 max-w-[85%]">
                                            <div className="flex items-baseline justify-between">
                                                <span className="font-semibold text-sm">Visa Interviewer AI</span>
                                                <span className="text-xs text-muted-foreground">10:23 AM</span>
                                            </div>
                                            <div className="bg-muted/50 p-4 rounded-2xl rounded-tl-none text-sm leading-relaxed">
                                                <p>Let&apos;s discuss your study plans. Why did you choose this specific university for your Master&apos;s degree?</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Student Message */}
                                    <div className="flex gap-4">
                                        <div className="h-10 w-10 rounded-full bg-secondary/20 flex items-center justify-center shrink-0">
                                            <span className="font-bold text-secondary-foreground text-xs">SJ</span>
                                        </div>
                                        <div className="space-y-2 max-w-[85%]">
                                            <div className="flex items-baseline justify-between">
                                                <span className="font-semibold text-sm">Sarah Jenkins</span>
                                                <span className="text-xs text-muted-foreground">10:24 AM</span>
                                            </div>
                                            <div className="bg-background border border-border p-4 rounded-2xl rounded-tl-none text-sm leading-relaxed shadow-sm">
                                                <p>I chose this university because of its strong research focus in Artificial Intelligence. The curriculum aligns perfectly with my career goals.</p>
                                            </div>

                                            {/* Attachment/Context Card */}
                                            <div className="flex gap-3 mt-2">
                                                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border w-full max-w-xs">
                                                    <div className="h-10 w-10 bg-blue-500/10 rounded flex items-center justify-center shrink-0">
                                                        <span className="font-bold text-blue-600 text-xs">SOP</span>
                                                    </div>
                                                    <div className="flex flex-col overflow-hidden">
                                                        <span className="text-xs font-medium truncate">Statement of Purpose.pdf</span>
                                                        <span className="text-[10px] text-muted-foreground">2.4 MB</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Feedback Box */}
                                    <div className="flex gap-4">
                                        <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                                            <Check className="h-5 w-5 text-green-600" />
                                        </div>
                                        <div className="space-y-2 max-w-[85%]">
                                            <div className="flex items-baseline justify-between">
                                                <span className="font-semibold text-sm">Analysis</span>
                                                <span className="text-xs text-muted-foreground">Just now</span>
                                            </div>
                                            <div className="bg-green-500/5 border border-green-500/20 p-4 rounded-2xl rounded-tl-none text-sm leading-relaxed">
                                                <p className="text-green-700 dark:text-green-400">Great answer! You clearly connected the university&apos;s strengths to your personal goals. Confidence score: 92%</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Input Area */}
                                <div className="p-4 border-t border-border bg-background">
                                    <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg border border-border">
                                        <div className="flex gap-1 px-2 border-r border-border">
                                            <button className="p-1.5 hover:bg-muted rounded-md transition-colors text-muted-foreground">
                                                <Paperclip className="h-4 w-4" />
                                            </button>
                                            <button className="p-1.5 hover:bg-muted rounded-md transition-colors text-muted-foreground">
                                                <ImageIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Type your feedback..."
                                            className="flex-1 bg-transparent border-none focus:outline-none text-sm px-2"
                                        />
                                        <button className="p-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                                            <Send className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Floating Badge */}
                            <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={isLoaded ? { scale: 1, opacity: 1 } : {}}
                                transition={{ delay: 1, type: "spring" }}
                                className="absolute -right-6 top-1/2 -translate-y-1/2 bg-red-500 text-white p-3 rounded-full shadow-lg hidden lg:block"
                            >
                                <MessageSquare className="h-6 w-6" />
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
