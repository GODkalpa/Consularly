'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowUp, BarChart3, CalendarCheck, Globe, Mic, Play, Plus, Video, Sparkles, Target, TrendingUp, MessageSquare, Volume2, User } from 'lucide-react'
import Image from 'next/image'


const MESCHAC_AVATAR = 'https://avatars.githubusercontent.com/u/47919550?v=4'
const BERNARD_AVATAR = 'https://avatars.githubusercontent.com/u/31113941?v=4'
const THEO_AVATAR = 'https://avatars.githubusercontent.com/u/68236786?v=4'
const GLODIE_AVATAR = 'https://avatars.githubusercontent.com/u/99137927?v=4'

export default function FeaturesSection() {
    return (
        <section>
            <div className="pt-8 sm:pt-12 md:pt-16 pb-12 sm:pb-16 md:pb-20">
                <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
                    {/* Section Header */}
                    <div className="mb-12 sm:mb-16 text-center">
                        <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground mb-6 text-balance px-4 tracking-tight">
                            Everything You Need to Ace Your Visa Interview
                        </h2>
                        <p className="text-muted-foreground text-lg sm:text-xl md:text-2xl text-pretty max-w-3xl mx-auto px-4">
                            Prepare with confidence using our comprehensive AI-powered interview simulation platform
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <Card
                            variant="soft"
                            className="col-span-full p-4 sm:p-6 border-primary/20">
                            <Video className="text-primary size-4 sm:size-5" />
                            <h3 className="text-foreground mt-4 sm:mt-5 text-lg sm:text-xl md:text-h3 font-semibold">Real-Time Interview Simulation</h3>
                            <p className="text-muted-foreground mt-2 sm:mt-3 text-pretty text-sm sm:text-base md:text-lead max-w-xl">Experience authentic visa interview scenarios with our AI-powered platform. Get instant feedback on your answers, body language, and speech patterns.</p>
                            <div className="mt-4 sm:mt-6">
                                <div className="rounded-lg overflow-hidden border border-primary/10 ring-1 ring-primary/10 shadow-lg shadow-primary/5 bg-background">
                                    <Image
                                        src="/dashboard.jpeg"
                                        alt="Interview simulation screen"
                                        width={1024}
                                        height={627}
                                        className="block w-full h-auto"
                                    />
                                </div>
                            </div>
                        </Card>
                        <Card
                            variant="soft"
                            className="overflow-hidden p-4 sm:p-6 border-secondary/20">
                            <Target className="text-secondary-700 size-4 sm:size-5" />
                            <h3 className="text-foreground mt-4 sm:mt-5 text-lg sm:text-xl md:text-h3 font-semibold">Country-Specific Practice</h3>
                            <p className="text-muted-foreground mt-2 sm:mt-3 text-pretty text-sm sm:text-base md:text-lead">Tailored questions for US F1, UK Tier 4, and other visa types based on real interview patterns.</p>

                            <MeetingIllustration />
                        </Card>

                        <Card
                            variant="soft"
                            className="group overflow-hidden p-4 sm:p-6 border-accent/30">
                            <BarChart3 className="text-accent-800 size-4 sm:size-5" />
                            <h3 className="text-foreground mt-4 sm:mt-5 text-lg sm:text-xl md:text-h3 font-semibold">Detailed Analytics</h3>
                            <p className="text-muted-foreground mt-2 sm:mt-3 text-pretty text-sm sm:text-base md:text-lead">Track your progress with comprehensive scoring on content, speech clarity, and non-verbal communication.</p>

                            <AnalyticsIllustration />
                        </Card>
                        <Card
                            variant="soft"
                            className="group overflow-hidden p-4 sm:p-6 border-primary/20">
                            <Sparkles className="text-primary size-4 sm:size-5" />
                            <h3 className="text-foreground mt-4 sm:mt-5 text-lg sm:text-xl md:text-h3 font-semibold">AI-Powered Feedback</h3>
                            <p className="text-muted-foreground mt-2 sm:mt-3 text-pretty text-sm sm:text-base md:text-lead">Get personalized recommendations to improve your interview performance with actionable insights.</p>

                            <div className="mask-b-from-50 -mx-2 -mt-2 px-2 pt-2">
                                <AIAssistantIllustration />
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </section>
    )
}

const MeetingIllustration = () => {
    return (
        <Card
            aria-hidden
            className="mt-6 p-4">
            <div className="relative hidden h-fit">
                <div className="absolute -left-1.5 bottom-1.5 rounded-md border-t border-red-700 bg-red-500 px-1 py-px text-[10px] font-medium text-white shadow-md shadow-red-500/35">PDF</div>
                <div className="h-10 w-8 rounded-md border bg-gradient-to-b from-zinc-100 to-zinc-200"></div>
            </div>
            <div className="mb-0.5 text-xs sm:text-sm font-semibold text-foreground">F1 Visa Interview</div>
            <div className="mb-3 sm:mb-4 flex gap-2 text-xs sm:text-sm">
                <span className="text-muted-foreground">United States</span>
            </div>
            <div className="mb-1.5 sm:mb-2 flex -space-x-1.5">
                <div className="flex -space-x-1.5">
                    {[
                        { src: MESCHAC_AVATAR, alt: 'Student 1' },
                        { src: BERNARD_AVATAR, alt: 'Student 2' },
                        { src: THEO_AVATAR, alt: 'Student 3' },
                        { src: GLODIE_AVATAR, alt: 'Student 4' },
                    ].map((avatar, index) => (
                        <div
                            key={index}
                            className="bg-background size-6 sm:size-7 rounded-full border p-0.5 shadow shadow-zinc-950/5">
                            <img
                                className="aspect-square rounded-full object-cover"
                                src={avatar.src}
                                alt={avatar.alt}
                                height="460"
                                width="460"
                            />
                        </div>
                    ))}
                </div>
            </div>
            <div className="text-muted-foreground text-xs sm:text-sm font-medium">Practice with peers</div>
        </Card>
    )
}

const AnalyticsIllustration = () => {
    return (
        <Card
            aria-hidden
            className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gradient-to-br from-background to-muted/30">
            <div className="mb-3 sm:mb-4 text-center">
                <div className="text-[10px] sm:text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Performance Score</div>
                <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary to-primary-600 bg-clip-text text-transparent">87%</div>
            </div>

            <div className="space-y-2 sm:space-y-3">
                <div className="group">
                    <div className="mb-1 sm:mb-1.5 flex items-center gap-1.5 sm:gap-2">
                        <div className="flex size-4 sm:size-5 shrink-0 items-center justify-center rounded bg-primary/10">
                            <MessageSquare className="size-2.5 sm:size-3 text-primary" />
                        </div>
                        <span className="text-[10px] sm:text-xs font-medium text-foreground flex-1">Content</span>
                        <span className="text-xs sm:text-sm font-bold text-foreground tabular-nums min-w-[2.5rem] sm:min-w-[3rem] text-right">90%</span>
                    </div>
                    <div className="ml-5 sm:ml-7 h-1 sm:h-1.5 w-[calc(100%-1.25rem)] sm:w-[calc(100%-1.75rem)] overflow-hidden rounded-full bg-muted/50">
                        <div className="h-full w-[90%] rounded-full bg-gradient-to-r from-primary to-primary-600 shadow-sm shadow-primary/20 transition-all duration-500 group-hover:shadow-md group-hover:shadow-primary/30"></div>
                    </div>
                </div>

                <div className="group">
                    <div className="mb-1.5 flex items-center gap-2">
                        <div className="flex size-4 sm:size-5 shrink-0 items-center justify-center rounded bg-secondary/20">
                            <Volume2 className="size-2.5 sm:size-3 text-secondary-800" />
                        </div>
                        <span className="text-[10px] sm:text-xs font-medium text-foreground flex-1">Speech Clarity</span>
                        <span className="text-xs sm:text-sm font-bold text-foreground tabular-nums min-w-[2.5rem] sm:min-w-[3rem] text-right">85%</span>
                    </div>
                    <div className="ml-5 sm:ml-7 h-1 sm:h-1.5 w-[calc(100%-1.25rem)] sm:w-[calc(100%-1.75rem)] overflow-hidden rounded-full bg-muted/50">
                        <div className="h-full w-[85%] rounded-full bg-gradient-to-r from-secondary-600 to-secondary-800 shadow-sm shadow-secondary/20 transition-all duration-500 group-hover:shadow-md group-hover:shadow-secondary/30"></div>
                    </div>
                </div>

                <div className="group">
                    <div className="mb-1.5 flex items-center gap-2">
                        <div className="flex size-4 sm:size-5 shrink-0 items-center justify-center rounded bg-accent/20">
                            <User className="size-2.5 sm:size-3 text-accent-800" />
                        </div>
                        <span className="text-[10px] sm:text-xs font-medium text-foreground flex-1">Body Language</span>
                        <span className="text-xs sm:text-sm font-bold text-foreground tabular-nums min-w-[2.5rem] sm:min-w-[3rem] text-right">86%</span>
                    </div>
                    <div className="ml-5 sm:ml-7 h-1 sm:h-1.5 w-[calc(100%-1.25rem)] sm:w-[calc(100%-1.75rem)] overflow-hidden rounded-full bg-muted/50">
                        <div className="h-full w-[86%] rounded-full bg-gradient-to-r from-accent-600 to-accent-800 shadow-sm shadow-accent/20 transition-all duration-500 group-hover:shadow-md group-hover:shadow-accent/30"></div>
                    </div>
                </div>
            </div>

            <div className="mt-3 sm:mt-4 flex items-center gap-1 sm:gap-1.5 rounded-lg bg-green-50 dark:bg-green-950/20 px-2 sm:px-2.5 py-1 sm:py-1.5 w-fit">
                <TrendingUp className="size-3 sm:size-3.5 text-green-600 dark:text-green-400" />
                <span className="text-[10px] sm:text-xs font-semibold text-green-700 dark:text-green-400">+12% from last practice</span>
            </div>
        </Card>
    )
}

const AIAssistantIllustration = () => {
    return (
        <Card
            aria-hidden
            className="mt-4 sm:mt-6 p-4 sm:p-5">
            {/* User Question */}
            <div className="flex items-start gap-2.5 sm:gap-3">
                <div className="mt-0.5 size-6 sm:size-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="size-3 sm:size-3.5 fill-primary stroke-primary" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed">
                        How should I explain my funding sources for my F1 visa interview?
                    </p>
                </div>
            </div>

            {/* Chat Input Area */}
            <div className="bg-muted/30 -mx-4 sm:-mx-5 -mb-4 sm:-mb-5 mt-5 sm:mt-6 border-t pt-3 sm:pt-4 px-4 sm:px-5 pb-4 sm:pb-5 rounded-b-xl">
                <div className="text-muted-foreground text-[10px] sm:text-xs font-medium mb-2.5 sm:mb-3">
                    Get AI Guidance
                </div>

                <div className="flex items-center gap-2 bg-background rounded-full border px-2.5 sm:px-3 py-1.5 sm:py-2 shadow-sm">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-6 sm:size-7 rounded-full hover:bg-muted/50 flex-shrink-0">
                        <Plus className="size-3.5 sm:size-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-6 sm:size-7 rounded-full hover:bg-muted/50 flex-shrink-0">
                        <Globe className="size-3.5 sm:size-4" />
                    </Button>

                    <div className="flex-1 min-w-0 px-1 sm:px-2">
                        <div className="h-5 sm:h-6 flex items-center">
                            <span className="text-[10px] sm:text-xs text-muted-foreground/60 truncate">Type your question...</span>
                        </div>
                    </div>

                    <Button
                        size="icon"
                        className="size-6 sm:size-7 rounded-full bg-primary hover:bg-primary/90 shadow-sm flex-shrink-0">
                        <ArrowUp className="size-3.5 sm:size-4" strokeWidth={2.5} />
                    </Button>
                </div>
            </div>
        </Card>
    )
}
