import React from 'react';
import { Link } from 'react-router-dom';
import { Droplet, Phone, Mail, MapPin, Facebook, Twitter, Instagram } from 'lucide-react';
import useUiStore from '../../store/uiStore';
import api from '../../services/api';

export const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { stationSettings } = useUiStore();

  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 grid grid-cols-1 md:grid-cols-4 gap-10">
        
        {/* Brand Info */}
        <div className="flex flex-col gap-4">
          <Link to="/" className="flex items-center gap-2 text-white">
            {stationSettings?.logoUrl ? (
              <img
                src={`${api.defaults.baseURL || ''}${stationSettings.logoUrl}`}
                alt="Logo"
                className="max-h-9 object-contain"
              />
            ) : (
              <>
                <div className="p-2 rounded-xl bg-brand-600 text-white flex items-center justify-center">
                  <Droplet className="w-5 h-5 fill-current" />
                </div>
                <span className="font-extrabold text-lg tracking-tight">
                  {stationSettings?.stationName || 'AQUACLEAN'}
                </span>
              </>
            )}
          </Link>
          <p className="text-sm leading-relaxed text-slate-400">
            Premium high-pressure washes, eco-friendly water recycling, and rapid queue systems for all vehicle types.
          </p>
          <div className="flex gap-4.5 mt-2">
            <a href="#" className="p-2 rounded-lg bg-slate-800 hover:bg-brand-600 hover:text-white transition-colors" style={{ minWidth: '40px', minHeight: '40px' }} aria-label="Facebook">
              <Facebook className="w-5 h-5" />
            </a>
            <a href="#" className="p-2 rounded-lg bg-slate-800 hover:bg-brand-600 hover:text-white transition-colors" style={{ minWidth: '40px', minHeight: '40px' }} aria-label="Twitter">
              <Twitter className="w-5 h-5" />
            </a>
            <a href="#" className="p-2 rounded-lg bg-slate-800 hover:bg-brand-600 hover:text-white transition-colors" style={{ minWidth: '40px', minHeight: '40px' }} aria-label="Instagram">
              <Instagram className="w-5 h-5" />
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Wash Services</h4>
          <ul className="space-y-2.5 text-sm">
            <li><Link to="/pricing" className="hover:text-white transition-colors">High Pressure Rinse</Link></li>
            <li><Link to="/pricing" className="hover:text-white transition-colors">Deep Underbody Deck</Link></li>
            <li><Link to="/pricing" className="hover:text-white transition-colors">Interior Steam & Polish</Link></li>
            <li><Link to="/pricing" className="hover:text-white transition-colors">Engine Bay Degreasing</Link></li>
            <li><Link to="/pricing" className="hover:text-white transition-colors">Special Polymer Detailing</Link></li>
          </ul>
        </div>

        {/* Navigation */}
        <div>
          <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Useful Links</h4>
          <ul className="space-y-2.5 text-sm">
            <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
            <li><Link to="/contact" className="hover:text-white transition-colors">Get In Touch</Link></li>
            <li><Link to="/book" className="hover:text-white transition-colors">Book Online Slot</Link></li>
            <li><Link to="/track" className="hover:text-white transition-colors">Live Wash Tracker</Link></li>
            <li><Link to="/queue" className="hover:text-white transition-colors">Live Lobby TV Board</Link></li>
          </ul>
        </div>

        {/* Contact Info */}
        <div>
          <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Contact Details</h4>
          <ul className="space-y-3.5 text-sm">
            <li className="flex items-start gap-2.5">
              <MapPin className="w-5 h-5 text-brand-500 shrink-0" />
              <span>{stationSettings?.address || 'Plot 42, Bypass Road, Ernakulam, Kerala - 682024'}</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Phone className="w-5 h-5 text-brand-500 shrink-0" />
              <a href={`tel:${stationSettings?.phone || '9539691738'}`} className="hover:text-white">
                +91 {stationSettings?.phone || '9539691738'}
              </a>
            </li>
            <li className="flex items-center gap-2.5">
              <Mail className="w-5 h-5 text-brand-500 shrink-0" />
              <a href="mailto:support@aquaclean.com" className="hover:text-white">support@aquaclean.com</a>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 border-t border-slate-800/80 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-4">
        <span>© {currentYear} {stationSettings?.stationName || 'AquaClean'}. All rights reserved. GSTIN: {stationSettings?.gstNumber || '32AAAAA0000A1Z2'}</span>
        <div className="flex gap-6">
          <a href="#" className="hover:text-slate-400">Privacy Policy</a>
          <a href="#" className="hover:text-slate-400">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
