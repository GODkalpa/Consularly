'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Award, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Image from 'next/image'
import { TextEffect } from '@/components/ui/text-effect'
import { AnimatedGroup } from '@/components/ui/animated-group'
import type { Variants } from 'motion/react'
import heroImg from '../../public/hero.png'

const transitionVariants = {
    item: {
        hidden: {
            opacity: 0,
            filter: 'blur(12px)',
            y: 12,
        },
        visible: {
            opacity: 1,
            filter: 'blur(0px)',
            y: 0,
            transition: {
                duration: 1.5,
            },
        },
    },
} satisfies { item: Variants }

export default function HeroSection() {
    const containerRef = useRef<HTMLDivElement>(null)
    const badge1Ref = useRef<HTMLDivElement>(null)
    const badge2Ref = useRef<HTMLDivElement>(null)
    const badge3Ref = useRef<HTMLDivElement>(null)
    const badge4Ref = useRef<HTMLDivElement>(null)
    // Prefer modern compressed assets if present in /public
    const [heroSrc, setHeroSrc] = useState<string>(heroImg.src)

    // Temporarily commented out GSAP for performance - TODO: Re-enable with lazy loading
    // useGSAP(() => {
    //     const badges = [
    //         { ref: badge1Ref, speed: 0.03 },
    //         { ref: badge2Ref, speed: 0.05 },
    //         { ref: badge3Ref, speed: 0.04 },
    //         { ref: badge4Ref, speed: 0.06 }
    //     ]

    //     // Create quickTo functions for smooth, performant animations
    //     const xTos = badges.map(({ ref }) => 
    //         gsap.quickTo(ref.current, 'x', { duration: 0.6, ease: 'power3.out' })
    //     )
    //     const yTos = badges.map(({ ref }) => 
    //         gsap.quickTo(ref.current, 'y', { duration: 0.6, ease: 'power3.out' })
    //     )

    //     // Initial float animation
    //     badges.forEach(({ ref }, index) => {
    //         gsap.to(ref.current, {
    //             y: '+=15',
    //             duration: 2 + index * 0.5,
    //             repeat: -1,
    //             yoyo: true,
    //             ease: 'sine.inOut'
    //         })
    //     })

    //     const handleMouseMove = (e: MouseEvent) => {
    //         if (!containerRef.current) return

    //         const rect = containerRef.current.getBoundingClientRect()
    //         const centerX = rect.left + rect.width / 2
    //         const centerY = rect.top + rect.height / 2
            
    //         const deltaX = (e.clientX - centerX) 
    //         const deltaY = (e.clientY - centerY)

    //         badges.forEach(({ speed }, index) => {
    //             xTos[index](deltaX * speed)
    //             yTos[index](deltaY * speed)
    //         })
    //     }

    //     window.addEventListener('mousemove', handleMouseMove)

    //     return () => {
    //         window.removeEventListener('mousemove', handleMouseMove)
    //     }
    // }, { scope: containerRef })

    // Probe for hero.avif or hero.webp at runtime and use them if available
    useEffect(() => {
        let cancelled = false
        const probe = async () => {
            try {
                const avif = await fetch('/hero.avif', { method: 'HEAD' })
                if (!cancelled && avif.ok) { setHeroSrc('/hero.avif'); return }
            } catch {}
            try {
                const webp = await fetch('/hero.webp', { method: 'HEAD' })
                if (!cancelled && webp.ok) { setHeroSrc('/hero.webp'); return }
            } catch {}
        }
        probe()
        return () => { cancelled = true }
    }, [])

    return (
        <>
            <main className="overflow-x-clip">
                <section className="bg-background">
                    <div className="relative pt-12 sm:pt-16 md:pt-24 px-4 sm:px-16 md:px-20 lg:px-24">
                        <div className="mx-auto max-w-7xl">
                            <div className="text-center sm:mx-auto lg:mr-auto lg:mt-0">
                                {/* Top Badge */}
                                <div className="flex justify-center mb-6 sm:mb-8 animate-in fade-in slide-in-from-top-4 duration-1000">
                                    <Badge variant="secondary" className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium">
                                        <Award className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 text-accent" />
                                        #1 Visa Interview Prep Platform
                                    </Badge>
                                </div>

                                {/* Headline with decorative badges */}
                                <div ref={containerRef} className="relative mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300 pointer-events-none select-none flex flex-col items-center">
                                    <h1 className="relative text-[2.25rem] leading-[1.25] sm:text-4xl md:text-5xl lg:text-6xl xl:text-display-3 font-bold text-foreground text-center px-4 sm:leading-tight max-w-[95vw]">
                                        <span className="block sm:inline-block">Practice.</span>{' '}
                                        <span className="block sm:inline-block">Get Feedback.</span>
                                        <br className="hidden sm:inline" />
                                        <span className="block sm:inline-block">Pass Your Visa Interview</span>
                                    </h1>
                                    
                                    {/* Arrow-shaped badges beside first/last letters of each row */}
                                    {/* Row 1 Left - beside "Ace" */}
                                    <div 
                                        ref={badge1Ref} 
                                        className="hidden sm:block absolute top-[14%] sm:top-[16%] left-[-10%] sm:left-[-8%] md:left-[-6%] lg:left-[-4%] will-change-transform pointer-events-auto"
                                    >
                                        <div className="relative bg-secondary-100 text-secondary-700 dark:bg-secondary-900/90 dark:text-secondary-300 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold rounded-xl border border-white/80 dark:border-white/10 shadow-xl ring-1 ring-black/5 dark:ring-white/5 backdrop-blur-sm rotate-[-6deg] hover:scale-[1.03] transition-transform">
                                            Junior
                                            {/* Pointer */}
                                            <div className="absolute top-1/2 -right-2 -translate-y-1/2 w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-l-[12px] border-l-secondary-100 dark:border-l-secondary-900/90"></div>
                                            {/* Accent triangle behind */}
                                            <div aria-hidden className="absolute -top-3 -left-4 w-0 h-0 border-b-[14px] border-b-secondary-300/60 dark:border-b-secondary-700/60 border-r-[18px] border-r-transparent -rotate-6"></div>
                                        </div>
                                    </div>
                                    
                                    {/* Row 1 Right - beside "Visa" */}
                                    <div 
                                        ref={badge3Ref} 
                                        className="hidden sm:block absolute top-[13%] sm:top-[15%] right-[-10%] sm:right-[-8%] md:right-[-6%] lg:right-[-4%] will-change-transform pointer-events-auto"
                                    >
                                        <div className="relative bg-accent-100 text-accent-700 dark:bg-accent-900/90 dark:text-accent-300 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold rounded-xl border border-white/80 dark:border-white/10 shadow-xl ring-1 ring-black/5 dark:ring-white/5 backdrop-blur-sm rotate-[6deg] hover:scale-[1.03] transition-transform">
                                            Senior
                                            {/* Pointer */}
                                            <div className="absolute top-1/2 -left-2 -translate-y-1/2 w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-r-[12px] border-r-accent-100 dark:border-r-accent-900/90"></div>
                                            {/* Accent triangle behind */}
                                            <div aria-hidden className="absolute -top-3 -right-4 w-0 h-0 border-b-[14px] border-b-accent-300/60 dark:border-b-accent-700/60 border-l-[18px] border-l-transparent rotate-6"></div>
                                        </div>
                                    </div>
                                    
                                    {/* Row 2 Left - beside "Interview" */}
                                    <div 
                                        ref={badge2Ref} 
                                        className="hidden sm:block absolute bottom-[12%] sm:bottom-[14%] left-[-11%] sm:left-[-9%] md:left-[-7%] lg:left-[-5%] will-change-transform pointer-events-auto"
                                    >
                                        <div className="relative bg-primary-100 text-primary-700 dark:bg-primary-900/90 dark:text-primary-300 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold rounded-xl border border-white/80 dark:border-white/10 shadow-xl ring-1 ring-black/5 dark:ring-white/5 backdrop-blur-sm rotate-[7deg] hover:scale-[1.03] transition-transform">
                                            Middle
                                            {/* Pointer */}
                                            <div className="absolute top-1/2 -right-2 -translate-y-1/2 w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-l-[12px] border-l-primary-100 dark:border-l-primary-900/90"></div>
                                            {/* Accent triangle behind */}
                                            <div aria-hidden className="absolute -bottom-3 -left-3 w-0 h-0 border-t-[14px] border-t-primary-300/60 dark:border-t-primary-700/60 border-r-[18px] border-r-transparent -rotate-3"></div>
                                        </div>
                                    </div>
                                    
                                    {/* Row 2 Right - beside "Anywhere" */}
                                    <div 
                                        ref={badge4Ref} 
                                        className="hidden sm:block absolute bottom-[11%] sm:bottom-[13%] right-[-11%] sm:right-[-9%] md:right-[-7%] lg:right-[-5%] will-change-transform pointer-events-auto"
                                    >
                                        <div className="relative bg-tertiary-100 text-tertiary-700 dark:bg-tertiary-900/90 dark:text-tertiary-300 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold rounded-xl border border-white/80 dark:border-white/10 shadow-xl ring-1 ring-black/5 dark:ring-white/5 backdrop-blur-sm rotate-[-7deg] hover:scale-[1.03] transition-transform">
                                            Lead
                                            {/* Pointer */}
                                            <div className="absolute top-1/2 -left-2 -translate-y-1/2 w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-r-[12px] border-r-tertiary-100 dark:border-r-tertiary-900/90"></div>
                                            {/* Accent triangle behind */}
                                            <div aria-hidden className="absolute -bottom-3 -right-4 w-0 h-0 border-t-[14px] border-t-tertiary-300/60 dark:border-t-tertiary-700/60 border-l-[18px] border-l-transparent rotate-3"></div>
                                        </div>
                                    </div>
                                </div>

                                <p className="mx-auto mt-6 sm:mt-8 max-w-2xl text-pretty text-base sm:text-lg md:text-lead text-muted-foreground animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500 px-4 leading-relaxed">
                                    Meet <span className="font-semibold text-foreground">Consularly</span> — an AI toolkit that helps <span className="font-semibold text-foreground">visa applicants</span> get clarity, feedback, and interview confidence
                                </p>

                                <AnimatedGroup
                                    variants={{
                                        container: {
                                            visible: {
                                                transition: {
                                                    staggerChildren: 0.05,
                                                    delayChildren: 0.75,
                                                },
                                            },
                                        },
                                        ...transitionVariants,
                                    }}
                                    className="mt-8 sm:mt-10 flex flex-col items-center justify-center gap-3 sm:gap-4">
                                    <Button
                                        key={1}
                                        asChild
                                        size="lg"
                                        className="h-12 sm:h-14 rounded-full px-8 sm:px-10 text-base sm:text-lg font-semibold bg-primary text-primary-foreground shadow-lg hover:bg-primary-600 hover:scale-105 transition-all duration-200">
                                        <Link href="/signin">
                                            Sign In to Start
                                        </Link>
                                    </Button>

                                    {/* Trust Indicator */}
                                    <p className="text-sm text-muted-foreground">
                                        Trusted by 3,800+ visa applicants worldwide
                                    </p>

                                    {/* Social Proof */}
                                    <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mt-2">
                                        <div className="flex -space-x-2">
                                            <Avatar className="w-8 h-8 sm:w-10 sm:h-10 border-2 border-background">
                                                <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=1" />
                                                <AvatarFallback>U1</AvatarFallback>
                                            </Avatar>
                                            <Avatar className="w-8 h-8 sm:w-10 sm:h-10 border-2 border-background">
                                                <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=2" />
                                                <AvatarFallback>U2</AvatarFallback>
                                            </Avatar>
                                            <Avatar className="w-8 h-8 sm:w-10 sm:h-10 border-2 border-background">
                                                <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=3" />
                                                <AvatarFallback>U3</AvatarFallback>
                                            </Avatar>
                                        </div>
                                        <div className="text-center sm:text-left">
                                            <p className="text-sm sm:text-base leading-[1.55] text-muted-foreground italic">
                                                &quot;It really helped me understand how to present myself more effectively&quot;
                                            </p>
                                            <p className="text-sm font-medium tracking-[0.01em]">Andreas, F1 Visa Applicant</p>
                                        </div>
                                    </div>
                                </AnimatedGroup>
                            </div>
                        </div>

                        <AnimatedGroup
                            variants={{
                                container: {
                                    visible: {
                                        transition: {
                                            staggerChildren: 0.05,
                                            delayChildren: 0.75,
                                        },
                                    },
                                },
                                ...transitionVariants,
                            }}>
                            <div className="relative mt-6 px-2 sm:px-4 sm:mt-8 md:mt-12">
                                <div className="inset-shadow-2xs ring-background dark:inset-shadow-white/20 bg-background relative mx-auto w-full max-w-6xl overflow-hidden rounded-2xl border shadow-lg shadow-zinc-950/15 ring-1">
                                    {/* Window chrome */}
                                    <div className="pointer-events-none absolute left-0 right-0 top-0 z-10 flex h-9 items-center gap-2 border-b border-border/60 bg-background/80 px-4">
                                        <span className="h-3 w-3 rounded-full bg-red-400/90" />
                                        <span className="h-3 w-3 rounded-full bg-yellow-400/90" />
                                        <span className="h-3 w-3 rounded-full bg-green-400/90" />
                                    </div>

                                    {/* Decorative overlays */}
                                    <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/10 to-transparent" />
                                    <div aria-hidden className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(60%_60%_at_80%_20%,black,transparent)] bg-[radial-gradient(80%_80%_at_85%_15%,hsl(var(--primary)/.12),transparent)]" />

                                    {/* Optimized image */}
                                    <Image
                                        src={heroSrc}
                                        alt="Consularly interview preview — start screen with camera check and mic meter"
                                        placeholder="blur"
                                        blurDataURL={(heroImg as any).blurDataURL}
                                        priority
                                        quality={80}
                                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1100px"
                                        width={(heroImg as any).width}
                                        height={(heroImg as any).height}
                                        className="relative z-[1] w-full h-auto rounded-2xl"
                                    />
                                </div>
                            </div>
                        </AnimatedGroup>

                        {/* Scrolling Ticker */}
                        <div className="relative mt-8 sm:mt-10 overflow-hidden bg-muted/30 py-3 sm:py-4">
                            <div className="animate-marquee whitespace-nowrap">
                                <span className="mx-8 text-sm font-medium text-muted-foreground">
                                    MORE THAN 3800 APPLICANTS PREPARED FOR INTERVIEW WITH CONSULARLY •
                                </span>
                                <span className="mx-8 text-sm font-medium text-muted-foreground">
                                    MORE THAN 3800 APPLICANTS PREPARED FOR INTERVIEW WITH CONSULARLY •
                                </span>
                                <span className="mx-8 text-sm font-medium text-muted-foreground">
                                    MORE THAN 3800 APPLICANTS PREPARED FOR INTERVIEW WITH CONSULARLY •
                                </span>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </>
    )
}
