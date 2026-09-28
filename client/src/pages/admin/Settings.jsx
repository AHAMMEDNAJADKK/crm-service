import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings as SettingsIcon, ShieldCheck, Mail, Sliders, BellRing, Lock, Droplet, Upload, Save } from 'lucide-react';

import api from '../../services/api';
import useUiStore from '../../store/uiStore';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';

export const Settings = () => {
  const queryClient = useQueryClient();
  const { addToast } = useUiStore();

  const [tab, setTab] = useState('profile'); // 'profile', 'sms', 'security'

  // PIN Form states
  const [pinForm, setPinForm] = useState({
    currentPin: '',
    newPin: '',
    confirmPin: ''
  });
  const [pinError, setPinError] = useState('');

  // Logo upload state variables
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Fetch Settings
  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['adminSettings'],
    queryFn: async () => {
      const { data } = await api.get('/api/v1/admin/settings');
      return data.data;
    }
  });

  const [formData, setFormData] = useState(null);

  React.useEffect(() => {
    if (settingsData && !formData) {
      setFormData({
        stationName: settingsData.stationName || '',
        mobile: settingsData.mobile || '',
        email: settingsData.email || '',
        address: settingsData.address || '',
        gstNumber: settingsData.gstNumber || '',
        gstRate: settingsData.gstRate || 0,
        waterRatePerLitre: settingsData.waterRatePerLitre || 0.15,
        activeBaysCount: settingsData.activeBaysCount || 3,
        dailyCapacityPerSlot: settingsData.dailyCapacityPerSlot || 5,
        logoUrl: settingsData.logoUrl || '',
        workingHours: {
          opensAt: settingsData.workingHours?.opensAt || '09:00 AM',
          closesAt: settingsData.workingHours?.closesAt || '07:00 PM'
        },
        smsTemplates: {
          bookingConfirmation: settingsData.smsTemplates?.bookingConfirmation || '',
          jobStatusUpdate: settingsData.smsTemplates?.jobStatusUpdate || '',
          paymentReminder: settingsData.smsTemplates?.paymentReminder || ''
        }
      });
    }
  }, [settingsData, formData]);

  // Save Settings Mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (payload) => {
      return await api.put('/api/v1/admin/settings', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSettings'] });
      addToast('System settings updated successfully!', 'success');
    },
    onError: (err) => {
      addToast(err.response?.data?.error || 'Failed to update settings.', 'error');
    }
  });

  // Logo Upload Mutation
  const uploadLogoMutation = useMutation({
    mutationFn: async (file) => {
      const formDataObj = new FormData();
      formDataObj.append('logo', file);
      const { data } = await api.post('/api/v1/admin/settings/logo', formDataObj, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percent);
        }
      });
      return data;
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['adminSettings'] });
      addToast('Logo uploaded successfully!', 'success');
      setLogoPreview(null);
      setLogoFile(null);
      setUploadProgress(0);
      setFormData(prev => ({ ...prev, logoUrl: res.logoUrl }));
    },
    onError: (err) => {
      addToast(err.response?.data?.error || 'Failed to upload logo', 'error');
      setUploadProgress(0);
    }
  });

  // Remove Logo Mutation
  const removeLogoMutation = useMutation({
    mutationFn: async () => {
      return await api.delete('/api/v1/admin/settings/logo');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSettings'] });
      addToast('Logo removed successfully!', 'success');
      setFormData(prev => ({ ...prev, logoUrl: '' }));
    },
    onError: (err) => {
      addToast('Failed to remove logo', 'error');
    }
  });

  // Change PIN Mutation
  const changePinMutation = useMutation({
    mutationFn: async (payload) => {
      return await api.post('/api/v1/admin/settings/pin', payload);
    },
    onSuccess: () => {
      addToast('Credentials security PIN updated!', 'success');
      setPinForm({ currentPin: '', newPin: '', confirmPin: '' });
      setPinError('');
    },
    onError: (err) => {
      setPinError(err.response?.data?.error || 'PIN update failed');
      addToast(err.response?.data?.error || 'PIN update failed', 'error');
    }
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNestedChange = (parent, name, value) => {
    setFormData((prev) => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [name]: value
      }
    }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    saveSettingsMutation.mutate(formData);
  };

  const handleLogoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      addToast('Logo file size must be less than 5MB', 'error');
      return;
    }

    setLogoFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveLogo = () => {
    if (logoFile) {
      uploadLogoMutation.mutate(logoFile);
    }
  };

  const handleRemoveLogo = () => {
    if (window.confirm('Are you sure you want to remove the logo?')) {
      removeLogoMutation.mutate();
    }
  };

  const handlePinSubmit = (e) => {
    e.preventDefault();
    setPinError('');

    if (pinForm.newPin.length !== 4 || isNaN(pinForm.newPin)) {
      setPinError('New PIN must be a 4-digit number');
      return;
    }

    if (pinForm.newPin !== pinForm.confirmPin) {
      setPinError('New PIN and Confirm PIN do not match');
      return;
    }

    changePinMutation.mutate({
      currentPin: pinForm.currentPin,
      newPin: pinForm.newPin
    });
  };

  if (isLoading || !formData) {
    return (
      <div className="h-full flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">System Settings</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Configure business water rates, cleaning decks, brand logos, and PIN access controls.</p>
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-navy-900 border border-slate-200/60 dark:border-navy-700/60 p-2.5 rounded-2xl flex flex-col gap-1.5 shadow-xs">
            <button
              onClick={() => setTab('profile')}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                tab === 'profile'
                  ? 'bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 border border-brand-100/50 dark:border-brand-800/40'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-navy-800'
              }`}
            >
              <Sliders className="w-4 h-4" />
              Station Profile
            </button>
            <button
              onClick={() => setTab('sms')}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                tab === 'sms'
                  ? 'bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 border border-brand-100/50 dark:border-brand-800/40'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-navy-800'
              }`}
            >
              <BellRing className="w-4 h-4" />
              SMS Templates
            </button>
            <button
              onClick={() => setTab('security')}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                tab === 'security'
                  ? 'bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 border border-brand-100/50 dark:border-brand-800/40'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-navy-800'
              }`}
            >
              <Lock className="w-4 h-4" />
              Console Security
            </button>
          </div>
        </div>

        {/* Content Box */}
        <div className="lg:col-span-3">
          
          {/* TAB 1: PROFILE */}
          {tab === 'profile' && (
            <Card title="Station Profile Details">
              <div className="flex flex-col gap-5">
                
                {/* Station Logo Upload Panel */}
                <div className="border-b border-slate-100 pb-5 mb-2">
                  <span className="block text-xs font-bold text-slate-500 uppercase mb-3">Station Logo</span>
                  
                  {formData.logoUrl ? (
                    <div className="flex items-center gap-4 bg-slate-50 p-4 border border-slate-200/50 rounded-xl w-fit">
                      <img
                        src={`${api.defaults.baseURL || ''}${formData.logoUrl}`}
                        alt="Station Logo"
                        className="max-h-16 object-contain rounded-lg border border-white bg-white shadow-xs"
                      />
                      <div className="flex flex-col gap-1.5">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={handleRemoveLogo}
                          isLoading={removeLogoMutation.isPending}
                        >
                          Remove Logo
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {logoPreview ? (
                        <div className="flex items-center gap-4 bg-slate-50 p-4 border border-slate-200/50 rounded-xl w-fit">
                          <img
                            src={logoPreview}
                            alt="Logo Preview"
                            className="max-h-16 object-contain rounded-lg border border-white bg-white shadow-xs"
                          />
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              onClick={handleSaveLogo}
                              isLoading={uploadLogoMutation.isPending}
                            >
                              Save Logo
                            </Button>
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={() => {
                                setLogoPreview(null);
                                setLogoFile(null);
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="max-w-md">
                          <label className="border-2 border-dashed border-slate-200 hover:border-brand-450 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors text-center bg-slate-50/50 hover:bg-slate-50">
                            <Upload className="w-8 h-8 text-slate-400 mb-2 animate-pulse" />
                            <span className="text-xs font-bold text-slate-600 block">Upload Station Logo</span>
                            <span className="text-[10px] text-slate-400 mt-1 block">PNG, JPG, WEBP, SVG (Max 5MB)</span>
                            <input
                              type="file"
                              accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml"
                              onChange={handleLogoSelect}
                              className="hidden"
                            />
                          </label>
                        </div>
                      )}
                      
                      {uploadProgress > 0 && (
                        <div className="w-full max-w-md bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-brand-600 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Main Settings Form */}
                <form onSubmit={handleFormSubmit} className="flex flex-col gap-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="stationName" className="block text-xs font-bold text-slate-500 uppercase mb-2">Station Name</label>
                      <input
                        type="text"
                        id="stationName"
                        name="stationName"
                        value={formData.stationName}
                        onChange={handleInputChange}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="settingsMobile" className="block text-xs font-bold text-slate-500 uppercase mb-2">Primary Mobile</label>
                      <input
                        type="tel"
                        id="settingsMobile"
                        name="mobile"
                        value={formData.mobile}
                        onChange={handleInputChange}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="settingsEmail" className="block text-xs font-bold text-slate-500 uppercase mb-2">Support Email</label>
                      <input
                        type="email"
                        id="settingsEmail"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="gstNumber" className="block text-xs font-bold text-slate-500 uppercase mb-2">GSTIN Tax Registration</label>
                      <input
                        type="text"
                        id="gstNumber"
                        name="gstNumber"
                        value={formData.gstNumber}
                        onChange={handleInputChange}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm uppercase"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-100 pt-4">
                    <div>
                      <label htmlFor="gstRate" className="block text-xs font-bold text-slate-500 uppercase mb-2">GST Tax Rate (%)</label>
                      <input
                        type="number"
                        id="gstRate"
                        name="gstRate"
                        value={formData.gstRate}
                        onChange={handleInputChange}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm font-semibold"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="waterRatePerLitre" className="block text-xs font-bold text-slate-500 uppercase mb-2">Water Rate (₹/Litre)</label>
                      <input
                        type="number"
                        step={0.01}
                        id="waterRatePerLitre"
                        name="waterRatePerLitre"
                        value={formData.waterRatePerLitre}
                        onChange={handleInputChange}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm font-semibold"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="activeBaysCount" className="block text-xs font-bold text-slate-500 uppercase mb-2">Active Service Bays</label>
                      <input
                        type="number"
                        id="activeBaysCount"
                        name="activeBaysCount"
                        value={formData.activeBaysCount}
                        onChange={handleInputChange}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm font-semibold"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-100 pt-4">
                    <div>
                      <label htmlFor="dailyCapacityPerSlot" className="block text-xs font-bold text-slate-500 uppercase mb-2">Slot Booking Capacity</label>
                      <input
                        type="number"
                        id="dailyCapacityPerSlot"
                        name="dailyCapacityPerSlot"
                        value={formData.dailyCapacityPerSlot}
                        onChange={handleInputChange}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm font-semibold"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="opensAt" className="block text-xs font-bold text-slate-500 uppercase mb-2">Opens At</label>
                      <input
                        type="text"
                        id="opensAt"
                        value={formData.workingHours.opensAt}
                        onChange={(e) => handleNestedChange('workingHours', 'opensAt', e.target.value)}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="closesAt" className="block text-xs font-bold text-slate-500 uppercase mb-2">Closes At</label>
                      <input
                        type="text"
                        id="closesAt"
                        value={formData.workingHours.closesAt}
                        onChange={(e) => handleNestedChange('workingHours', 'closesAt', e.target.value)}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="settingsAddress" className="block text-xs font-bold text-slate-500 uppercase mb-2">Station Address</label>
                    <input
                      type="text"
                      id="settingsAddress"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm"
                      required
                    />
                  </div>

                  <div className="flex justify-end pt-3 border-t border-slate-100">
                    <Button type="submit" isLoading={saveSettingsMutation.isPending}>
                      Save Profile Changes
                    </Button>
                  </div>
                </form>
              </div>
            </Card>
          )}

          {/* TAB 2: SMS TEMPLATES */}
          {tab === 'sms' && (
            <Card title="SMS Notification Templates" subtitle="Auto-dispatched triggers. Use parameters {customerName}, {tokenNumber}, {status} in configurations.">
              <form onSubmit={handleFormSubmit} className="flex flex-col gap-5">
                <div>
                  <label htmlFor="bookingConfirmation" className="block text-xs font-bold text-slate-500 uppercase mb-2">Booking Confirmation</label>
                  <textarea
                    id="bookingConfirmation"
                    value={formData.smsTemplates.bookingConfirmation}
                    onChange={(e) => handleNestedChange('smsTemplates', 'bookingConfirmation', e.target.value)}
                    rows="3"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm resize-none font-medium"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="jobStatusUpdate" className="block text-xs font-bold text-slate-500 uppercase mb-2">Wash Progress Alerts</label>
                  <textarea
                    id="jobStatusUpdate"
                    value={formData.smsTemplates.jobStatusUpdate}
                    onChange={(e) => handleNestedChange('smsTemplates', 'jobStatusUpdate', e.target.value)}
                    rows="3"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm resize-none font-medium"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="paymentReminder" className="block text-xs font-bold text-slate-500 uppercase mb-2">Checkout / Pickup Reminders</label>
                  <textarea
                    id="paymentReminder"
                    value={formData.smsTemplates.paymentReminder}
                    onChange={(e) => handleNestedChange('smsTemplates', 'paymentReminder', e.target.value)}
                    rows="3"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm resize-none font-medium"
                    required
                  />
                </div>

                <div className="flex justify-end pt-3 border-t border-slate-100">
                  <Button type="submit" isLoading={saveSettingsMutation.isPending}>
                    Save SMS Templates
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* TAB 3: CONSOLE SECURITY */}
          {tab === 'security' && (
            <Card title="Shift Owner Access PIN" subtitle="Updates credentials to access CRM consoles. Default is '0000'.">
              <form onSubmit={handlePinSubmit} className="flex flex-col gap-5 max-w-md">
                {pinError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 rounded-xl text-xs font-bold text-center">
                    {pinError}
                  </div>
                )}
                <div>
                  <label htmlFor="currentPin" className="block text-xs font-bold text-slate-500 uppercase mb-2">Current 4-Digit PIN</label>
                  <input
                    type="password"
                    id="currentPin"
                    maxLength={4}
                    value={pinForm.currentPin}
                    onChange={(e) => setPinForm(prev => ({ ...prev, currentPin: e.target.value }))}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm tracking-widest text-slate-800"
                    placeholder="••••"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="newPin" className="block text-xs font-bold text-slate-500 uppercase mb-2">New 4-Digit PIN</label>
                  <input
                    type="password"
                    id="newPin"
                    maxLength={4}
                    value={pinForm.newPin}
                    onChange={(e) => setPinForm(prev => ({ ...prev, newPin: e.target.value }))}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm tracking-widest text-slate-800"
                    placeholder="••••"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="confirmPin" className="block text-xs font-bold text-slate-500 uppercase mb-2">Confirm New PIN</label>
                  <input
                    type="password"
                    id="confirmPin"
                    maxLength={4}
                    value={pinForm.confirmPin}
                    onChange={(e) => setPinForm(prev => ({ ...prev, confirmPin: e.target.value }))}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm tracking-widest text-slate-800"
                    placeholder="••••"
                    required
                  />
                </div>

                <div className="flex justify-end pt-3 border-t border-slate-100">
                  <Button type="submit" isLoading={changePinMutation.isPending}>
                    Shift Security PIN
                  </Button>
                </div>
              </form>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
};

export default Settings;
