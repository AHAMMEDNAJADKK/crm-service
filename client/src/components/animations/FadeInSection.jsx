import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const FadeInSection = ({
  children,
  delay = 0,
  duration = 0.8,
  yOffset = 50,
  className = ''
}) => {
  const elementRef = useRef(null);

  useEffect(() => {
    const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (isReduced) {
      // Skip animations, set immediate visible state
      gsap.set(elementRef.current, { opacity: 1, y: 0 });
      return;
    }

    const element = elementRef.current;
    
    gsap.fromTo(
      element,
      { opacity: 0, y: yOffset },
      {
        opacity: 1,
        y: 0,
        duration: duration,
        delay: delay,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: element,
          start: 'top 85%', // Trigger when top of element reaches 85% of viewport
          toggleActions: 'play none none none', // Play only once
          markers: false
        }
      }
    );

    return () => {
      // Kill trigger to prevent memory leaks on unmount
      ScrollTrigger.getAll().forEach(trigger => {
        if (trigger.trigger === element) trigger.kill();
      });
    };
  }, [delay, duration, yOffset]);

  return (
    <div ref={elementRef} className={className}>
      {children}
    </div>
  );
};

export default FadeInSection;
