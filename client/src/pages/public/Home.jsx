import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Sparkles, Droplet, Award, ChevronRight, Star, Clock, Zap } from 'lucide-react';
import ParallaxHero from '../../components/animations/ParallaxHero';
import FadeInSection from '../../components/animations/FadeInSection';
import CounterUp from '../../components/animations/CounterUp';
import ScrollReveal from '../../components/animations/ScrollReveal';
import InteractiveWashScroller from '../../components/animations/InteractiveWashScroller';

export const Home = () => {
  const stats = [
    { label: 'Vehicles Cleaned', value: 25400, suffix: '+' },
    { label: 'Water Saved (Recycled)', value: 65, suffix: '%' },
    { label: 'Average Wash Duration', value: 20, suffix: ' Mins' },
    { label: 'Customer Rating', value: 49, suffix: '/5' }
  ];

  const coreServices = [
    { title: 'High-Pressure Water Rinse', desc: 'Powerful multi-angle water jets to remove caked mud and grime quickly.', icon: Droplet },
    { title: 'Underbody Clean Deck', desc: 'Dedicated under-chassis spraying arrays to wash off salt and rust generators.', icon: ShieldCheck },
    { title: 'Interior Vacuum & Steam', desc: 'Full interior cabin vacuuming, dashboard polishing, and deep floor mat wash.', icon: Sparkles },
    { title: 'Detailing & Polymer Wax', desc: 'Premium body polishing and long-lasting paint protector sealant coating.', icon: Award }
  ];

  return (
    <div className="overflow-hidden">
      {/* 1. HERO SECTION WITH PARALLAX */}
      <ParallaxHero
        backgroundImage="https://images.unsplash.com/photo-1520340356584-f9917d1eed69?auto=format&fit=crop&q=80&w=1600"
        className="min-h-screen flex items-center justify-center text-white pt-16"
      >
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 flex flex-col items-center gap-6 z-10">
          <FadeInSection yOffset={40} duration={1}>
            <span className="px-3.5 py-1.5 rounded-full bg-brand-500/20 text-brand-300 font-bold text-xs uppercase tracking-widest border border-brand-500/30">
              Kerala's #1 Vehicle Wash Station
            </span>
          </FadeInSection>

          {/* Hero text */}
          <FadeInSection delay={0.2} yOffset={40} duration={1}>
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight">
              Sparkling Spotless <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-sky-400">
                Water Servicing
              </span>
            </h1>
          </FadeInSection>

          <FadeInSection delay={0.4} yOffset={40} duration={1}>
            <p className="text-lg sm:text-xl text-slate-300 max-w-2xl font-light leading-relaxed">
              Premium high-pressure washes, eco-friendly water recycling, and rapid waitlist tracking for all vehicle types in Kochi.
            </p>
          </FadeInSection>

          <FadeInSection delay={0.6} yOffset={40} duration={1} className="flex flex-wrap justify-center gap-4 mt-4">
            <Link
              to="/book"
              className="px-6 py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-lg transition-transform hover:-translate-y-0.5"
            >
              Book Service Slot
            </Link>
            <Link
              to="/track"
              className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl backdrop-blur-md transition-transform hover:-translate-y-0.5 border border-white/20"
            >
              Track Wash Status
            </Link>
            <Link
              to="/queue"
              className="px-6 py-3.5 bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 font-bold rounded-xl transition-all border border-sky-600/30"
            >
              Live TV Queue Board
            </Link>
          </FadeInSection>
        </div>
      </ParallaxHero>

      {/* 2. STATS SECTION (COUNTER UP) */}
      <section className="py-12 bg-slate-900 text-white border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal stagger={0.1} className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, i) => (
              <div key={i} className="flex flex-col gap-2">
                <CounterUp
                  end={stat.value}
                  suffix={stat.suffix}
                  className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-sky-450"
                />
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{stat.label}</span>
              </div>
            ))}
          </ScrollReveal>
        </div>
      </section>

      {/* 3. CORE SERVICES WITH SCROLLING ANIMATION */}
      <section className="bg-slate-950 pt-20 border-b border-slate-900 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-10">
          <FadeInSection>
            <span className="text-xs font-extrabold text-brand-400 bg-brand-500/10 border border-brand-500/20 px-3.5 py-1.5 rounded-full uppercase tracking-widest">
              The Washing Experience
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mt-5">
              Precision Water Servicing
            </h2>
            <p className="text-sm text-slate-400 mt-4 max-w-xl mx-auto leading-relaxed font-light">
              Scroll down to watch our signature 5-Stage AquaClean cycle in action. Designed to clean deeply while preserving paintwork.
            </p>
          </FadeInSection>
        </div>
        <InteractiveWashScroller />
      </section>

      {/* 4. DRIVETRANS RECYCLING BANNER */}
      <section className="py-20 bg-slate-900 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <ScrollReveal>
            <span className="text-[10px] font-bold text-brand-400 uppercase tracking-widest block mb-2">Sustainable Cleaning</span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Eco-Water Recycling Systems</h2>
            <p className="text-sm text-slate-400 mt-6 leading-relaxed">
              At AquaClean Kochi, we care about the environment. Our state-of-the-art recycling unit filters, aerates, and recycles wash water, ensuring we consume up to 60% less ground water than typical hand washes.
            </p>
            
            <div className="flex gap-6 mt-8">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-brand-400" />
                <span className="text-xs font-bold">100% Biodegradable Shampoos</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-brand-400" />
                <span className="text-xs font-bold">Rain Water Harvesting Arrays</span>
              </div>
            </div>
          </ScrollReveal>
          
          <ScrollReveal className="relative aspect-video rounded-3xl overflow-hidden border border-slate-800">
            <img src="https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&q=80&w=800" alt="Recycling deck" className="w-full h-full object-cover" />
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
};

export default Home;
