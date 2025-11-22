"use client";

import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";

export default function CtaSection() {
    return (
        <section className="w-full bg-background pt-12 pb-0 md:pt-16 md:pb-0 overflow-hidden">
            <div className="container mx-auto px-4">
                <div className="flex flex-col items-center text-center max-w-3xl mx-auto space-y-8">

                    {/* Illustration */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="relative w-full max-w-2xl h-64 md:h-80 mb-8 mx-auto -left-[20px]"
                    >
                        <Image
                            src="/Images/cta-illustration-final.png"
                            alt="Streamline your B2B interview process"
                            fill
                            className="object-contain"
                            priority
                        />
                    </motion.div>

                    {/* Text Content */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="space-y-6"
                    >
                        <h3 className="text-sm md:text-base font-bold uppercase tracking-wide text-foreground">
                            Get Started Today
                        </h3>

                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1]">
                            Change the way you<br className="hidden md:block" /> work with clients forever.<br />
                            <span className="text-muted-foreground">You&apos;ll thank us later.</span>
                        </h2>
                    </motion.div>

                    {/* Button */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="pt-4"
                    >
                        <Link
                            href="/signup"
                            className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-primary-foreground bg-primary transition-transform hover:scale-105 active:scale-95 rounded-md shadow-lg hover:bg-primary/90"
                        >
                            Get Started
                        </Link>
                    </motion.div>

                </div>
            </div>
        </section>
    );
}
