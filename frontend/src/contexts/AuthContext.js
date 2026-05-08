import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import API from '@/lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState(null);
  const [activeCompany, setActiveCompany] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchContext = useCallback(async () => {
    try {
      const [permRes, compRes, compsRes] = await Promise.all([
        API.get('/rbac/permissions').catch(() => ({ data: null })),
        API.get('/companies/active').catch(() => ({ data: null })),
        API.get('/companies').catch(() => ({ data: [] })),
      ]);
      setPermissions(permRes.data);
      setActiveCompany(compRes.data);
      setCompanies(compsRes.data);
    } catch { /* ignore */ }
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      const res = await API.get('/auth/me');
      setUser(res.data);
      await fetchContext();
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [fetchContext]);

  useEffect(() => {
    // CRITICAL: If returning from OAuth callback, skip the /me check.
    // AuthCallback will exchange the session_id and establish the session first.
    if (window.location.hash?.includes('session_id=')) {
      setLoading(false);
      return;
    }
    checkAuth();
  }, [checkAuth]);

  const switchCompany = async (companyId) => {
    try {
      await API.post(`/companies/${companyId}/switch`);
      await fetchContext();
      // Reload page to refresh all data
      window.location.reload();
    } catch { /* ignore */ }
  };

  const logout = async () => {
    try { await API.post('/auth/logout'); } catch { /* ignore */ }
    setUser(null);
    setPermissions(null);
    setActiveCompany(null);
  };

  const canWrite = permissions?.can_write || false;
  const canAuditWrite = permissions?.can_audit_write || false;
  const canManageUsers = permissions?.can_manage_users || false;
  const canManageCompanies = permissions?.can_manage_companies || false;
  const canViewAudits = permissions?.can_view_audits || false;
  const canViewDocuments = permissions?.can_view_documents || false;
  const canViewHazards = permissions?.can_view_hazards || false;
  const canViewTraining = permissions?.can_view_training || false;
  const canViewReports = permissions?.can_view_reports || false;
  const canViewImplementation = permissions?.can_view_implementation || false;
  const canDownloadReports = permissions?.can_download_reports || false;

  return (
    <AuthContext.Provider value={{
      user, setUser, loading, logout, checkAuth, fetchContext,
      permissions, canWrite, canAuditWrite, canManageUsers, canManageCompanies,
      canViewAudits, canViewDocuments, canViewHazards, canViewTraining, canViewReports, canViewImplementation, canDownloadReports,
      activeCompany, companies, switchCompany
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
