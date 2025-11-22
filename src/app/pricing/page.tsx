"use client"

import { useState } from "react"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export default function PricingPage() {
    const [isAnnual, setIsAnnual] = useState(false)

    const plans = [
        {
            name: "Basic",
            price: 1000,
            yearlyPrice: 12000,
            interviews: 10,
            yearlyInterviews: 120,
            description: "Perfect for getting started",
            features: [
                "10 AI interviews per month",
                "Custom Subdomain",
                "Dynamic Logo & Favicon",
                "Brand Colors & Theming",
                "Student Tracking Dashboard",
                "Branded Emails",
                "Email & Chat Support",
            ],
            highlight: false,
        },
        {
            name: "Plus",
            price: 2500,
            yearlyPrice: 30000,
            interviews: 25,
            yearlyInterviews: 300,
            description: "For growing consultancies",
            features: [
                "25 AI interviews per month",
                "Custom Subdomain",
                "Dynamic Logo & Favicon",
                "Brand Colors & Theming",
                "Student Tracking Dashboard",
                "Branded Emails",
                "Email & Chat Support",
            ],
            highlight: false,
        },
        {
            name: "Premium",
            price: 5000,
            yearlyPrice: 60000,
            interviews: 50,
            yearlyInterviews: 840, // Special offer: 70 * 12
            description: "For established businesses",
            features: [
                "50 AI interviews per month",
                "Custom Subdomain",
                "Dynamic Logo & Favicon",
                "Brand Colors & Theming",
                "Student Tracking Dashboard",
                "Branded Emails",
                "Email & Chat Support",
            ],
            highlight: true,
        },
        {
            name: "Enterprise",
            price: null, // Custom
            description: "For large organizations",
            features: [
                "Custom interview volume",
                "Custom Subdomain",
                "Dynamic Logo & Favicon",
                "Brand Colors & Theming",
                "Student Tracking Dashboard",
                "Branded Emails",
                "Dedicated Account Manager",
            ],
            highlight: false,
        },
    ]

    return (
        <div className="min-h-screen bg-background pt-52 pb-24 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-20">
                    <h1 className="text-4xl md:text-6xl font-medium tracking-tight text-[#1a1a1a] mb-6">
                        Simple & <span className="italic font-light">transparent</span> pricing
                        <br />
                        for all business sizes
                    </h1>

                    {/* Billing Toggle */}
                    <div className="flex items-center justify-center gap-4 mt-10">
                        <Label
                            htmlFor="billing-toggle"
                            className={cn("text-base font-medium cursor-pointer", !isAnnual ? "text-foreground" : "text-muted-foreground")}
                        >
                            Monthly billing
                        </Label>
                        <Switch
                            id="billing-toggle"
                            checked={isAnnual}
                            onCheckedChange={setIsAnnual}
                            className="data-[state=checked]:bg-black"
                        />
                        <Label
                            htmlFor="billing-toggle"
                            className={cn("text-base font-medium cursor-pointer", isAnnual ? "text-foreground" : "text-muted-foreground")}
                        >
                            Annual billing
                        </Label>
                    </div>
                </div>

                {/* Pricing Cards */}
                <div className={cn(
                    "grid gap-6 max-w-7xl mx-auto",
                    isAnnual ? "grid-cols-1 max-w-md" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
                )}>
                    {plans
                        .filter(plan => !isAnnual || plan.name === "Premium")
                        .map((plan) => (
                            <div key={plan.name} className="relative flex flex-col">
                                {plan.highlight && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                                        <Badge className="bg-black text-white px-3 py-1 text-xs font-medium rounded-full border border-white/10 whitespace-nowrap">
                                            Most popular
                                        </Badge>
                                    </div>
                                )}

                                <Card className={cn(
                                    "flex flex-col w-full h-full relative overflow-hidden transition-colors duration-200",
                                    "border",
                                    plan.highlight
                                        ? "bg-gray-50/50 border-black ring-1 ring-black/5"
                                        : "bg-white border-gray-200 hover:border-gray-300"
                                )}>
                                    <CardHeader className="pb-8 pt-10 px-6">
                                        <CardTitle className="text-lg font-medium text-gray-900 mb-2">
                                            {plan.name}
                                        </CardTitle>
                                        <p className="text-sm text-gray-500 font-normal leading-relaxed min-h-[40px]">
                                            {plan.description}
                                        </p>
                                        <div className="flex items-baseline gap-1 mt-6">
                                            {plan.price !== null ? (
                                                <>
                                                    <span className="text-3xl font-medium tracking-tight text-gray-900">
                                                        Rs. {isAnnual ? plan.yearlyPrice?.toLocaleString() : plan.price.toLocaleString()}
                                                    </span>
                                                    <span className="text-sm font-normal text-gray-500 ml-1">
                                                        /{isAnnual ? "year" : "mo"}
                                                    </span>
                                                </>
                                            ) : (
                                                <span className="text-3xl font-medium tracking-tight text-gray-900">
                                                    Custom
                                                </span>
                                            )}
                                        </div>
                                    </CardHeader>

                                    <CardContent className="flex-1 pb-10 px-6 flex flex-col">
                                        <div className="space-y-6 flex-1">
                                            <div className="h-px w-full bg-gray-100" />

                                            <ul className="space-y-3">
                                                {/* Dynamic Interview Feature */}
                                                {plan.price !== null && (
                                                    <li className="flex items-start gap-3">
                                                        <Check className="h-4 w-4 text-black mt-0.5 shrink-0" strokeWidth={2} />
                                                        <span className="text-sm text-gray-700 font-medium leading-tight">
                                                            {isAnnual && plan.yearlyInterviews
                                                                ? `${plan.yearlyInterviews} interviews / year`
                                                                : `${plan.interviews} interviews / month`}
                                                            {isAnnual && plan.name === "Premium" && (
                                                                <span className="block text-xs text-green-600 font-medium mt-1">
                                                                    (70 interviews / month)
                                                                </span>
                                                            )}
                                                        </span>
                                                    </li>
                                                )}

                                                {plan.features.slice(1).map((feature) => (
                                                    <li key={feature} className="flex items-start gap-3">
                                                        <Check className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" strokeWidth={2} />
                                                        <span className="text-sm text-gray-600 font-normal leading-tight">
                                                            {feature}
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        <Button
                                            className={cn(
                                                "w-full mt-8 h-10 text-sm font-medium rounded-lg transition-all duration-200",
                                                plan.highlight
                                                    ? "bg-black text-white hover:bg-gray-800"
                                                    : "bg-white border border-gray-200 text-gray-900 hover:bg-gray-50 hover:border-gray-300"
                                            )}
                                        >
                                            {plan.price !== null ? "Get started" : "Contact sales"}
                                        </Button>
                                    </CardContent>
                                </Card>
                            </div>
                        ))}
                </div>
            </div>
        </div>
    )
}
