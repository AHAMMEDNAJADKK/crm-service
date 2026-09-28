import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Phone, ShieldCheck, Droplet } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useUiStore from '../../store/uiStore';
import api from '../../services/api';
import Button from '../../components/ui/Button';

export const Login = () => {
  const [mobile, setMobile] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, isAuthenticated } = useAuthStore();
  const { addToast, stationSettings } = useUiStore();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!mobile || !pin) {
      setError('Please enter both registered mobile number and PIN');
      return;
    }

    if (pin.length !== 4 || isNaN(pin)) {
      setError('Security PIN must be a 4-digit number');
      return;
    }

    setLoading(true);
    const result = await login(mobile, pin);
    setLoading(false);

    if (result.success) {
      addToast('Welcome back to AHAMMED SONS WATER SERVICE CRM!', 'success');
      navigate('/admin/dashboard');
    } else {
      setError(result.error || 'Invalid credentials');
      addToast(result.error || 'Login failed', 'error');
    }
  };

  const logoUrl = stationSettings?.logoUrl || '/uploads/logo/station-logo.jpg';

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-950 px-4 sm:px-6 py-12 relative overflow-hidden select-none">
      {/* Decorative navy/water backdrop gradients */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-brand-600/10 blur-[130px] -z-10" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-cyan-600/10 blur-[130px] -z-10" />

      <div className="max-w-md w-full flex flex-col items-center">
        {/* Official Station Branding */}
        <div className="flex flex-col items-center gap-3 text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-navy-900 border border-navy-750 flex items-center justify-center p-2 shadow-xl shadow-black/40">
            <img
              src={`${api.defaults.baseURL || ''}${logoUrl}`}
              alt="AHAMMED SONS Logo"
              className="w-full h-full object-contain"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
          <div>
            <span className="font-black text-lg text-white tracking-wider uppercase block">
              AHAMMED SONS WATER SERVICE
            </span>
            <span className="text-[10px] text-brand-400 font-extrabold uppercase tracking-widest block mt-0.5">
              INTERNAL CRM & BUSINESS MANAGEMENT
            </span>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-navy-900/90 border border-navy-750 rounded-3xl p-8 shadow-2xl backdrop-blur-md w-full">
          <div className="text-center mb-7">
            <h2 className="text-lg font-black text-white flex items-center justify-center gap-2 uppercase tracking-wide">
              <ShieldCheck className="w-5 h-5 text-brand-400" />
              Sign In to Station Console
            </h2>
            <p className="text-xs text-slate-400 mt-1.5">
              Enter registered mobile and security PIN to access CRM
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-xs font-semibold text-red-400 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Mobile number */}
            <div>
              <label htmlFor="mobile" className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">
                Registered Mobile
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                <input
                  type="text"
                  id="mobile"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="9539691738"
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-navy-950 border border-navy-700 text-sm text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors placeholder-slate-600 font-medium"
                  required
                />
              </div>
            </div>

            {/* 4-digit PIN */}
            <div>
              <label htmlFor="pin" className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">
                4-Digit Security PIN
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                <input
                  type="password"
                  id="pin"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  maxLength={4}
                  placeholder="••••"
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-navy-950 border border-navy-700 text-sm text-white tracking-widest focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors placeholder-slate-600 font-mono"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              isLoading={loading}
              className="w-full py-3.5 mt-2 text-xs font-black uppercase tracking-wider shadow-lg shadow-brand-600/20 cursor-pointer"
            >
              Access Business CRM
            </Button>
          </form>

          {/* Quick login hint */}
          <div className="mt-6 pt-5 border-t border-navy-800 text-center">
            <p className="text-[11px] text-slate-400">
              Default Owner Account: <strong className="text-white font-mono">9539691738</strong> • PIN: <strong className="text-white font-mono">0000</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
