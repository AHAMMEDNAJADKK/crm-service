import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, User, Car, Clock, ArrowRight, Phone, MapPin } from 'lucide-react';
import api from '../../services/api';
import useUiStore from '../../store/uiStore';
import formatCurrency from '../../utils/formatCurrency';

export const GlobalSearchModal = () => {
  const { globalSearchOpen, closeGlobalSearch } = useUiStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState({ customers: [], vehicles: [], jobs: [] });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Focus input when modal opens
  useEffect(() => {
    if (globalSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setSearchTerm('');
      setResults({ customers: [], vehicles: [], jobs: [] });
    }
  }, [globalSearchOpen]);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        useUiStore.getState().openGlobalSearch();
      } else if (e.key === 'Escape' && globalSearchOpen) {
        closeGlobalSearch();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [globalSearchOpen, closeGlobalSearch]);

  // Debounced search query
  useEffect(() => {
    if (!searchTerm.trim()) {
      setResults({ customers: [], vehicles: [], jobs: [] });
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/api/v1/admin/reports/search?q=${encodeURIComponent(searchTerm.trim())}`);
        if (data?.success) {
          setResults(data.data);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  if (!globalSearchOpen) return null;

  const handleSelectCustomer = (customer) => {
    closeGlobalSearch();
    navigate(`/admin/customers?search=${encodeURIComponent(customer.mobile || customer.name)}`);
  };

  const handleSelectVehicle = (vehicle) => {
    closeGlobalSearch();
    navigate(`/admin/vehicles?search=${encodeURIComponent(vehicle.regNumber)}`);
  };

  const handleSelectJob = (job) => {
    closeGlobalSearch();
    navigate(`/admin/jobs?search=${encodeURIComponent(job.tokenNumber || job.vehicleReg)}`);
  };

  const totalResults = results.customers.length + results.vehicles.length + results.jobs.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-navy-950/70 backdrop-blur-sm animate-fade-in select-none">
      <div
        className="w-full max-w-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200 dark:border-navy-700 bg-slate-50/50 dark:bg-navy-850">
          <Search className="w-5 h-5 text-brand-500 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by customer, Malayalam name, phone, plate number (KL 11...), token..."
            className="w-full bg-transparent text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none font-medium"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 mr-2"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={closeGlobalSearch}
            className="text-[11px] font-bold px-2 py-1 bg-slate-200 dark:bg-navy-750 text-slate-600 dark:text-slate-300 rounded-md"
          >
            ESC
          </button>
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading && (
            <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500 font-semibold">
              Searching AHAMMED SONS database...
            </div>
          )}

          {!loading && searchTerm.trim() && totalResults === 0 && (
            <div className="py-12 text-center space-y-1">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No records found</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                No customer, vehicle, or job matched "{searchTerm}"
              </p>
            </div>
          )}

          {/* Customers */}
          {results.customers.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 block">
                Customers ({results.customers.length})
              </span>
              <div className="space-y-1">
                {results.customers.map((c) => (
                  <div
                    key={c._id}
                    onClick={() => handleSelectCustomer(c)}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-navy-800 cursor-pointer transition-colors border border-transparent hover:border-slate-200 dark:hover:border-navy-700"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{c.name}</span>
                          {c.nameMalayalam && (
                            <span className="text-xs text-brand-600 dark:text-brand-400 font-malayalam">
                              ({c.nameMalayalam})
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                          <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {c.mobile}</span>
                          {c.place && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {c.place}</span>}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Vehicles */}
          {results.vehicles.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 block">
                Vehicles ({results.vehicles.length})
              </span>
              <div className="space-y-1">
                {results.vehicles.map((v) => (
                  <div
                    key={v._id}
                    onClick={() => handleSelectVehicle(v)}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-navy-800 cursor-pointer transition-colors border border-transparent hover:border-slate-200 dark:hover:border-navy-700"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <Car className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black tracking-wider text-slate-900 dark:text-white uppercase font-mono">
                            {v.regNumber}
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-navy-750 text-slate-600 dark:text-slate-300 uppercase">
                            {v.vehicleType}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {v.brand} {v.model} {v.variant ? `(${v.variant})` : ''} {v.customerId?.name ? `• Owner: ${v.customerId.name}` : ''}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Jobs */}
          {results.jobs.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 block">
                Service Jobs ({results.jobs.length})
              </span>
              <div className="space-y-1">
                {results.jobs.map((j) => (
                  <div
                    key={j._id}
                    onClick={() => handleSelectJob(j)}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-navy-800 cursor-pointer transition-colors border border-transparent hover:border-slate-200 dark:hover:border-navy-700"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-brand-600 dark:text-brand-400">
                            {j.tokenNumber}
                          </span>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase font-mono">
                            {j.vehicleReg}
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-navy-750 text-slate-600 dark:text-slate-300">
                            {j.serviceName || j.washPackage}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Amount: {formatCurrency(j.finalAmount || j.price)} • Status: <span className="uppercase font-semibold">{j.status}</span>
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-slate-100/70 dark:bg-navy-950/60 border-t border-slate-200 dark:border-navy-700 flex items-center justify-between text-[11px] text-slate-400">
          <span>Search customers, Malayalam names, vehicle plates, or service jobs</span>
          <span className="font-mono">Ctrl + K</span>
        </div>
      </div>
    </div>
  );
};

export default GlobalSearchModal;
