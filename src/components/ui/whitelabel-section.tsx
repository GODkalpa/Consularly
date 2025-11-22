"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Check, Globe, Mail, Image as ImageIcon, LayoutDashboard, Palette } from "lucide-react";

export default function WhitelabelSection() {
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        setIsLoaded(true);
    }, []);

    return (
        <section className="w-full bg-background py-16 md:py-24 overflow-hidden">
            <div className="container mx-auto px-4">
                <div className="flex flex-col lg:flex-row-reverse items-center justify-between gap-16 lg:gap-24">
                    {/* Left Content (now on Right for alternation) */}
                    <div className="w-full lg:w-1/2 space-y-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={isLoaded ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.5 }}
                        >
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/80 border border-border">
                                <span className="flex h-2 w-2 rounded-full bg-primary"></span>
                                <span className="text-sm font-medium">Whitelabel Solution</span>
                            </div>
                            <h2 className="mt-4 text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1]">
                                Your Brand, Our Technology
                            </h2>
                            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
                                Establish your consultancy&apos;s digital presence with a fully branded experience. We provide the infrastructure, you provide the brand.
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={isLoaded ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="space-y-6"
                        >
                            <h3 className="text-lg font-bold text-foreground">Everything you need:</h3>
                            <ul className="space-y-4">
                                <li className="flex gap-4 items-start">
                                    <div className="mt-1 bg-primary/10 p-2 rounded-lg">
                                        <Globe className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <strong className="text-foreground block">Custom Sub-domain</strong>
                                        <span className="text-muted-foreground text-sm">
                                            Get your own dedicated web address (e.g., yourbrand.consularly.com).
                                        </span>
                                    </div>
                                </li>
                                <li className="flex gap-4 items-start">
                                    <div className="mt-1 bg-primary/10 p-2 rounded-lg">
                                        <Mail className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <strong className="text-foreground block">Branded Emails</strong>
                                        <span className="text-muted-foreground text-sm">
                                            Send automated notifications and updates from your own email address.
                                        </span>
                                    </div>
                                </li>
                                <li className="flex gap-4 items-start">
                                    <div className="mt-1 bg-primary/10 p-2 rounded-lg">
                                        <Palette className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <strong className="text-foreground block">Logo & Favicon</strong>
                                        <span className="text-muted-foreground text-sm">
                                            Upload your agency&apos;s logo and favicon for a consistent brand identity.
                                        </span>
                                    </div>
                                </li>
                                <li className="flex gap-4 items-start">
                                    <div className="mt-1 bg-primary/10 p-2 rounded-lg">
                                        <LayoutDashboard className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <strong className="text-foreground block">Custom Dashboard</strong>
                                        <span className="text-muted-foreground text-sm">
                                            A fully branded admin and student dashboard tailored to your agency.
                                        </span>
                                    </div>
                                </li>
                            </ul>
                        </motion.div>
                    </div>

                    {/* Right Content - Mock UI (now on Left) */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={isLoaded ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.7, delay: 0.4 }}
                        className="w-full lg:w-1/2"
                    >
                        <div className="relative">
                            {/* Background Decor */}
                            <div className="absolute -inset-4 bg-gradient-to-bl from-primary/5 to-secondary/5 rounded-[2rem] blur-2xl" />

                            {/* Browser Window Mockup */}
                            <div className="relative bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
                                {/* Browser Toolbar */}
                                <div className="flex items-center gap-4 px-4 py-3 border-b border-border bg-muted/50">
                                    <div className="flex gap-1.5">
                                        <div className="h-3 w-3 rounded-full bg-red-500/80" />
                                        <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                                        <div className="h-3 w-3 rounded-full bg-green-500/80" />
                                    </div>
                                    <div className="flex-1 bg-background border border-border rounded-md px-3 py-1.5 text-xs text-muted-foreground flex items-center gap-2">
                                        <Globe className="h-3 w-3" />
                                        <span>https://<span className="text-foreground font-medium">global-edu</span>.consularly.com</span>
                                    </div>
                                </div>

                                {/* Dashboard Preview */}
                                <div className="bg-background min-h-[400px] p-6">
                                    {/* Navbar Mock */}
                                    <div className="flex items-center justify-between mb-8 pb-4 border-b border-border/50">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                                                <span className="text-primary-foreground font-bold text-sm">GE</span>
                                            </div>
                                            <span className="font-bold text-lg">Global Edu</span>
                                        </div>
                                        <div className="flex gap-4">
                                            <div className="h-8 w-8 rounded-full bg-muted" />
                                        </div>
                                    </div>

                                    {/* Dashboard Content Grid */}
                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 space-y-2">
                                            <div className="text-sm text-muted-foreground">Total Students</div>
                                            <div className="text-2xl font-bold text-primary">1,248</div>
                                        </div>
                                        <div className="p-4 rounded-xl bg-secondary/5 border border-secondary/10 space-y-2">
                                            <div className="text-sm text-muted-foreground">Visa Success</div>
                                            <div className="text-2xl font-bold text-foreground">94%</div>
                                        </div>
                                    </div>

                                    {/* Recent Activity Mock */}
                                    <div className="space-y-4">
                                        <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Recent Applications</div>
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                                                        S{i}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium">Student Name {i}</div>
                                                        <div className="text-xs text-muted-foreground">Visa Interview Prep</div>
                                                    </div>
                                                </div>
                                                <div className="px-2 py-1 rounded text-xs bg-green-500/10 text-green-600 font-medium">
                                                    Active
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
