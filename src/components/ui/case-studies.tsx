"use client";

import dynamic from "next/dynamic";
// Types for the CountUp component props
// (will resolve once 'react-countup' is installed)
import type { CountUpProps } from "react-countup";
import { useEffect, useState } from "react";
import Image from "next/image";
import resultsContent from "../../../visaprep_results_section.json";

// Avoid SSR hydration issues by loading react-countup on the client.
// Explicitly resolve default export to satisfy TS typings for JSX props.
const CountUp = dynamic<CountUpProps>(() => import("react-countup").then(m => m.default), { ssr: false });

/** Hook: respects user's motion preferences */
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !("matchMedia" in window)) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    setReduced(mq.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);
  return reduced;
}

/** Utility: parse a metric like "98%", "3.8x", "$1,200+", "1.5M", "€23.4k" */
function parseMetricValue(raw: string) {
  const value = (raw ?? "").toString().trim();
  const m = value.match(
    /^([^\d\-+]*?)\s*([\-+]?\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*([^\d\s]*)$/
  );
  if (!m) {
    return { prefix: "", end: 0, suffix: value, decimals: 0 };
  }
  const [, prefix, num, suffix] = m as unknown as [string, string, string, string, string?];
  const normalized = num.replace(/,/g, "");
  const end = parseFloat(normalized);
  const decimals = (normalized.split(".")[1]?.length ?? 0);
  return {
    prefix: prefix ?? "",
    end: isNaN(end) ? 0 : end,
    suffix: suffix ?? "",
    decimals,
  };
}

// Types for the imported JSON content
type Metric = { value: string; label: string; note?: string };
type Testimonial = { title: string; quote: string; name: string; role: string };
type Row = {
  layout: "imageLeft_metricsRight" | "metricsLeft_imageRight";
  image_card_title?: string;
  testimonial: Testimonial;
  metrics: Metric[];
};
type ResultsSection = {
  id: string;
  title: string;
  subtitle?: string;
  rows: Row[];
  footer_microcopy?: string[];
  disclaimers?: string[];
  roadmap_note?: string;
};
type ResultsFile = { section: ResultsSection };

/** Small component: one animated metric */
function MetricStat({
  value,
  label,
  sub,
  duration = 1.6,
}: {
  value: string;
  label: string;
  sub?: string;
  duration?: number;
}) {
  const reduceMotion = usePrefersReducedMotion();
  const { prefix, end, suffix, decimals } = parseMetricValue(value);

  return (
    <div className="flex flex-col gap-2 text-left p-6">
      <p
        className="text-2xl font-medium text-gray-900 dark:text-white sm:text-4xl"
        aria-label={`${label} ${value}`}
      >
        {prefix}
        {reduceMotion ? (
          <span>
            {end.toLocaleString(undefined, {
              minimumFractionDigits: decimals,
              maximumFractionDigits: decimals,
            })}
          </span>
        ) : (
          <CountUp
            end={end}
            decimals={decimals}
            duration={duration}
            separator="," 
            enableScrollSpy
            scrollSpyOnce
          />
        )}
        {suffix}
      </p>
      <p className="font-medium text-gray-900 dark:text-white text-left">
        {label}
      </p>
      {sub ? (
        <p className="text-gray-600 dark:text-gray-400 text-left">{sub}</p>
      ) : null}
    </div>
  );
}

export default function Casestudies() {
  const section = (resultsContent as ResultsFile).section;
  const rows = section?.rows ?? [];

  return (
    <section
      id={section?.id}
      className="py-32 bg-background"
      aria-labelledby="case-studies-heading"
    >
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="flex flex-col gap-4 text-center max-w-2xl mx-auto" data-animate="up" data-duration="0.6">
          <h2
            id="case-studies-heading"
            className="text-4xl font-semibold md:text-5xl text-foreground"
          >
            {section?.title ?? "Real results"}
          </h2>
          {section?.subtitle ? (
            <p className="text-muted-foreground">{section.subtitle}</p>
          ) : null}
        </div>

        {/* Cases */}
        <div className="mt-20 flex flex-col gap-20">
          {rows.map((row, idx) => {
            const reversed = row.layout === "metricsLeft_imageRight";
            return (
              <div
                key={`${row.layout}-${idx}`}
                className="grid gap-12 lg:grid-cols-3 xl:gap-24 items-center border-b border-gray-200 dark:border-gray-800 pb-12"
              >
                {/* Left: Image + Quote */}
                <div
                  className={[
                    "flex flex-col sm:flex-row gap-10 lg:col-span-2 lg:border-r lg:pr-12 xl:pr-16 text-left",
                    reversed
                      ? "lg:order-2 lg:border-r-0 lg:border-l border-gray-200 dark:border-gray-800 lg:pl-12 xl:pl-16 lg:pr-0"
                      : "border-gray-200 dark:border-gray-800",
                  ].join(" ")}
                  data-animate="up"
                  data-duration="0.7"
                >
                  <Image
                    src="/hero.png"
                    alt={`${row.image_card_title ?? row.testimonial?.title ?? "Case study"}`}
                    width={300}
                    height={400}
                    className="aspect-[29/35] h-auto w-full max-w-60 rounded-2xl object-cover ring-1 ring-border hover:scale-105 transition-all duration-300"
                    loading="lazy"
                    decoding="async"
                  />
                  <figure className="flex flex-col justify-between gap-8 text-left">
                    <blockquote className="text-lg sm:text-xl text-foreground leading-relaxed text-left">
                      <h3 className="text-lg sm:text-xl lg:text-xl font-normal text-gray-900 dark:text-white leading-relaxed text-left">
                        {row.testimonial?.title}
                        <span className="block text-gray-500 dark:text-gray-400 text-sm sm:text-base lg:text-lg mt-2">
                          {row.testimonial?.quote}
                        </span>
                      </h3>
                    </blockquote>
                    <figcaption className="flex items-center gap-6 mt-4 text-left">
                      <div className="flex flex-col gap-1">
                        <span className="text-md font-medium text-foreground">
                          {row.testimonial?.name}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {row.testimonial?.role}
                        </span>
                      </div>
                    </figcaption>
                  </figure>
                </div>

                {/* Right: Metrics */}
                <div
                  className={[
                    "grid grid-cols-1 gap-10 self-center text-left",
                    reversed ? "lg:order-1" : "",
                  ].join(" ")}
                  data-animate="up"
                  data-duration="0.7"
                  data-delay="0.1"
                >
                  {row.metrics?.map((metric, i) => (
                    <MetricStat
                      key={`${idx}-${i}`}
                      value={metric.value}
                      label={metric.label}
                      sub={metric.note}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer microcopy, disclaimers, and roadmap note */}
        {(section?.footer_microcopy?.length ?? 0) > 0 ? (
          <ul className="mt-16 flex flex-wrap justify-center gap-3" data-animate="up">
            {section.footer_microcopy!.map((item, i) => (
              <li
                key={`microcopy-${i}`}
                className="px-3 py-1 text-sm rounded-full border border-gray-200 dark:border-gray-800 text-muted-foreground"
              >
                {item}
              </li>
            ))}
          </ul>
        ) : null}

        {(section?.disclaimers?.length ?? 0) > 0 || section?.roadmap_note ? (
          <div className="mt-8 text-center space-y-2" data-animate="up" data-duration="0.6">
            {(section?.disclaimers ?? []).map((d, i) => (
              <p key={`disclaimer-${i}`} className="text-xs text-muted-foreground">
                {d}
              </p>
            ))}
            {section?.roadmap_note ? (
              <p className="text-xs text-muted-foreground">{section.roadmap_note}</p>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

