"use client"

import type { FC } from "react"
import { cn } from "@/lib/utils"
import features from "../../../features.json"

// Content is loaded from features.json


const PlusCard: FC<{
  className?: string
  title: string
  body: string
}> = ({
  className = "",
  title,
  body,
}) => {
  return (
    <div
      className={cn(
        "relative border border-dashed border-zinc-400 dark:border-zinc-700 rounded-lg p-6 bg-white dark:bg-zinc-950 min-h-[200px]",
        "flex flex-col justify-between",
        className
      )}
      data-animate="up"
      data-duration="0.7"
    >
      <CornerPlusIcons />
      {/* Content */}
      <div className="relative z-10 space-y-2">
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          {title}
        </h3>
        <p className="text-gray-700 dark:text-gray-300">{body}</p>
      </div>
    </div>
  )
}

const CornerPlusIcons = () => (
  <>
    <PlusIcon className="absolute -top-3 -left-3" />
    <PlusIcon className="absolute -top-3 -right-3" />
    <PlusIcon className="absolute -bottom-3 -left-3" />
    <PlusIcon className="absolute -bottom-3 -right-3" />
  </>
)

const PlusIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    width={24}
    height={24}
    strokeWidth="1"
    stroke="currentColor"
    className={`dark:text-white text-black size-6 ${className}`}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
  </svg>
)

export default function RuixenBentoCards() {
  return (
    <section className="bg-white dark:bg-black dark:bg-transparent border border-gray-200 dark:border-gray-800">
      <div className="mx-auto container border border-gray-200 dark:border-gray-800 py-12 border-t-0 px-4">
        {/* Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 auto-rows-auto gap-4">
          {features.featureGrid.cards.map((card, idx) => {
            const spanClasses =
              idx === 0
                ? "lg:col-span-3 lg:row-span-2"
                : idx === 1
                ? "lg:col-span-2 lg:row-span-2"
                : card.span === "wide"
                ? "lg:col-span-4 lg:row-span-1"
                : "lg:col-span-2 lg:row-span-1";
            return (
              <PlusCard
                key={`${card.title}-${idx}`}
                title={card.title}
                body={card.body}
                className={spanClasses}
              />
            )
          })}
        </div>

        {/* Section Footer Heading */}
        <div className="max-w-2xl ml-auto text-right px-4 mt-6 lg:-mt-20" data-animate="up" data-duration="0.6">
          <h2 className="text-4xl md:text-6xl font-bold text-black dark:text-white mb-4 whitespace-pre-line">
            {features.featureGrid.headline}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            {features.featureGrid.subtext}
          </p>
        </div>
      </div>
    </section>
  )
}

