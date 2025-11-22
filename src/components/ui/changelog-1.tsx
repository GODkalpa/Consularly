import { ArrowUpRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type ChangelogEntry = {
    version: string;
    date: string;
    title: string;
    description: string;
    items?: string[];
    image?: string;
    button?: {
        url: string;
        text: string;
    };
};

export interface Changelog1Props {
    title?: string;
    description?: string;
    entries?: ChangelogEntry[];
    className?: string;
}

export const defaultEntries: ChangelogEntry[] = [
    {
        version: "Version 1.3.0",
        date: "15 November 2024",
        title: "Enhanced Analytics Dashboard",
        description:
            "We've completely redesigned our analytics dashboard to provide deeper insights and improved visualizations of your data.",
        items: [
            "Interactive data visualizations with real-time updates",
            "Customizable dashboard widgets",
            "Export analytics in multiple formats (CSV, PDF, Excel)",
            "New reporting templates for common use cases",
            "Improved data filtering and segmentation options",
        ],
        image: "/images/block/placeholder-aspect-video-1.svg",
        button: {
            url: "https://shadcnblocks.com",
            text: "Learn more",
        },
    },
    {
        version: "Version 1.2.5",
        date: "7 October 2024",
        title: "Mobile App Launch",
        description:
            "We're excited to announce the launch of our mobile application, available now on iOS and Android platforms.",
        items: [
            "Native mobile experience for on-the-go productivity",
            "Offline mode support for working without internet connection",
            "Push notifications for important updates",
            "Biometric authentication for enhanced security",
        ],
    },
    {
        version: "Version 1.2.1",
        date: "23 September 2024",
        title: "New features and improvements",
        description:
            "Here are the latest updates and improvements to our platform. We are always working to improve our platform and your experience.",
        items: [
            "Added new feature to export data",
            "Improved performance and speed",
            "Fixed minor bugs and issues",
            "Added new feature to import data",
        ],
        image: "/images/block/placeholder-aspect-video-1.svg",
    },
    {
        version: "Version 1.0.0",
        date: "31 August 2024",
        title: "First version of our platform",
        description:
            "Introducing a new platform to help you manage your projects and tasks. We are excited to launch our platform and help you get started. We are always working to improve our platform and your experience.",
        image: "/images/block/placeholder-aspect-video-1.svg",
        button: {
            url: "https://shadcnblocks.com",
            text: "Learn more",
        },
    },
];

export const Changelog1 = ({
    title = "Changelog",
    description = "Get the latest updates and improvements to our platform.",
    entries = defaultEntries,
}: Changelog1Props) => {
    return (
        <section className="pt-32 pb-16 md:pt-40 md:pb-32">
            <div className="container px-4">
                <div className="mx-auto max-w-6xl">
                    {/* Header in two-column layout */}
                    <div className="relative flex flex-col gap-4 md:flex-row md:gap-16 mb-12 md:mb-24">
                        <div className="hidden md:block w-56 shrink-0"></div>
                        <div className="flex-1">
                            <h1 className="mb-3 text-3xl font-bold tracking-tight md:mb-4 md:text-6xl">
                                {title}
                            </h1>
                            <p className="text-base text-muted-foreground md:text-xl">
                                {description}
                            </p>
                        </div>
                    </div>

                    {/* Changelog Entries */}
                    <div className="space-y-12 md:space-y-24">
                        {entries.map((entry, index) => (
                            <div
                                key={index}
                                className="relative flex flex-col gap-4 md:flex-row md:gap-16"
                            >
                                {/* Version badge - inline on mobile, sticky sidebar on desktop */}
                                <div className="flex items-center gap-3 md:top-24 md:flex-col md:items-start md:h-min md:w-56 md:shrink-0 md:gap-2 md:sticky">
                                    <Badge variant="secondary" className="text-xs md:text-sm px-2 py-0.5 md:px-3 md:py-1 w-fit">
                                        {entry.version}
                                    </Badge>
                                    <span className="text-xs md:text-sm font-medium text-muted-foreground">
                                        {entry.date}
                                    </span>
                                </div>

                                <div className="flex flex-col flex-1">
                                    <h2 className="mb-4 md:mb-6 text-xl leading-snug font-bold text-foreground md:text-3xl">
                                        {entry.title}
                                    </h2>

                                    {/* Image right after title */}
                                    {entry.image && (
                                        <img
                                            src={entry.image}
                                            alt={`${entry.version} visual`}
                                            className="mb-6 md:mb-8 w-full rounded-lg object-cover"
                                        />
                                    )}

                                    {/* Description */}
                                    <p className="text-sm md:text-lg mb-6 md:mb-8 leading-relaxed font-medium text-foreground/90">
                                        {entry.description}
                                    </p>

                                    {/* Items List */}
                                    {entry.items && entry.items.length > 0 && (
                                        <ul className="space-y-3 md:space-y-4 mb-6 md:mb-8">
                                            {entry.items.map((item, itemIndex) => {
                                                // Split on first colon to highlight the topic
                                                const colonIndex = item.indexOf(':');
                                                const hasTopic = colonIndex > 0;
                                                const topic = hasTopic ? item.substring(0, colonIndex) : '';
                                                const content = hasTopic ? item.substring(colonIndex + 1) : item;

                                                return (
                                                    <li key={itemIndex} className="flex gap-3 md:gap-4 text-sm md:text-base text-foreground/80">
                                                        <span className="text-primary mt-1 md:mt-1.5 font-bold">•</span>
                                                        <span className="leading-relaxed font-medium">
                                                            {hasTopic && <strong className="font-bold text-foreground">{topic}:</strong>}
                                                            {hasTopic ? content : item}
                                                        </span>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    )}

                                    {/* Button */}
                                    {entry.button && (
                                        <Button variant="link" className="mt-2 self-start px-0 text-sm md:text-base" asChild>
                                            <a href={entry.button.url} target="_blank">
                                                {entry.button.text} <ArrowUpRight className="ml-1 h-4 w-4 md:h-5 md:w-5" />
                                            </a>
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};
