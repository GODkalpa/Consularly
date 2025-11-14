"use client"

import { useEffect } from "react"

export default function RevealOnScroll() {
  useEffect(() => {
    if (typeof window === "undefined") return

    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-animate]"))

    // Initialize state
    nodes.forEach((el) => {
      // Skip if already initialized
      if (el.dataset.revealInit === "1") return
      el.dataset.revealInit = "1"

      const delay = el.getAttribute("data-delay") || "0"
      const duration = el.getAttribute("data-duration") || "0.7"

      // Set initial style (hidden, slightly moved down)
      el.style.opacity = "0"
      el.style.transform = "translateY(12px)"
      el.style.transitionProperty = "opacity, transform"
      el.style.transitionTimingFunction = "cubic-bezier(0.22, 1, 0.36, 1)"
      el.style.transitionDuration = `${Number(duration) * 1000}ms`
      el.style.transitionDelay = `${Number(delay) * 1000}ms`
    })

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const el = entry.target as HTMLElement
          if (entry.isIntersecting) {
            // Reveal
            el.style.opacity = "1"
            el.style.transform = "translateY(0px)"
            // Once revealed, unobserve to avoid re-running
            io.unobserve(el)
          }
        })
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.1 }
    )

    nodes.forEach((el) => io.observe(el))

    const mo = new MutationObserver((mutations) => {
      mutations.forEach((m) => {
        m.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return
          const candidates: HTMLElement[] = []
          if (node.matches && node.matches("[data-animate]")) candidates.push(node)
          candidates.push(
            ...Array.from(node.querySelectorAll<HTMLElement>("[data-animate]"))
          )
          candidates.forEach((el) => {
            if (el.dataset.revealInit === "1") return
            el.dataset.revealInit = "1"
            const delay = el.getAttribute("data-delay") || "0"
            const duration = el.getAttribute("data-duration") || "0.7"
            el.style.opacity = "0"
            el.style.transform = "translateY(12px)"
            el.style.transitionProperty = "opacity, transform"
            el.style.transitionTimingFunction = "cubic-bezier(0.22, 1, 0.36, 1)"
            el.style.transitionDuration = `${Number(duration) * 1000}ms`
            el.style.transitionDelay = `${Number(delay) * 1000}ms`
            io.observe(el)
          })
        })
      })
    })

    mo.observe(document.body, { childList: true, subtree: true })

    return () => {
      io.disconnect()
      mo.disconnect()
    }
  }, [])

  return null
}
