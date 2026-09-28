import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CheckCircle } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const STAGES = [
  {
    id: 'prerinse',
    title: 'Stage 1: Pre-Rinse & Mud Blasting',
    subtitle: 'High-Pressure Pre-Wash',
    desc: 'Dual-action high-pressure spray jets at 150 bar slice through heavy mud deposits, surface grit, and road grime. This prevents scratches by lifting coarse particles before hand-washing begins.',
    details: ['150 Bar pressure jets', '360° wheel-arch flush', 'Deep wheel-well decontamination'],
    color: 'from-blue-600 to-sky-500',
    accentColor: '#0284c7',
    image: 'https://images.unsplash.com/photo-1601362840469-51e4d8d59085?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'foam',
    title: 'Stage 2: Active Snow Foam Bath',
    subtitle: 'pH-Neutral Foam Treatment',
    desc: 'Our proprietary thick snow foam is applied evenly across the chassis. The electrostatic foam clings to the paint, encapsulating microscopic dust and dissolving stubborn oils without stripping existing wax.',
    details: ['Dense cling-tech foam formula', 'Safe on paint, wraps, & chrome', 'Deep dirt encapsulation'],
    color: 'from-sky-500 to-indigo-500',
    accentColor: '#38bdf8',
    image: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'underbody',
    title: 'Stage 3: Underbody Chassis Flush',
    subtitle: 'Anti-Corrosion Chassis Deck',
    desc: 'Targeted upward-facing pressure nozzles clean the often-ignored vehicle undercarriage. Sweeps away mud, road salt, and corrosive chemicals that trigger chassis rust.',
    details: ['Underside jet array', 'Corrosion-preventive flush', 'Suspension joint clearing'],
    color: 'from-indigo-600 to-purple-600',
    accentColor: '#6366f1',
    image: 'https://images.unsplash.com/photo-1507767439269-2c64f107e609?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'interior',
    title: 'Stage 4: Interior Cabin Purge',
    subtitle: 'High-Power Vacuum & Sanitize',
    desc: 'Comprehensive cabin detailing. High-power HEPA vacuums extract dust from seams and carpets, followed by dashboard conditioning and steam-disinfection of ventilation ducts.',
    details: ['HEPA vacuum extraction', 'AC duct steam sanitization', 'Dashboard UV protectant'],
    color: 'from-purple-600 to-pink-500',
    accentColor: '#a855f7',
    image: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'undercoating',
    title: 'Stage 5: Anti-Rust Undercoating',
    subtitle: 'Heavy-Duty Underbody Protection',
    desc: 'Application of a thick, rubberized bitumen protective sealant to the vehicle undercarriage. Shields structural steel, chassis components, and wheel wells from corrosion, moisture, road debris, and salt.',
    details: ['Premium rubberized bitumen sealant', 'Salt & high-humidity barrier', 'Reduces road noise & vibration'],
    color: 'from-emerald-500 to-teal-400',
    accentColor: '#10b981',
    image: 'https://images.unsplash.com/photo-1517524206127-48bbd363f3d7?auto=format&fit=crop&q=80&w=800'
  }
];

export const InteractiveWashScroller = () => {
  const containerRef = useRef(null);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isReduced) return;

    const cards = gsap.utils.toArray('.wash-step-card');
    const triggers = [];

    cards.forEach((card, idx) => {
      const trigger = ScrollTrigger.create({
        trigger: card,
        start: 'top 50%',
        end: 'bottom 50%',
        onEnter: () => setActiveStep(idx),
        onEnterBack: () => setActiveStep(idx),
      });
      triggers.push(trigger);
    });

    return () => {
      triggers.forEach(t => t.kill());
    };
  }, []);

  return (
    <div ref={containerRef} className="relative bg-slate-950 text-white w-full border-y border-slate-900">
      <div className="flex flex-col lg:flex-row relative">
        {/* Sticky Visual Panel (Left Side on Desktop) */}
        <div className="w-full lg:w-1/2 lg:h-screen lg:sticky lg:top-0 flex flex-col items-center justify-center p-6 bg-slate-950 overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-900 z-10">
          
          {/* Subtle grid background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-10 pointer-events-none" />

          {/* Indicator Label */}
          <div className="absolute top-6 left-6 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-500 animate-pulse" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Live Operations Deck
            </span>
          </div>

          {/* Core Visual Photo Frame */}
          <div className="relative w-full max-w-[480px] aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-900">
            
            {/* Ambient Background Glow matching active step */}
            <div 
              className={`absolute -inset-10 rounded-full filter blur-3xl opacity-35 transition-all duration-1000 bg-gradient-to-tr ${STAGES[activeStep].color} z-0`}
            />

            {/* Fading image sequences */}
            {STAGES.map((s, idx) => (
              <div
                key={s.id}
                className={`absolute inset-0 transition-all duration-[1200ms] ease-out z-10 ${
                  activeStep === idx 
                    ? 'opacity-100 scale-100 filter brightness-95' 
                    : 'opacity-0 scale-[1.06] pointer-events-none'
                }`}
              >
                {/* Real-life Unsplash Action Photograph */}
                <img
                  src={s.image}
                  alt={s.title}
                  className="w-full h-full object-cover select-none"
                  loading="eager"
                />
                
                {/* Premium gradient vignette overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/30" />
              </div>
            ))}

            {/* Dynamic CSS Visual FX Overlays */}
            <div className="absolute inset-0 z-20 pointer-events-none">
              
              {/* Stage 1 FX: Water spray / drops */}
              {activeStep === 0 && (
                <div className="absolute inset-0 bg-blue-500/5 transition-opacity duration-500">
                  <div className="water-drops-container">
                    <div className="water-drop-line" style={{ left: '15%', animationDelay: '0.1s' }} />
                    <div className="water-drop-line" style={{ left: '35%', animationDelay: '0.5s' }} />
                    <div className="water-drop-line" style={{ left: '55%', animationDelay: '0.3s' }} />
                    <div className="water-drop-line" style={{ left: '75%', animationDelay: '0.7s' }} />
                    <div className="water-drop-line" style={{ left: '90%', animationDelay: '0.2s' }} />
                  </div>
                </div>
              )}

              {/* Stage 2 FX: Snow foam drift */}
              {activeStep === 1 && (
                <div className="absolute inset-0 bg-white/5 transition-opacity duration-500">
                  <div className="bubble-container">
                    <div className="bubble" style={{ left: '10%', width: '12px', height: '12px', animationDelay: '0s', animationDuration: '4s' }} />
                    <div className="bubble" style={{ left: '30%', width: '16px', height: '16px', animationDelay: '1s', animationDuration: '5s' }} />
                    <div className="bubble" style={{ left: '50%', width: '10px', height: '10px', animationDelay: '0.5s', animationDuration: '3.5s' }} />
                    <div className="bubble" style={{ left: '70%', width: '14px', height: '14px', animationDelay: '1.5s', animationDuration: '4.5s' }} />
                    <div className="bubble" style={{ left: '85%', width: '8px', height: '8px', animationDelay: '0.2s', animationDuration: '3.8s' }} />
                  </div>
                </div>
              )}

              {/* Stage 3 FX: Steam/Mist rising from chassis */}
              {activeStep === 2 && (
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-sky-500/10 to-transparent">
                  <div className="mist-particles">
                    <div className="mist-particle" style={{ left: '15%', animationDelay: '0s', animationDuration: '3.5s' }} />
                    <div className="mist-particle" style={{ left: '40%', animationDelay: '0.8s', animationDuration: '4s' }} />
                    <div className="mist-particle" style={{ left: '65%', animationDelay: '0.4s', animationDuration: '3.2s' }} />
                    <div className="mist-particle" style={{ left: '85%', animationDelay: '1.2s', animationDuration: '4.5s' }} />
                  </div>
                </div>
              )}

              {/* Stage 4 FX: HEPA cabin scanline */}
              {activeStep === 3 && (
                <div className="absolute inset-x-0 top-0 h-1 bg-brand-500/40 shadow-[0_0_12px_rgba(14,165,233,0.8)] animate-scan" />
              )}

              {/* Stage 5 FX: Shield/Underbody Coating Sweep */}
              {activeStep === 4 && (
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-emerald-500/20 to-transparent border-b-4 border-emerald-500/40 animate-pulse" />
              )}
            </div>

          </div>

          {/* Stepper Status Indicators */}
          <div className="flex gap-3.5 mt-8 z-10">
            {STAGES.map((s, idx) => (
              <div 
                key={s.id}
                className="flex flex-col items-center gap-1.5 cursor-pointer"
                onClick={() => {
                  const card = document.getElementById(`wash-step-${idx}`);
                  if (card) {
                    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }}
              >
                <div 
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs border transition-all duration-300 ${
                    activeStep === idx 
                      ? 'bg-brand-600 border-brand-500 text-white shadow-md shadow-brand-500/20 scale-110'
                      : idx < activeStep
                      ? 'bg-slate-900 border-brand-700 text-brand-500'
                      : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'
                  }`}
                >
                  {idx + 1}
                </div>
                <span className={`text-[8px] font-bold uppercase tracking-wider transition-colors ${activeStep === idx ? 'text-brand-400' : 'text-slate-500'}`}>
                  {s.id === 'underbody' ? 'Chassis' : s.id === 'undercoating' ? 'Coat' : s.id.substring(0, 5)}
                </span>
              </div>
            ))}
          </div>

        </div>

        {/* Scrollable Copy Cards (Right Side) */}
        <div className="w-full lg:w-1/2 flex flex-col relative z-20">
          {STAGES.map((stage, idx) => {
            const isActive = activeStep === idx;
            return (
              <div 
                id={`wash-step-${idx}`}
                key={stage.id} 
                className="wash-step-card min-h-[70vh] lg:min-h-screen flex items-center justify-center px-6 sm:px-12 py-16 lg:py-24 border-b border-slate-900 last:border-b-0"
              >
                <div 
                  className={`max-w-md w-full bg-slate-900/40 border p-8 rounded-3xl backdrop-blur-md transition-all duration-500 ${
                    isActive 
                      ? 'border-brand-500/30 shadow-lg shadow-brand-500/5 bg-slate-900/60 scale-100' 
                      : 'border-slate-800/40 opacity-40 scale-95'
                  }`}
                >
                  {/* Badge */}
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-gradient-to-r ${stage.color} text-white inline-block mb-4`}>
                    {stage.subtitle}
                  </span>

                  <h3 className="text-2xl font-black text-white tracking-tight">
                    {stage.title}
                  </h3>

                  <p className="text-sm text-slate-400 mt-4 leading-relaxed font-light">
                    {stage.desc}
                  </p>

                  {/* Included Items Checklist */}
                  <div className="mt-6 pt-6 border-t border-slate-800 flex flex-col gap-3">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Operational Specs</span>
                    {stage.details.map((detail, dIdx) => (
                      <div key={dIdx} className="flex items-center gap-2.5">
                        <CheckCircle className={`w-4 h-4 transition-colors ${isActive ? 'text-brand-400' : 'text-slate-600'}`} />
                        <span className="text-xs font-semibold text-slate-300">{detail}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Dynamic Keyframes for Water/Foam/Steam FX */}
      <style>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0.8; }
          50% { top: 100%; opacity: 0.8; }
          100% { top: 0%; opacity: 0.8; }
        }
        .animate-scan {
          position: absolute;
          width: 100%;
          animation: scan 3s linear infinite;
        }
        
        /* Water drop lines */
        @keyframes drop-flow {
          0% { transform: translateY(-100%); opacity: 0; }
          10% { opacity: 0.7; }
          90% { opacity: 0.7; }
          100% { transform: translateY(300px); opacity: 0; }
        }
        .water-drops-container {
          position: absolute;
          inset: 0;
          overflow: hidden;
        }
        .water-drop-line {
          position: absolute;
          width: 1.5px;
          height: 70px;
          background: linear-gradient(to bottom, rgba(56, 189, 248, 0), rgba(56, 189, 248, 0.7));
          animation: drop-flow 1.2s linear infinite;
        }

        /* Bubble drift */
        @keyframes bubble-rise {
          0% { transform: translateY(320px) scale(0.8); opacity: 0; }
          20% { opacity: 0.6; }
          85% { opacity: 0.6; }
          100% { transform: translateY(-20px) scale(1.3); opacity: 0; }
        }
        .bubble-container {
          position: absolute;
          inset: 0;
          overflow: hidden;
        }
        .bubble {
          position: absolute;
          bottom: 0;
          background: rgba(255, 255, 255, 0.35);
          border: 1px solid rgba(255, 255, 255, 0.55);
          border-radius: 50%;
          animation: bubble-rise 4s ease-in-out infinite;
        }

        /* Steam particles */
        @keyframes mist-rise {
          0% { transform: translateY(100px) scale(1); opacity: 0; }
          30% { opacity: 0.35; }
          100% { transform: translateY(-150px) scale(2.2); opacity: 0; }
        }
        .mist-particles {
          position: absolute;
          inset: 0;
          overflow: hidden;
        }
        .mist-particle {
          position: absolute;
          bottom: 0;
          width: 35px;
          height: 35px;
          background: rgba(14, 165, 233, 0.12);
          filter: blur(12px);
          border-radius: 50%;
          animation: mist-rise 3s ease-out infinite;
        }
      `}</style>
    </div>
  );
};

export default InteractiveWashScroller;
