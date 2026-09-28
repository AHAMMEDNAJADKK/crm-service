import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import useAuthStore from './store/authStore';
import useUiStore from './store/uiStore';
import { ToastContainer } from './components/ui/Toast';
import Spinner from './components/ui/Spinner';

// Layouts
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import AdminSidebar from './components/layout/AdminSidebar';
import AdminHeader from './components/layout/AdminHeader';

// Public Pages
import Home from './pages/public/Home';
import Services from './pages/public/Services';
import About from './pages/public/About';
import Contact from './pages/public/Contact';
import BookAppointment from './pages/public/BookAppointment';
import Pricing from './pages/public/Pricing';
import TrackWash from './pages/public/TrackWash';
import QueueDisplay from './pages/public/QueueDisplay';

// Admin Pages
import Login from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import Customers from './pages/admin/Customers';
import Vehicles from './pages/admin/Vehicles';
import WashJobs from './pages/admin/WashJobs';
import PricingEditor from './pages/admin/PricingEditor';
import Inventory from './pages/admin/Inventory';
import Billing from './pages/admin/Billing';
import Appointments from './pages/admin/Appointments';
import Staff from './pages/admin/Staff';
import Expenses from './pages/admin/Expenses';
import FuelLogs from './pages/admin/FuelLogs';
import Reports from './pages/admin/Reports';
import Settings from './pages/admin/Settings';
import Ledger from './pages/admin/Ledger';

// Public Layout Wrapper
const PublicLayout = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  );
};

// Admin Guard & Layout Wrapper
const AdminLayout = ({ children }) => {
  const { isAuthenticated, isCheckingAuth } = useAuthStore();
  const location = useLocation();

  if (isCheckingAuth) {
    return <Spinner fullPage size="lg" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader />
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50/50">
          {children}
        </main>
      </div>
    </div>
  );
};

export const App = () => {
  const { checkAuth, isCheckingAuth } = useAuthStore();
  const { fetchStationSettings } = useUiStore();

  useEffect(() => {
    checkAuth();
    fetchStationSettings();
  }, [checkAuth, fetchStationSettings]);

  if (isCheckingAuth) {
    return <Spinner fullPage size="lg" />;
  }

  return (
    <>
      <Routes>
        {/* Public Pages with standard layout */}
        <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
        <Route path="/services" element={<PublicLayout><Services /></PublicLayout>} />
        <Route path="/about" element={<PublicLayout><About /></PublicLayout>} />
        <Route path="/contact" element={<PublicLayout><Contact /></PublicLayout>} />
        <Route path="/book" element={<PublicLayout><BookAppointment /></PublicLayout>} />
        <Route path="/pricing" element={<PublicLayout><Pricing /></PublicLayout>} />
        <Route path="/track" element={<PublicLayout><TrackWash /></PublicLayout>} />

        {/* TV display board (No Header/Footer) */}
        <Route path="/queue" element={<QueueDisplay />} />

        {/* Admin Login Route (No sidebar) */}
        <Route path="/admin/login" element={<Login />} />

        {/* Admin CRM Dashboard Pages */}
        <Route path="/admin/dashboard" element={<AdminLayout><Dashboard /></AdminLayout>} />
        <Route path="/admin/customers" element={<AdminLayout><Customers /></AdminLayout>} />
        <Route path="/admin/vehicles" element={<AdminLayout><Vehicles /></AdminLayout>} />
        <Route path="/admin/jobs" element={<AdminLayout><WashJobs /></AdminLayout>} />
        <Route path="/admin/settings/pricing" element={<AdminLayout><PricingEditor /></AdminLayout>} />
        <Route path="/admin/ledger" element={<AdminLayout><Ledger /></AdminLayout>} />
        <Route path="/admin/inventory" element={<AdminLayout><Inventory /></AdminLayout>} />
        <Route path="/admin/billing" element={<AdminLayout><Billing /></AdminLayout>} />
        <Route path="/admin/appointments" element={<AdminLayout><Appointments /></AdminLayout>} />
        <Route path="/admin/staff" element={<AdminLayout><Staff /></AdminLayout>} />
        <Route path="/admin/expenses" element={<AdminLayout><Expenses /></AdminLayout>} />
        <Route path="/admin/fuel-logs" element={<AdminLayout><FuelLogs /></AdminLayout>} />
        <Route path="/admin/reports" element={<AdminLayout><Reports /></AdminLayout>} />
        <Route path="/admin/settings" element={<AdminLayout><Settings /></AdminLayout>} />

        {/* Fallback to Home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      
      {/* Global Alerts Container */}
      <ToastContainer />
    </>
  );
};

export default App;
