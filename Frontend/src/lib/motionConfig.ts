// Reusable animation configurations for consistent animations across the app

export const motionConfig = {
  // Standard transition durations
  fast: { duration: 0.2 },
  normal: { duration: 0.3 },
  slow: { duration: 0.5 },
  
  // Easing functions (as strings for framer-motion)
  easeInOut: "easeInOut",
  easeOut: "easeOut",
  easeIn: "easeIn",
  
  // Card animations
  cardInitial: { opacity: 0, y: 20 },
  cardAnimate: { opacity: 1, y: 0 },
  cardTransition: { duration: 0.4 },
  
  // Page transitions
  pageInitial: { opacity: 0, y: 10 },
  pageAnimate: { opacity: 1, y: 0 },
  pageExit: { opacity: 0, y: -10 },
  pageTransition: { duration: 0.3 },
  
  // Table row animations
  rowInitial: { opacity: 0, x: -20 },
  rowAnimate: { opacity: 1, x: 0 },
  rowTransition: { duration: 0.3 },
  
  // Sidebar animations
  sidebarTransition: { duration: 0.3 },
  
  // Hover animations
  hoverScale: 1.05,
  hoverTransition: { duration: 0.2 },
};

