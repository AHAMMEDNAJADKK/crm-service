import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Phone, Wrench, ShieldAlert } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useUiStore from '../../store/uiStore';
import Button from '../../components/ui/Button';

export const Login = () => {
  const [mobile, setMobile] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, isAuthenticated } = useAuthStore();
  const { addToast } = useUiStore();
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
      setError('Please enter both mobile number and PIN');
      return;
    }

    if (pin.length !== 4 || isNaN(pin)) {
      setError('PIN must be a 4-digit number');
      return;
    }

    setLoading(true);
    const result = await login(mobile, pin);
    setLoading(false);

    if (result.success) {
      addToast('Welcome back, Station Owner!', 'success');
      navigate('/admin/dashboard');
    } else {
      setError(result.error || 'Invalid credentials');
      addToast(result.error || 'Login failed', 'error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4 sm:px-6 py-12 relative overflow-hidden select-none">
      {/* Decorative backdrop gradients */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-brand-700/10 blur-[120px] -z-10" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-700/10 blur-[120px] -z-10" />

      <div className="max-w-md w-full flex flex-col items-center">
        {/* Branding */}
        <div className="flex items-center gap-2 text-white mb-8">
          <div className="p-2.5 rounded-xl bg-brand-600 shadow-lg shadow-brand-500/20">
            <Wrench className="w-6 h-6" />
          </div>
          <span className="font-extrabold text-xl tracking-wider uppercase">AUTOCARE</span>
        </div>

        {/* Login Card */}
        <div className="bg-slate-800/80 border border-slate-700/50 rounded-3xl p-8 shadow-2xl backdrop-blur-md w-full">
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-white flex items-center justify-center gap-1.5">
              <ShieldAlert className="w-5 h-5 text-brand-500" />
              Owner Console
            </h2>
            <p className="text-xs text-slate-400 mt-2">Enter credentials to access dashboards</p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-xs font-semibold text-red-400 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Mobile number */}
            <div>
              <label htmlFor="mobile" className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Registered Mobile</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                <input
                  type="text"
                  id="mobile"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="Enter 10-digit number"
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-700/80 text-sm text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors placeholder-slate-600"
                  required
                />
              </div>
            </div>

            {/* 4-digit PIN */}
            <div>
              <label htmlFor="pin" className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">4-Digit Security PIN</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                <input
                  type="password"
                  id="pin"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  maxLength={4}
                  placeholder="••••"
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-700/80 text-sm text-white tracking-widest focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors placeholder-slate-600"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              isLoading={loading}
              className="w-full py-3.5 mt-4 text-sm font-bold shadow-lg shadow-brand-500/10 cursor-pointer"
            >
              Sign In to Dashboard
            </Button>
          </form>
        </div>

        {/* Public portal redirection link */}
        <button
          onClick={() => navigate('/')}
          className="mt-6 text-xs font-semibold text-slate-500 hover:text-slate-400 transition-colors cursor-pointer"
        >
          ← Go to Public Website
        </button>
      </div>
    </div>
  );
};

export default Login;
