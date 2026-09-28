import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const ParallaxHero = ({
  children,
  backgroundImage,
  className = ''
}) => {
  const containerRef = useRef(null);
  const backgroundRef = useRef(null);

  useEffect(() => {
    const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isReduced) return;

    const container = containerRef.current;
    const background = backgroundRef.current;

    gsap.fromTo(
      background,
      { y: '-10%' },
      {
        y: '10%',
        ease: 'none',
        scrollTrigger: {
          trigger: container,
          start: 'top top',
          end: 'bottom top',
          scrub: true
        }
      }
    );

    return () => {
      ScrollTrigger.getAll().forEach(trigger => {
        if (trigger.trigger === container) trigger.kill();
      });
    };
  }, []);

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${className}`}>
      {/* Parallax Background */}
      <div
        ref={backgroundRef}
        className="absolute inset-x-0 -top-[15%] -bottom-[15%] bg-cover bg-center -z-10 brightness-40"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      />
      {children}
    </div>
  );
};

export default ParallaxHero;
