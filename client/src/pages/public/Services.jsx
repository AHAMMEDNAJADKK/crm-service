import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Wrench,
  ShieldAlert,
  Sparkles,
  Award,
  Zap,
  Gauge,
  Clock,
  Droplet,
  Check,
  Minus,
  ShieldCheck,
  Info
} from 'lucide-react';
import FadeInSection from '../../components/animations/FadeInSection';
import ScrollReveal from '../../components/animations/ScrollReveal';

export const Services = () => {
  const [activeTab, setActiveTab] = useState('water'); // 'water' or 'mechanical'

  const mechanicalServiceList = [
    {
      title: 'Full Vehicle Service',
      price: 'Starting at ₹2,499',
      desc: 'Complete bumper-to-bumper vehicle inspection, filter swaps, fluid level checks, oil changes, engine flush, spark plug replacements, and brake pads cleaning.',
      icon: Wrench
    },
    {
      title: 'Brake Systems Maintenance',
      price: 'Starting at ₹899',
      desc: 'Comprehensive brake pad replacement, rotor machining, brake fluid flush, hydraulic cylinder checks, calliper lubrication, and brake test runs.',
      icon: ShieldAlert
    },
    {
      title: 'Suspension & Steering Calibration',
      price: 'Starting at ₹1,499',
      desc: 'Shock absorber diagnostic, strut replacement, ball joint greasing, alignment adjustments, steering rack tuning, and bushing replacements.',
      icon: Gauge
    },
    {
      title: 'Electrical Diagnostics & Care',
      price: 'Starting at ₹599',
      desc: 'ECU scan diagnostics, battery health check, alternator inspection, wiring harnesses troubleshoot, fuse repairs, and dashboard sensor checks.',
      icon: Zap
    },
    {
      title: 'AC Recharging & Cleaning',
      price: 'Starting at ₹1,199',
      desc: 'Refrigerant leak detection, compressor diagnostics, AC gas recharging, cabin pollen filter cleaning, blower fan servicing, and sanitization.',
      icon: Sparkles
    },
    {
      title: 'Wheel Alignment & Balancing',
      price: 'Starting at ₹699',
      desc: 'Precision laser wheel alignment, tire balancing using lead counterweights, rotation, thread depth checks, and tire pressure adjustments.',
      icon: Award
    }
  ];

  const waterServiceList = [
    {
      title: 'Basic Wash',
      price: 'Starting at ₹299',
      desc: 'Quick exterior rinse, high-pressure foam spraying, and soft microfiber wipe down. Ideal for routine cleanups.',
      icon: Droplet,
      features: ['High-Pressure Rinse', 'Foam Shampoo Spray', 'Microfiber Hand Dry', 'Tire Dressing']
    },
    {
      title: 'Full Wash',
      price: 'Starting at ₹599',
      desc: 'Premium exterior wash combined with a dedicated underbody flush and detailed wheel/rim scrub to remove salt and mud.',
      icon: ShieldCheck,
      features: ['Basic Wash Included', 'Underbody Chassis Flush', 'Deep Wheel & Rim Scrub', 'Bumper Dressing']
    },
    {
      title: 'Interior Wash',
      price: 'Starting at ₹499',
      desc: 'Deep sanitization of cabin space. Includes full interior vacuuming, dashboard conditioning, glass cleaning, and mat deep wash.',
      icon: Sparkles,
      features: ['High-Power HEPA Vacuum', 'Dashboard Conditioning', 'Glass & Mirror Polish', 'Anti-Odor Purge']
    },
    {
      title: 'Full + Interior Combo',
      price: 'Starting at ₹999',
      desc: 'Our most popular wash package. Combines the comprehensive Full Wash with deep Interior Cabin detailing.',
      icon: Award,
      features: ['Full Wash Included', 'Complete Interior Wash', 'Trunk Vacuum & Clean', 'Air Vent Sanitization']
    },
    {
      title: 'Engine Bay Steam Clean',
      price: 'Starting at ₹799',
      desc: 'Safe engine compartment degreasing using specialized steam cleaning. Cleans off oil residues and dirt without damaging electronics.',
      icon: Wrench,
      features: ['Engine Bay Degreasing', 'Dry Steam Wash', 'Connector Protection', 'Plastic Trim Conditioning']
    },
    {
      title: 'Undercoating Protection',
      price: 'Starting at ₹1,999',
      desc: 'Premium chassis protection. Application of heavy-duty rubberized bitumen sealant on the vehicle undercarriage to block rust, moisture, and road debris.',
      icon: ShieldCheck,
      features: ['Underbody Wash & Degrease', 'Bitumen Rubberized Coating', 'Wheel Arch Spray Sealant', 'Anti-Corrosion Shield']
    }
  ];

  // Comparison Matrix data structure
  const comparisonFeatures = [
    { name: 'High-Pressure Rinse', basic: true, full: true, interior: false, combo: true, engine: false, detail: true },
    { name: 'Snow Foam Bath', basic: true, full: true, interior: false, combo: true, engine: false, detail: true },
    { name: 'Underbody Chassis Flush', basic: false, full: true, interior: false, combo: true, engine: false, detail: true },
    { name: 'Alloy & Rim Scrub', basic: false, full: true, interior: false, combo: true, engine: false, detail: true },
    { name: 'Cabin HEPA Vacuuming', basic: false, full: false, interior: true, combo: true, engine: false, detail: true },
    { name: 'Dashboard Polishing & UV Care', basic: false, full: false, interior: true, combo: true, engine: false, detail: true },
    { name: 'Engine Steam Cleaning & Degrease', basic: false, full: false, interior: false, combo: false, engine: true, detail: false },
    { name: 'Anti-Rust Undercoating Sealant', basic: false, full: false, interior: false, combo: false, engine: false, detail: true }
  ];

  return (
    <div className="bg-slate-50 pt-28 pb-20 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <FadeInSection>
            <span className="text-xs font-extrabold text-brand-600 bg-brand-50 border border-brand-200/50 px-3 py-1 rounded-full uppercase tracking-widest">
              Workshop Solutions
            </span>
            <h1 className="text-3xl sm:text-5xl font-black text-slate-800 tracking-tight mt-4">
              Premium Vehicle Services
            </h1>
            <p className="text-sm text-slate-500 mt-4 leading-relaxed">
              From advanced eco-friendly water wash treatments to expert mechanical repairs and tuning, explore our specialized solutions below.
            </p>
          </FadeInSection>
        </div>

        {/* Dynamic Navigation Tabs */}
        <div className="flex justify-center mb-16">
          <div className="bg-slate-200/60 p-1.5 rounded-2xl flex gap-1 relative z-0 border border-slate-300/30">
            <button
              onClick={() => setActiveTab('water')}
              className={`relative px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer ${
                activeTab === 'water' ? 'text-brand-700' : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              Water Servicing & Detailing
              {activeTab === 'water' && (
                <motion.div
                  layoutId="activeServiceTab"
                  className="absolute inset-0 bg-white rounded-xl shadow-xs -z-10"
                  transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab('mechanical')}
              className={`relative px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer ${
                activeTab === 'mechanical' ? 'text-brand-700' : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              Mechanical & Garage Care
              {activeTab === 'mechanical' && (
                <motion.div
                  layoutId="activeServiceTab"
                  className="absolute inset-0 bg-white rounded-xl shadow-xs -z-10"
                  transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                />
              )}
            </button>
          </div>
        </div>

        {/* Tab 1: Water Servicing Content */}
        {activeTab === 'water' && (
          <div>
            <ScrollReveal stagger={0.08} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
              {waterServiceList.map((srv, idx) => {
                const Icon = srv.icon;
                return (
                  <div
                    key={idx}
                    className="bg-white border border-slate-200/50 rounded-3xl p-7 shadow-xs hover:shadow-xl transition-all hover:-translate-y-1.5 duration-300 flex flex-col group relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/5 rounded-bl-full pointer-events-none group-hover:bg-brand-500/10 transition-colors" />
                    
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="p-3.5 rounded-2xl bg-brand-50 text-brand-600 group-hover:bg-brand-600 group-hover:text-white transition-colors">
                        <Icon className="w-5.5 h-5.5" />
                      </div>
                      <span className="text-sm font-extrabold text-slate-700 bg-slate-100/80 px-3.5 py-1 rounded-xl">
                        {srv.price}
                      </span>
                    </div>

                    {/* Content */}
                    <h3 className="text-lg font-black text-slate-800 mt-6 group-hover:text-brand-600 transition-colors">
                      {srv.title}
                    </h3>
                    
                    <p className="text-xs text-slate-500 mt-3 leading-relaxed flex-grow">
                      {srv.desc}
                    </p>

                    {/* Feature Bullets */}
                    <div className="mt-5 mb-6 pt-5 border-t border-slate-100 flex flex-col gap-2">
                      {srv.features.map((feat, fIdx) => (
                        <div key={fIdx} className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" />
                          <span className="text-xs text-slate-600 font-semibold">{feat}</span>
                        </div>
                      ))}
                    </div>

                    {/* Action CTA */}
                    <div className="border-t border-slate-100 pt-5 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        Eco-Wash (20-40m)
                      </span>
                      <Link
                        to="/book"
                        state={{ preSelectedService: srv.title }}
                        className="px-4 py-2 rounded-xl bg-brand-50 text-brand-600 hover:bg-brand-600 hover:text-white font-bold text-xs transition-all shadow-xs"
                      >
                        Book wash
                      </Link>
                    </div>
                  </div>
                );
              })}
            </ScrollReveal>

            {/* Wash Package Comparison Matrix Table */}
            <FadeInSection>
              <div className="bg-white border border-slate-200/50 rounded-3xl p-6 sm:p-8 shadow-xs max-w-5xl mx-auto">
                <div className="flex items-center gap-2.5 mb-6">
                  <Info className="w-5.5 h-5.5 text-brand-500" />
                  <div>
                    <h3 className="text-lg font-black text-slate-800">Wash Package Comparison Matrix</h3>
                    <p className="text-xs text-slate-400">See exactly what is included in each professional water wash package.</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Features</th>
                        <th className="py-4 px-3 text-xs font-bold text-slate-600 uppercase text-center bg-slate-50/50 rounded-t-xl">Basic</th>
                        <th className="py-4 px-3 text-xs font-bold text-slate-600 uppercase text-center">Full</th>
                        <th className="py-4 px-3 text-xs font-bold text-slate-600 uppercase text-center bg-slate-50/50">Interior</th>
                        <th className="py-4 px-3 text-xs font-bold text-slate-600 uppercase text-center">Combo</th>
                        <th className="py-4 px-3 text-xs font-bold text-slate-600 uppercase text-center bg-slate-50/50">Engine</th>
                        <th className="py-4 px-3 text-xs font-bold text-slate-600 uppercase text-center rounded-t-xl">Detail</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {comparisonFeatures.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                          <td className="py-4 px-4 text-xs font-bold text-slate-700">{row.name}</td>
                          <td className="py-4 px-3 text-center bg-slate-50/30">
                            {row.basic ? <Check className="w-4 h-4 text-emerald-500 mx-auto" /> : <Minus className="w-4 h-4 text-slate-300 mx-auto" />}
                          </td>
                          <td className="py-4 px-3 text-center">
                            {row.full ? <Check className="w-4 h-4 text-emerald-500 mx-auto" /> : <Minus className="w-4 h-4 text-slate-300 mx-auto" />}
                          </td>
                          <td className="py-4 px-3 text-center bg-slate-50/30">
                            {row.interior ? <Check className="w-4 h-4 text-emerald-500 mx-auto" /> : <Minus className="w-4 h-4 text-slate-300 mx-auto" />}
                          </td>
                          <td className="py-4 px-3 text-center">
                            {row.combo ? <Check className="w-4 h-4 text-emerald-500 mx-auto" /> : <Minus className="w-4 h-4 text-slate-300 mx-auto" />}
                          </td>
                          <td className="py-4 px-3 text-center bg-slate-50/30">
                            {row.engine ? <Check className="w-4 h-4 text-emerald-500 mx-auto" /> : <Minus className="w-4 h-4 text-slate-300 mx-auto" />}
                          </td>
                          <td className="py-4 px-3 text-center">
                            {row.detail ? <Check className="w-4 h-4 text-emerald-500 mx-auto" /> : <Minus className="w-4 h-4 text-slate-300 mx-auto" />}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </FadeInSection>
          </div>
        )}

        {/* Tab 2: Mechanical Services Content */}
        {activeTab === 'mechanical' && (
          <ScrollReveal stagger={0.08} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {mechanicalServiceList.map((srv, idx) => {
              const Icon = srv.icon;
              return (
                <div
                  key={idx}
                  className="bg-white border border-slate-200/50 rounded-3xl p-7 shadow-xs hover:shadow-xl transition-all hover:-translate-y-1.5 duration-300 flex flex-col group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/5 rounded-bl-full pointer-events-none group-hover:bg-brand-500/10 transition-colors" />
                  
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="p-3.5 rounded-2xl bg-brand-50 text-brand-600 group-hover:bg-brand-600 group-hover:text-white transition-colors">
                      <Icon className="w-5.5 h-5.5" />
                    </div>
                    <span className="text-sm font-extrabold text-slate-700 bg-slate-100/80 px-3.5 py-1 rounded-xl">
                      {srv.price}
                    </span>
                  </div>

                  {/* Content */}
                  <h3 className="text-lg font-black text-slate-800 mt-6 group-hover:text-brand-600 transition-colors">
                    {srv.title}
                  </h3>
                  
                  <p className="text-xs text-slate-500 mt-3 leading-relaxed flex-grow">
                    {srv.desc}
                  </p>

                  {/* Action CTA */}
                  <div className="border-t border-slate-100 pt-5 mt-6 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Same Day Service
                    </span>
                    <Link
                      to="/book"
                      state={{ preSelectedService: srv.title }}
                      className="px-4 py-2 rounded-xl bg-brand-50 text-brand-600 hover:bg-brand-600 hover:text-white font-bold text-xs transition-colors"
                    >
                      Book slot
                    </Link>
                  </div>
                </div>
              );
            })}
          </ScrollReveal>
        )}
      </div>
    </div>
  );
};

export default Services;
