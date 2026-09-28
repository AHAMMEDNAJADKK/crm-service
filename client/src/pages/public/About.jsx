import React from 'react';
import { Award, ShieldAlert, HeartHandshake, ArrowRight } from 'lucide-react';
import FadeInSection from '../../components/animations/FadeInSection';
import ScrollReveal from '../../components/animations/ScrollReveal';

export const About = () => {
  const milestones = [
    {
      year: '2012',
      title: 'Our Inception',
      desc: 'AutoCare was founded in Noida with a single service bay and a promise of absolute transparency.'
    },
    {
      year: '2016',
      title: 'Facility Expansion',
      desc: 'Upgraded to a 6-bay layout and established computerized electrical scan bays, servicing 5,000+ vehicles.'
    },
    {
      year: '2020',
      title: 'Digital CRM Rollout',
      desc: 'Launched our live status portals and digitized inventory logging, providing real-time transparency for customer cards.'
    },
    {
      year: '2026',
      title: 'Today & Beyond',
      desc: 'AutoCare is now Noida’s top independent garage, restoring over 12,000 vehicles annually with certified mechanics.'
    }
  ];

  return (
    <div className="bg-white pt-28 pb-20 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Intro Section */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <FadeInSection>
            <span className="text-xs font-extrabold text-brand-600 bg-brand-50 border border-brand-200/50 px-3 py-1 rounded-full uppercase tracking-widest">
              Who We Are
            </span>
            <h1 className="text-3xl sm:text-5xl font-black text-slate-800 tracking-tight mt-4">
              Pioneering Automotive Care
            </h1>
            <p className="text-sm text-slate-500 mt-4 leading-relaxed">
              We are a team of passionate engineers and mechanics dedicated to redefining the workshop experience. Our foundation is built on transparency, quality craftsmanship, and digital innovation.
            </p>
          </FadeInSection>
        </div>

        {/* Feature Split Banner Section (Added premium real photo layout) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-24">
          <ScrollReveal>
            <span className="text-[10px] font-bold text-brand-600 uppercase tracking-widest block mb-2">Our Standard</span>
            <h2 className="text-2xl sm:text-4.5xl font-black text-slate-800 tracking-tight leading-tight">
              Real Professionals. <br />
              Genuine Craftsmanship.
            </h2>
            <p className="text-sm text-slate-500 mt-6 leading-relaxed">
              We believe a vehicle is more than just transportation—it is a valuable investment. That is why we employ certified mechanics who work in a state-of-the-art facility equipped with precision diagnostic instruments and dedicated underbody anti-rust bays.
            </p>
            <p className="text-sm text-slate-500 mt-4 leading-relaxed">
              Every appointment undergoes rigorous QA inspection. No cheap tricks, no cartoon overlays—just pure mechanical diligence and professional washing care.
            </p>
            <div className="flex gap-4 mt-8">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-600" />
                <span className="text-xs font-bold text-slate-700">Certified Technicians</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-600" />
                <span className="text-xs font-bold text-slate-700">Genuine Spares Only</span>
              </div>
            </div>
          </ScrollReveal>
          
          <ScrollReveal className="relative aspect-[4/3] rounded-3xl overflow-hidden border border-slate-200/60 shadow-xl bg-slate-100">
            <img 
              src="https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=800" 
              alt="Real professional auto service bay" 
              className="w-full h-full object-cover select-none"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 to-transparent" />
          </ScrollReveal>
        </div>

        {/* Core Values Section */}
        <ScrollReveal stagger={0.12} className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-24">
          {[
            { title: 'Zero Compromise Quality', desc: 'All replacement parts are sourced directly from authorized brand suppliers, ensuring factory-standard repairs.', icon: Award },
            { title: 'Absolute Transparency', desc: 'Through digital job cards, customer portals, and immediate SMS receipts, you approve every repair item before we touch it.', icon: ShieldAlert },
            { title: 'Passionate Service', desc: 'We do not just patch issues. We conduct root-cause diagnostic analyses to keep your vehicle reliable long-term.', icon: HeartHandshake }
          ].map((v, i) => {
            const Icon = v.icon;
            return (
              <div key={i} className="p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-md transition-shadow">
                <div className="p-3 bg-white text-brand-600 rounded-xl w-fit shadow-xs">
                  <Icon className="w-5.5 h-5.5" />
                </div>
                <h3 className="text-base font-bold text-slate-800 mt-5">{v.title}</h3>
                <p className="text-sm text-slate-500 mt-2.5 leading-relaxed">{v.desc}</p>
              </div>
            );
          })}
        </ScrollReveal>
 
        {/* Timeline Section */}
        <div className="bg-slate-50/50 rounded-3xl py-16 px-6 md:px-12 border border-slate-100">
          <div className="text-center mb-16">
            <FadeInSection>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800">Our Journey</h2>
              <p className="text-sm text-slate-400 mt-2">Milestones that shaped our station.</p>
            </FadeInSection>
          </div>

          {/* Timeline vertical tree */}
          <div className="relative border-l border-slate-200 ml-4 md:ml-32">
            {milestones.map((ml, idx) => (
              <div key={idx} className="mb-12 last:mb-0 relative pl-8">
                {/* Timeline Dot */}
                <div className="absolute -left-3 top-1.5 w-6 h-6 rounded-full bg-brand-600 border-4 border-white shadow-sm flex items-center justify-center text-white" />
                
                {/* Timeline Content */}
                <FadeInSection yOffset={30}>
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    {/* Year Label */}
                    <div className="text-lg font-black text-brand-600 bg-brand-50 border border-brand-200/50 px-3 py-0.5 rounded-lg w-fit md:absolute md:-left-36 md:w-28 md:text-right md:bg-transparent md:border-0 md:p-0">
                      {ml.year}
                    </div>
                    {/* Card */}
                    <div className="bg-white border border-slate-200/60 p-5 rounded-2xl shadow-xs hover:shadow-sm transition-shadow max-w-xl">
                      <h4 className="font-extrabold text-slate-800 text-base">{ml.title}</h4>
                      <p className="text-sm text-slate-500 mt-2 leading-relaxed">{ml.desc}</p>
                    </div>
                  </div>
                </FadeInSection>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default About;
