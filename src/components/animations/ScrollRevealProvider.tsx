"use client";

import React from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import ScrollTrigger from "gsap/ScrollTrigger";
import { usePathname } from "next/navigation";

let registered = false;

function registerPluginsOnce() {
  if (typeof window === "undefined") return;
  if (registered) return;
  gsap.registerPlugin(ScrollTrigger, useGSAP);
  // Reasonable global defaults (no markers in production; adjust as needed)
  ScrollTrigger.config({ ignoreMobileResize: true });
  registered = true;
}

function getFromVars(dir: string | null) {
  switch (dir) {
    case "up":
      return { opacity: 0, y: 40 };
    case "down":
      return { opacity: 0, y: -40 };
    case "left":
      return { opacity: 0, x: -40 };
    case "right":
      return { opacity: 0, x: 40 };
    case "scale":
      return { opacity: 0, scale: 0.95 };
    case "fade":
    default:
      return { opacity: 0, y: 20 };
  }
}

export default function ScrollRevealProvider() {
  const pathname = usePathname();

  registerPluginsOnce();

  // Respect reduced motion users entirely
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useGSAP(
    (_context: any) => {
      if (prefersReducedMotion) {
        // Make sure elements are visible if user prefers reduced motion
        gsap.utils.toArray<HTMLElement>("[data-animate]").forEach((el: HTMLElement) => {
          gsap.set(el, { clearProps: "all" });
        });
        return () => {};
      }

      const targets = gsap.utils.toArray<HTMLElement>("[data-animate]");

      // Set initial state to avoid FOUC
      targets.forEach((el: HTMLElement) => {
        const dir = (el.getAttribute("data-animate") || "fade").trim();
        const from = getFromVars(dir);
        gsap.set(el, { ...from, willChange: "transform, opacity" });
      });

      // Batch for performance
      ScrollTrigger.batch(targets, {
        onEnter: (batch: Element[]) => {
          gsap.to(batch as HTMLElement[], {
            opacity: 1,
            x: 0,
            y: 0,
            scale: 1,
            ease: "power2.out",
            duration: (i: number, el: Element) => Number((el as HTMLElement).getAttribute("data-duration") || 0.8),
            delay: (i: number, el: Element) => Number((el as HTMLElement).getAttribute("data-delay") || 0),
            stagger: 0.08,
            overwrite: "auto",
          });
        },
        start: "top 85%",
      });

      // Also handle elements that re-enter viewport (optional)
      ScrollTrigger.batch(targets, {
        onEnterBack: (batch: Element[]) => {
          batch.forEach((el: Element) => {
            const duration = Number(el.getAttribute("data-duration") || 0.6);
            gsap.to(el, { opacity: 1, x: 0, y: 0, scale: 1, duration, overwrite: "auto" });
          });
        },
        start: "top 95%",
      });

      // Refresh after images/fonts load
      const onLoad = () => ScrollTrigger.refresh();
      window.addEventListener("load", onLoad, { once: true });

      return () => {
        window.removeEventListener("load", onLoad);
      };
    },
    {
      dependencies: [pathname],
      revertOnUpdate: true,
    }
  );

  return null;
}
