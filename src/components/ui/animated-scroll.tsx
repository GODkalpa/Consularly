"use client"

import React, { useState, useEffect, useRef, useCallback } from 'react';

const pages = [
  {
    leftBgImage: '/Images/Scroll-adventure/1.png',
    rightBgImage: null,
    leftContent: null,
    rightContent: {
      heading: '1. Create Your Account',
      description: 'Get started in seconds with your email or Google account. Our streamlined registration process gets you up and running instantly, so you can focus on what matters—preparing for your visa interview.',
    },
  },
  {
    leftBgImage: null,
    rightBgImage: '/Images/Scroll-adventure/2.png',
    leftContent: {
      heading: '2. Complete Your Profile',
      description: 'Share your academic background, study goals, and program details. This personalized information allows our AI to craft interview questions that mirror the real visa officer experience, tailored specifically to your unique situation.',
    },
    rightContent: null,
  },
  {
    leftBgImage: '/Images/Scroll-adventure/3.png',
    rightBgImage: null,
    leftContent: null,
    rightContent: {
      heading: '3. Access Your Dashboard',
      description: 'Your command center for interview preparation. View available interview credits, track your session history, monitor progress over time, and access all your results in one organized hub.',
    },
  },
  {
    leftBgImage: null,
    rightBgImage: '/Images/Scroll-adventure/4.png',
    leftContent: {
      heading: '4. Start a Mock Interview',
      description: 'Choose your visa type and launch an immersive simulation. Our system verifies your camera and microphone, then places you in a realistic interview environment with AI-driven questioning that adapts to your responses.',
    },
    rightContent: null,
  },
  {
    leftBgImage: '/Images/Scroll-adventure/5.png',
    rightBgImage: null,
    leftContent: null,
    rightContent: {
      heading: '5. Review Results & Improve',
      description: 'Receive comprehensive AI-powered analysis of your performance, including detailed scoring on content quality, communication skills, and confidence. Track improvement across multiple sessions and identify exactly where to focus your preparation efforts.',
    },
  },
];

export default function ScrollAdventure() {
  const [currentPage, setCurrentPage] = useState(1);
  const [isActive, setIsActive] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileActiveIndex, setMobileActiveIndex] = useState(0);
  const numOfPages = pages.length;
  const animTime = 1000;
  const scrolling = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const mobileScrollRef = useRef<HTMLDivElement>(null);
  const isNavigating = useRef(false);

  // Detect mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Detect hash navigation from navbar
  useEffect(() => {
    const handleHashChange = () => {
      // Disable scroll adventure activation during navigation
      isNavigating.current = true;
      // Re-enable after navigation completes
      setTimeout(() => {
        isNavigating.current = false;
      }, 1500);
    };

    // Listen for clicks on anchor links
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a[href^="#"]');
      if (anchor) {
        const href = anchor.getAttribute('href');
        if (href && (href === '#testimonials' || href === '#pricing')) {
          isNavigating.current = true;
          setTimeout(() => {
            isNavigating.current = false;
          }, 1500);
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    document.addEventListener('click', handleAnchorClick, true);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      document.removeEventListener('click', handleAnchorClick, true);
    };
  }, []);

  // Track scroll position for mobile indicators
  useEffect(() => {
    if (!isMobile || !mobileScrollRef.current) return;

    const handleScroll = () => {
      const container = mobileScrollRef.current;
      if (!container) return;

      const scrollLeft = container.scrollLeft;
      const itemWidth = container.scrollWidth / pages.length;
      const index = Math.round(scrollLeft / itemWidth);
      setMobileActiveIndex(index);
    };

    const container = mobileScrollRef.current;
    container.addEventListener('scroll', handleScroll);
    
    return () => container.removeEventListener('scroll', handleScroll);
  }, [isMobile, pages.length]);

  const navigateUp = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(p => p - 1);
    } else {
      // Reached the top, exit section and allow scroll up
      setIsActive(false);
      // Re-enable body scroll immediately
      document.body.style.overflow = '';
      setTimeout(() => {
        scrolling.current = false;
      }, 100);
    }
  }, [currentPage]);

  const navigateDown = useCallback(() => {
    if (currentPage < numOfPages) {
      setCurrentPage(p => p + 1);
    } else {
      // Reached the end, exit section and allow scroll to continue
      setIsActive(false);
      setHasCompleted(true); // Mark as completed to prevent re-activation
      // Re-enable body scroll immediately
      document.body.style.overflow = '';
      // Small delay to let the browser process the scroll
      setTimeout(() => {
        scrolling.current = false;
      }, 100);
    }
  }, [currentPage, numOfPages]);

  const handleWheel = useCallback((e: WheelEvent) => {
    // Skip scroll hijacking on mobile
    if (isMobile) return;
    
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    
    // Check if section is in viewport range (within 30% of perfect alignment)
    const isNearViewport = rect.top < viewportHeight * 0.3 && rect.top > -viewportHeight * 0.3;
    const isFullyVisible = rect.top >= -10 && rect.bottom <= viewportHeight + 10;
    
    // Only activate when scrolling DOWN (but not during navigation)
    if (!isActive && !hasCompleted && isNearViewport && e.deltaY > 0 && !isNavigating.current) {
      e.preventDefault();
      
      // Snap to perfect position with smooth but quick transition
      if (!isFullyVisible) {
        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      
      // Small delay to let user see the first card before enabling navigation
      setTimeout(() => {
        setIsActive(true);
        setCurrentPage(1);
      }, 200);
      
      scrolling.current = true;
      setTimeout(() => (scrolling.current = false), animTime + 200);
      return;
    }

    // If active, handle section navigation
    if (isActive) {
      e.preventDefault();
      if (scrolling.current) return;
      
      scrolling.current = true;
      e.deltaY > 0 ? navigateDown() : navigateUp();
      setTimeout(() => (scrolling.current = false), animTime);
    }
  }, [isActive, hasCompleted, navigateDown, navigateUp, animTime, isMobile]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isActive) return;
    
    if (scrolling.current) return;
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      scrolling.current = true;
      navigateUp();
      setTimeout(() => (scrolling.current = false), animTime);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      scrolling.current = true;
      navigateDown();
      setTimeout(() => (scrolling.current = false), animTime);
    }
  }, [isActive, navigateDown, navigateUp, animTime]);

  // Intersection Observer to detect when section comes into view
  useEffect(() => {
    // Skip intersection observer on mobile
    if (isMobile) return;
    
    const container = containerRef.current;
    if (!container) return;

    let lastScrollY = window.scrollY;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const currentScrollY = window.scrollY;
        const scrollingDown = currentScrollY > lastScrollY;
        
        // Only activate when scrolling DOWN and section is mostly visible (but not during navigation)
        if (entry.isIntersecting && entry.intersectionRatio >= 0.6 && !isActive && !hasCompleted && scrollingDown && !isNavigating.current) {
          // Snap to perfect alignment with smooth scroll
          container.scrollIntoView({ behavior: 'smooth', block: 'start' });
          // Small delay to show first card before enabling navigation
          setTimeout(() => {
            setIsActive(true);
            setCurrentPage(1);
          }, 200);
        }
        
        // Reset completed flag when section is out of view
        if (!entry.isIntersecting && hasCompleted) {
          setHasCompleted(false);
        }
        
        lastScrollY = currentScrollY;
      },
      { threshold: [0, 0.5, 0.6, 0.7, 0.8] }
    );

    observer.observe(container);

    return () => observer.disconnect();
  }, [isActive, hasCompleted, isMobile]);

  useEffect(() => {
    // Skip body scroll control on mobile
    if (isMobile) {
      // On mobile, always keep normal scroll and first page
      setCurrentPage(1);
      return;
    }
    
    // Control body scroll based on active state
    if (isActive) {
      document.body.style.overflow = 'hidden';
      // Dispatch event to notify navbar to hide
      window.dispatchEvent(new CustomEvent('scrollAdventureActive', { detail: { active: true } }));
    } else {
      document.body.style.overflow = '';
      // Reset to first page when not active
      setCurrentPage(1);
      // Dispatch event to notify navbar to show
      window.dispatchEvent(new CustomEvent('scrollAdventureActive', { detail: { active: false } }));
    }
    
    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
      // Ensure navbar is visible when component unmounts
      window.dispatchEvent(new CustomEvent('scrollAdventureActive', { detail: { active: false } }));
    };
  }, [isActive, handleWheel, handleKeyDown, isMobile]);

  // Mobile: Horizontal scrollable carousel
  if (isMobile) {
    return (
      <div ref={containerRef} className="relative bg-background py-8">
        {/* Section Header */}
        <div className="container mx-auto px-4 mb-6">
          <h2 className="text-2xl font-bold text-center mb-2">How It Works</h2>
          <p className="text-sm text-muted-foreground text-center">Swipe to explore each step</p>
        </div>

        {/* Horizontal Scroll Container */}
        <div className="relative">
          {/* Gradient overlays for visual hint */}
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
          
          {/* Scrollable container */}
          <div 
            ref={mobileScrollRef}
            className="overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth"
          >
            <div className="flex gap-4 px-4 pb-2">
              {pages.map((page, i) => {
                const idx = i + 1;
                const content = page.leftContent || page.rightContent;
                const image = page.leftBgImage || page.rightBgImage;
                
                return (
                  <div 
                    key={idx} 
                    className="flex-none w-[85vw] snap-center"
                  >
                    <div className="bg-card border rounded-xl p-5 h-full shadow-sm hover:shadow-md transition-shadow">
                      {/* Step Badge */}
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-4">
                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <span className="text-[10px] font-bold text-primary-foreground">{idx}</span>
                        </div>
                        <span className="text-xs font-semibold text-primary">Step {idx} of {pages.length}</span>
                      </div>

                      {/* Image */}
                      {image && (
                        <div className="relative w-full rounded-lg overflow-hidden mb-4 bg-muted/30">
                          <img
                            src={image}
                            alt={`Step ${idx} illustration`}
                            className="w-full h-48 object-contain"
                          />
                        </div>
                      )}

                      {/* Content */}
                      {content && (
                        <div className="space-y-2.5">
                          <h3 className="text-lg font-bold leading-tight">
                            {content.heading.split('. ')[1]}
                          </h3>
                          <p className="text-sm leading-relaxed text-muted-foreground line-clamp-4">
                            {content.description}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Scroll Indicators */}
        <div className="flex justify-center gap-2 mt-6">
          {pages.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                const container = mobileScrollRef.current;
                if (container) {
                  const itemWidth = container.scrollWidth / pages.length;
                  container.scrollTo({ left: itemWidth * i, behavior: 'smooth' });
                }
              }}
              className={`transition-all duration-300 rounded-full ${
                i === mobileActiveIndex 
                  ? 'w-6 h-1.5 bg-primary' 
                  : 'w-1.5 h-1.5 bg-primary/30 hover:bg-primary/50'
              }`}
              aria-label={`Go to step ${i + 1}`}
            />
          ))}
        </div>
      </div>
    );
  }

  // Desktop: Animated scroll experience
  return (
    <div ref={containerRef} className="relative overflow-hidden h-screen bg-background">
      {/* Progress indicator */}
      <div className="absolute top-4 sm:top-6 right-4 sm:right-8 z-50 flex flex-col gap-2 sm:gap-3">
        {pages.map((_, i) => (
          <div
            key={i}
            className={`relative transition-all duration-300 ${
              currentPage === i + 1 ? 'scale-100' : 'scale-75 opacity-40'
            }`}
          >
            <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
              currentPage === i + 1 ? 'bg-primary' : 'bg-muted-foreground'
            }`} />
            {currentPage === i + 1 && (
              <div className="absolute inset-0 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-primary animate-ping opacity-75" />
            )}
          </div>
        ))}
      </div>

      {pages.map((page, i) => {
        const idx = i + 1;
        const isActive = currentPage === idx;
        const upOff = 'translateY(-100%)';
        const downOff = 'translateY(100%)';
        const leftTrans = isActive ? 'translateY(0)' : downOff;
        const rightTrans = isActive ? 'translateY(0)' : upOff;

        return (
          <div key={idx} className="absolute inset-0">
            {/* Left Half */}
            <div
              className="absolute top-0 left-0 w-full md:w-1/2 h-1/2 md:h-full transition-transform duration-1000 ease-out"
              style={{ transform: leftTrans }}
            >
              <div className="w-full h-full flex items-center justify-center p-4 sm:p-6 md:p-8 lg:p-16">
                {page.leftBgImage ? (
                  <div className="relative">
                    <img
                      src={page.leftBgImage}
                      alt="Step illustration"
                      className="max-w-full max-h-[40vh] md:max-h-[85vh] object-contain rounded-lg md:rounded-xl"
                    />
                  </div>
                ) : page.leftContent ? (
                  <div className="max-w-2xl w-full space-y-4 sm:space-y-6 md:space-y-8">
                    <div className="inline-flex items-center gap-2 sm:gap-3 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-primary/5 border border-primary/10">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary flex items-center justify-center">
                        <span className="text-[10px] sm:text-xs font-bold text-primary-foreground">{idx}</span>
                      </div>
                      <span className="text-xs sm:text-sm font-medium text-primary">Step {idx}</span>
                    </div>
                    
                    <div className="space-y-3 sm:space-y-4 md:space-y-6">
                      <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight">
                        {page.leftContent.heading.split('. ')[1]}
                      </h2>
                      <p className="text-sm sm:text-base md:text-lg lg:text-xl leading-relaxed text-muted-foreground max-w-xl">
                        {page.leftContent.description}
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Right Half */}
            <div
              className="absolute top-1/2 md:top-0 left-0 md:left-1/2 w-full md:w-1/2 h-1/2 md:h-full transition-transform duration-1000 ease-out"
              style={{ transform: rightTrans }}
            >
              <div className="w-full h-full flex items-center justify-center p-4 sm:p-6 md:p-8 lg:p-16">
                {page.rightBgImage ? (
                  <div className="relative">
                    <img
                      src={page.rightBgImage}
                      alt="Step illustration"
                      className="max-w-full max-h-[40vh] md:max-h-[85vh] object-contain rounded-lg md:rounded-xl"
                    />
                  </div>
                ) : page.rightContent ? (
                  <div className="max-w-2xl w-full space-y-4 sm:space-y-6 md:space-y-8">
                    <div className="inline-flex items-center gap-2 sm:gap-3 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-primary/5 border border-primary/10">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary flex items-center justify-center">
                        <span className="text-[10px] sm:text-xs font-bold text-primary-foreground">{idx}</span>
                      </div>
                      <span className="text-xs sm:text-sm font-medium text-primary">Step {idx}</span>
                    </div>
                    
                    <div className="space-y-3 sm:space-y-4 md:space-y-6">
                      <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight">
                        {page.rightContent.heading.split('. ')[1]}
                      </h2>
                      {typeof page.rightContent.description === 'string' ? (
                        <p className="text-sm sm:text-base md:text-lg lg:text-xl leading-relaxed text-muted-foreground max-w-xl">
                          {page.rightContent.description}
                        </p>
                      ) : (
                        <div className="text-sm sm:text-base md:text-lg lg:text-xl leading-relaxed text-muted-foreground max-w-xl">
                          {page.rightContent.description}
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
