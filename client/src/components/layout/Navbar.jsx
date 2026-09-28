import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Droplet, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useUiStore from '../../store/uiStore';
import api from '../../services/api';

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const { stationSettings } = useUiStore();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Services', path: '/services' },
    { name: 'Pricing Calc', path: '/pricing' },
    { name: 'Live Queue', path: '/queue' },
    { name: 'Track Wash', path: '/track' },
    { name: 'Book Appointment', path: '/book' }
  ];

  return (
    <header
      className={`fixed top-0 inset-x-0 z-45 transition-all duration-300 ${
        isScrolled || !isHomePage
          ? 'bg-white shadow-md py-3 text-slate-800'
          : 'bg-transparent py-5 text-white'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          {stationSettings?.logoUrl ? (
            <img
              src={`${api.defaults.baseURL || ''}${stationSettings.logoUrl}`}
              alt="Logo"
              className="max-h-9 object-contain"
            />
          ) : (
            <>
              <div className="p-2 rounded-xl bg-brand-600 text-white shadow-md group-hover:scale-105 transition-transform flex items-center justify-center">
                <Droplet className="w-5 h-5 fill-current" />
              </div>
              <span className="font-extrabold text-lg tracking-tight">
                {stationSettings?.stationName || 'AQUACLEAN'}
              </span>
            </>
          )}
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className={`text-xs font-bold transition-colors hover:text-brand-500 relative py-1 ${
                location.pathname === link.path
                  ? 'text-brand-600'
                  : ''
              }`}
            >
              {link.name}
              {location.pathname === link.path && (
                <motion.div
                  layoutId="activeNavBorder"
                  className="absolute bottom-0 inset-x-0 h-0.5 bg-brand-600 rounded-full"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </Link>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden lg:block">
          <Link
            to="/admin/dashboard"
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all hover:shadow-md ${
              isScrolled || !isHomePage
                ? 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                : 'bg-white/10 text-white backdrop-blur-md hover:bg-white/20'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            CRM Login
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="lg:hidden p-2 rounded-lg hover:bg-slate-100/10 cursor-pointer"
          style={{ minHeight: '44px', minWidth: '44px' }}
          aria-label="Toggle navigation menu"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 top-[60px] bg-slate-950/50 z-30"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed top-[60px] right-0 bottom-0 w-4/5 max-w-sm bg-white shadow-xl z-40 p-6 flex flex-col gap-6"
            >
              <div className="flex flex-col gap-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    onClick={() => setIsOpen(false)}
                    className={`text-sm font-bold py-3 px-4 rounded-xl transition-all ${
                      location.pathname === link.path
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
              <div className="mt-auto border-t border-slate-100 pt-6">
                <Link
                  to="/admin/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="w-full justify-center inline-flex items-center gap-2 bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-colors"
                >
                  <ShieldAlert className="w-4 h-4" />
                  Owner CRM Login
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
