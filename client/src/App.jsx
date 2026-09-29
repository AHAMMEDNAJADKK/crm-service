import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import useAuthStore from './store/authStore';
import useUiStore from './store/uiStore';
import { ToastContainer } from './components/ui/Toast';
import Spinner from './components/ui/Spinner';

// Layouts
import AdminSidebar from './components/layout/AdminSidebar';
import AdminHeader from './components/layout/AdminHeader';
import GlobalSearchModal from './components/search/GlobalSearchModal';
import NewServiceModal from './components/jobs/NewServiceModal';

// Admin CRM Pages
import Login from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import Customers from './pages/admin/Customers';
import Vehicles from './pages/admin/Vehicles';
import WashJobs from './pages/admin/WashJobs';
import ServiceHistory from './pages/admin/ServiceHistory';
import ServiceCalendar from './pages/admin/ServiceCalendar';
import PricingEditor from './pages/admin/PricingEditor';
import Billing from './pages/admin/Billing';
import Expenses from './pages/admin/Expenses';
import Outstanding from './pages/admin/Outstanding';
import Reports from './pages/admin/Reports';
import Settings from './pages/admin/Settings';
import Staff from './pages/admin/Staff';
import Inventory from './pages/admin/Inventory';
import Appointments from './pages/admin/Appointments';
import FuelLogs from './pages/admin/FuelLogs';
import Ledger from './pages/admin/Ledger';

// Admin Guard & Layout Wrapper
const AdminLayout = ({ children, onOpenNewService }) => {
  const { isAuthenticated, isCheckingAuth } = useAuthStore();
  const location = useLocation();

  if (isCheckingAuth) {
    return <Spinner fullPage size="lg" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-navy-900 transition-colors">
      <AdminSidebar onOpenNewService={onOpenNewService} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader onOpenNewService={onOpenNewService} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 bg-slate-50/50 dark:bg-navy-900/50 transition-colors">
          {children}
        </main>
      </div>
    </div>
  );
};

export const App = () => {
  const { checkAuth, isCheckingAuth } = useAuthStore();
  const { fetchStationSettings, initTheme } = useUiStore();
  const [isNewServiceModalOpen, setIsNewServiceModalOpen] = useState(false);

  useEffect(() => {
    initTheme();
    checkAuth();
    fetchStationSettings();
  }, [checkAuth, fetchStationSettings, initTheme]);

  if (isCheckingAuth) {
    return <Spinner fullPage size="lg" />;
  }

  return (
    <>
      <Routes>
        {/* Root redirect directly to internal CRM Dashboard or Login */}
        <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />

        {/* Admin Login Route (No sidebar) */}
        <Route path="/admin/login" element={<Login />} />

        {/* Dedicated CRM Operations & Accounting Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <AdminLayout onOpenNewService={() => setIsNewServiceModalOpen(true)}>
              <Dashboard onOpenNewService={() => setIsNewServiceModalOpen(true)} />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/customers"
          element={
            <AdminLayout onOpenNewService={() => setIsNewServiceModalOpen(true)}>
              <Customers />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/vehicles"
          element={
            <AdminLayout onOpenNewService={() => setIsNewServiceModalOpen(true)}>
              <Vehicles />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/jobs"
          element={
            <AdminLayout onOpenNewService={() => setIsNewServiceModalOpen(true)}>
              <WashJobs />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/history"
          element={
            <AdminLayout onOpenNewService={() => setIsNewServiceModalOpen(true)}>
              <ServiceHistory />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/calendar"
          element={
            <AdminLayout onOpenNewService={() => setIsNewServiceModalOpen(true)}>
              <ServiceCalendar />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/settings/pricing"
          element={
            <AdminLayout onOpenNewService={() => setIsNewServiceModalOpen(true)}>
              <PricingEditor />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/billing"
          element={
            <AdminLayout onOpenNewService={() => setIsNewServiceModalOpen(true)}>
              <Billing />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/expenses"
          element={
            <AdminLayout onOpenNewService={() => setIsNewServiceModalOpen(true)}>
              <Expenses />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/outstanding"
          element={
            <AdminLayout onOpenNewService={() => setIsNewServiceModalOpen(true)}>
              <Outstanding />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <AdminLayout onOpenNewService={() => setIsNewServiceModalOpen(true)}>
              <Reports />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <AdminLayout onOpenNewService={() => setIsNewServiceModalOpen(true)}>
              <Settings />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/staff"
          element={
            <AdminLayout onOpenNewService={() => setIsNewServiceModalOpen(true)}>
              <Staff />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/inventory"
          element={
            <AdminLayout onOpenNewService={() => setIsNewServiceModalOpen(true)}>
              <Inventory />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/appointments"
          element={
            <AdminLayout onOpenNewService={() => setIsNewServiceModalOpen(true)}>
              <Appointments />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/fuel-logs"
          element={
            <AdminLayout onOpenNewService={() => setIsNewServiceModalOpen(true)}>
              <FuelLogs />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/ledger"
          element={
            <AdminLayout onOpenNewService={() => setIsNewServiceModalOpen(true)}>
              <Ledger />
            </AdminLayout>
          }
        />

        {/* Fallback to Dashboard */}
        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
      </Routes>

      {/* Global Command-K Search Palette */}
      <GlobalSearchModal />

      {/* Global New Service Modal */}
      {isNewServiceModalOpen && (
        <NewServiceModal
          onClose={() => setIsNewServiceModalOpen(false)}
          onSuccess={() => setIsNewServiceModalOpen(false)}
        />
      )}

      {/* Global Alerts Container */}
      <ToastContainer />
    </>
  );
};

export default App;
