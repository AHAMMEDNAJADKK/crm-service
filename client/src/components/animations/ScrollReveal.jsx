import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const ScrollReveal = ({
  children,
  stagger = 0.12,
  yOffset = 40,
  duration = 0.8,
  className = ''
}) => {
  const containerRef = useRef(null);

  useEffect(() => {
    const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const container = containerRef.current;
    
    if (isReduced) {
      // Force all children visible immediately
      if (container && container.children) {
        gsap.set(Array.from(container.children), { opacity: 1, y: 0 });
      }
      return;
    }

    if (container && container.children) {
      const targets = Array.from(container.children);
      
      gsap.fromTo(
        targets,
        { opacity: 0, y: yOffset },
        {
          opacity: 1,
          y: 0,
          stagger: stagger,
          duration: duration,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: container,
            start: 'top 85%',
            toggleActions: 'play none none none'
          }
        }
      );
    }

    return () => {
      ScrollTrigger.getAll().forEach(trigger => {
        if (trigger.trigger === container) trigger.kill();
      });
    };
  }, [stagger, yOffset, duration]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
};

export default ScrollReveal;
