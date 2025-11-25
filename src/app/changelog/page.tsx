"use client"

import { Changelog1 } from "@/components/ui/changelog-1";

export default function ChangelogPage() {
    return (
        <Changelog1
            title="Product Changelog"
            description="Get the latest updates and improvements to our platform. We're constantly evolving to serve educational consultancies better."
            entries={[
                {
                    version: "Version 1.0",
                    date: "22 November 2024",
                    title: "The Ultimate Whitelabel Solution for Consultancies",
                    description:
                        "We are thrilled to announce the release of Version 1.0, a major milestone that transforms our platform into a fully whitelabel-ready solution for educational consultancies. This release focuses on empowering agencies to provide a branded, premium experience to their students while leveraging our powerful AI technology.",
                    items: [
                        "Custom Subdomains: Agencies can now have their own dedicated web address (e.g., global-edu.consularly.com), providing a professional entry point for their students",
                        "Dynamic Logo & Favicon: Upload your agency's logo and favicon. The system dynamically updates the browser tab icon and application header to match your brand identity",
                        "Brand Colors & Theming: Dynamic styling engine that injects your primary and secondary brand colors across the entire application—from buttons and borders to progress bars and accents",
                        "Branded Emails: Automated notifications and updates now carry your agency's branding, ensuring a consistent communication experience",
                        "New B2B Hero Section: A redesigned landing page section specifically targeting consultancies, highlighting student tracking and AI capabilities",
                        "Student Tracking Dashboard: A comprehensive view to monitor every student's journey from enrollment to visa approval",
                        "AI-Powered Mock Interviews: Agencies can now offer their students unlimited AI mock interviews with personalized feedback, tailored to specific universities and countries",
                        "Enhanced Subdomain Authentication: Completely overhauled authentication flow to ensure strict data isolation. Users can only log in to the subdomain they belong to",
                        "Organization-Level Data Isolation: Implemented robust middleware and guard components to prevent cross-organization data access, ensuring student data remains private and secure within each agency's tenant",
                        "Optimized Asset Loading: Improved loading performance for branded assets (fonts, logos) to ensure a smooth flash-free experience",
                    ],
                    image: "/dashboard.jpeg",
                },
            ]}
        />
    );
}
