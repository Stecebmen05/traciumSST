import React from 'react';
import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/sonner';
import AuthCallback from '@/pages/AuthCallback';
import Login from '@/pages/Login';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import Implementation from '@/pages/Implementation';
import Documents from '@/pages/Documents';
import HazardMatrix from '@/pages/HazardMatrix';
import Incidents from '@/pages/Incidents';
import Training from '@/pages/Training';
import Audits from '@/pages/Audits';
import Reports from '@/pages/Reports';
import Companies from '@/pages/Companies';
import UserManagement from '@/pages/UserManagement';
import ConsultantDashboard from '@/pages/ConsultantDashboard';
import AlertsConfig from '@/pages/AlertsConfig';
import Approvals from '@/pages/Approvals';
import IndicatorsArl from '@/pages/IndicatorsArl';
import MinTrabajoInspection from '@/pages/MinTrabajoInspection';

function ProtectedRoute({ children }) {
  const { user, loading, permissions } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <div className="w-8 h-8 border-2 border-[#0047AB] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  // Guard against rendering pages before permissions/context hydrate, which was
  // causing tabs (nav items) to appear missing until a manual page reload.
  if (!permissions) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <div className="w-8 h-8 border-2 border-[#0047AB] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <Layout>{children}</Layout>;
}

function AppRouter() {
  const location = useLocation();
  // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/implementation" element={<ProtectedRoute><Implementation /></ProtectedRoute>} />
      <Route path="/documents" element={<ProtectedRoute><Documents /></ProtectedRoute>} />
      <Route path="/hazards" element={<ProtectedRoute><HazardMatrix /></ProtectedRoute>} />
      <Route path="/incidents" element={<ProtectedRoute><Incidents /></ProtectedRoute>} />
      <Route path="/training" element={<ProtectedRoute><Training /></ProtectedRoute>} />
      <Route path="/audits" element={<ProtectedRoute><Audits /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
      <Route path="/companies" element={<ProtectedRoute><Companies /></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
      <Route path="/consultant" element={<ProtectedRoute><ConsultantDashboard /></ProtectedRoute>} />
      <Route path="/alerts" element={<ProtectedRoute><AlertsConfig /></ProtectedRoute>} />
      <Route path="/approvals" element={<ProtectedRoute><Approvals /></ProtectedRoute>} />
      <Route path="/indicators-arl" element={<ProtectedRoute><IndicatorsArl /></ProtectedRoute>} />
      <Route path="/mintrabajo" element={<ProtectedRoute><MinTrabajoInspection /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
