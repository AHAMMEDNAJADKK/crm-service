import React, { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send } from 'lucide-react';
import api from '../../services/api';
import useUiStore from '../../store/uiStore';
import Button from '../../components/ui/Button';
import FadeInSection from '../../components/animations/FadeInSection';

export const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const { addToast } = useUiStore();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      addToast('Name, Email and Message are required', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/v1/public/contact', formData);
      if (response.data?.success) {
        addToast(response.data.message || 'Message sent successfully!', 'success');
        setFormData({ name: '', email: '', mobile: '', subject: '', message: '' });
      }
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to submit contact request', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 pt-28 pb-20 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <FadeInSection>
            <span className="text-xs font-extrabold text-brand-600 bg-brand-50 border border-brand-200/50 px-3 py-1 rounded-full uppercase tracking-widest">
              Get in Touch
            </span>
            <h1 className="text-3xl sm:text-5xl font-black text-slate-800 tracking-tight mt-4">
              We are Here to Help
            </h1>
            <p className="text-sm text-slate-500 mt-4 leading-relaxed">
              Have questions about your vehicle, booking slots, or custom requirements? Drop us a message, or call our direct helpline.
            </p>
          </FadeInSection>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Details & Map */}
          <div className="flex flex-col gap-8">
            {/* Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-white p-5 rounded-2xl border border-slate-200/50 flex gap-4">
                <div className="p-3 rounded-xl bg-brand-50 text-brand-600 shrink-0 h-fit">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Station Address</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">Plot 42, Service Lane, Sector 62, Noida, UP - 201301</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/50 flex gap-4">
                <div className="p-3 rounded-xl bg-brand-50 text-brand-600 shrink-0 h-fit">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Direct Helpline</h4>
                  <p className="text-xs text-slate-500 mt-1"><a href="tel:+919539691738" className="hover:text-brand-600">+91 9539691738</a></p>
                  <p className="text-xs text-slate-500 mt-0.5">Toll Free: 1800 200 4567</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/50 flex gap-4">
                <div className="p-3 rounded-xl bg-brand-50 text-brand-600 shrink-0 h-fit">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Email Address</h4>
                  <p className="text-xs text-slate-500 mt-1"><a href="mailto:support@autocare.com" className="hover:text-brand-600">support@autocare.com</a></p>
                  <p className="text-xs text-slate-500 mt-0.5"><a href="mailto:business@autocare.com" className="hover:text-brand-600">business@autocare.com</a></p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/50 flex gap-4">
                <div className="p-3 rounded-xl bg-brand-50 text-brand-600 shrink-0 h-fit">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Working Hours</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">Mon - Sat: 09:00 AM - 07:00 PM</p>
                  <p className="text-xs text-slate-500 mt-0.5">Sunday: Closed</p>
                </div>
              </div>
            </div>

            {/* Embedded Google Map */}
            <div className="w-full h-80 rounded-2xl overflow-hidden shadow-sm border border-slate-200/50">
              <iframe
                title="AutoCare Location Map"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3502.5620626372583!2d77.3621453150821!3d28.612863982424458!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390ce566fc6881c1%3A0xed499e0df9f68e42!2sSector%2062%2C%20Noida%2C%20Uttar%20Pradesh!5e0!3m2!1sen!2sin!4v1655000000000!5m2!1sen!2sin"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
              />
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200/50 shadow-sm">
            <h3 className="text-xl font-extrabold text-slate-800 mb-2">Send us a Message</h3>
            <p className="text-xs text-slate-400 mb-8 leading-relaxed">Fill out the details below. We will answer your inquiry within 24 business hours.</p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="name" className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your name"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="mobile" className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Mobile Number (Optional)</label>
                  <input
                    type="tel"
                    id="mobile"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleInputChange}
                    placeholder="Enter 10-digit mobile"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label htmlFor="subject" className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Subject (Optional)</label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    placeholder="Subject of inquiry"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="message" className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Message</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  rows="4"
                  placeholder="How can we assist you?"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 resize-none"
                  required
                />
              </div>

              <Button
                type="submit"
                isLoading={loading}
                icon={Send}
                className="w-full py-3 mt-4"
              >
                Send Message
              </Button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Contact;
