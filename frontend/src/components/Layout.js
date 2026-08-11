import React, { useState, useEffect, useCallback } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import API from '@/lib/api';
import {
  LayoutDashboard, FileText, Shield, AlertTriangle,
  ClipboardList, GraduationCap, Search, FileBarChart,
  LogOut, Menu, X, ChevronLeft, User, Building2, ChevronDown, Users, Globe, Bell, Inbox, Activity, Landmark
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import FloatingActions from '@/components/FloatingActions';
import NotificationBell from '@/components/NotificationBell';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/implementation', label: 'Implementacion', icon: ClipboardList },
  { path: '/documents', label: 'Documentos', icon: FileText },
  { path: '/hazards', label: 'Matriz IPER', icon: AlertTriangle },
  { path: '/incidents', label: 'Incidentes', icon: Shield },
  { path: '/training', label: 'Capacitacion', icon: GraduationCap },
  { path: '/audits', label: 'Auditorias', icon: Search },
  { path: '/reports', label: 'Reportes', icon: FileBarChart },
];

const ROLE_LABELS = {
  admin: 'Administrador',
  sgsst_manager: 'Responsable SST',
  auditor: 'Auditor',
  area_leader: 'Lider de Area',
  collaborator: 'Colaborador'
};

const ROLE_COLORS = {
  admin: 'bg-[#0047AB] text-white',
  sgsst_manager: 'bg-[#2A9D8F] text-white',
  auditor: 'bg-[#F97316] text-white',
  area_leader: 'bg-[#8B5CF6] text-white',
  collaborator: 'bg-[#94A3B8] text-white'
};

export default function Layout({ children }) {
  const {
    user, logout, activeCompany, companies, switchCompany, canManageCompanies,
    canViewAudits, canViewDocuments, canViewHazards, canViewTraining, canViewReports, canViewImplementation,
    permissions
  } = useAuth();
  const canReportIncidents = permissions?.can_report_incidents || false;
  const canApprove = ['admin', 'owner', 'sgsst_manager'].includes(user?.role);
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // Poll pending approvals count for the sidebar badge
  const fetchPending = useCallback(async () => {
    if (!canApprove) return;
    try {
      const res = await API.get('/approvals/pending');
      setPendingCount(res.data?.total || 0);
    } catch { /* ignore */ }
  }, [canApprove]);
  useEffect(() => {
    fetchPending();
    const id = setInterval(fetchPending, 60000);
    return () => clearInterval(id);
  }, [fetchPending]);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';
  const role = user?.role || 'collaborator';

  // Always-visible nav items
  const baseNav = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, show: true },
    { path: '/implementation', label: 'Implementacion', icon: ClipboardList, show: canViewImplementation },
    { path: '/documents', label: 'Documentos', icon: FileText, show: canViewDocuments },
    { path: '/hazards', label: 'Matriz IPER', icon: AlertTriangle, show: canViewHazards },
    { path: '/incidents', label: 'Incidentes', icon: Shield, show: canReportIncidents },
    { path: '/training', label: 'Capacitacion', icon: GraduationCap, show: canViewTraining },
    { path: '/audits', label: 'Auditorias', icon: Search, show: canViewAudits },
    { path: '/mintrabajo', label: 'Inspeccion MinTrabajo', icon: Landmark, show: canViewAudits },
    { path: '/indicators-arl', label: 'Indicadores ARL', icon: Activity, show: canViewReports },
    { path: '/reports', label: 'Reportes', icon: FileBarChart, show: canViewReports },
  ];
  const filteredNav = baseNav.filter(n => n.show);

  const adminNavItems = canManageCompanies ? [
    ...filteredNav,
    { path: '/approvals', label: 'Aprobaciones', icon: Inbox, badge: pendingCount },
    { path: '/consultant', label: 'Consolidado', icon: Globe },
    { path: '/companies', label: 'Empresas', icon: Building2 },
    { path: '/users', label: 'Usuarios', icon: Users },
    { path: '/alerts', label: 'Alertas Email', icon: Bell },
  ] : canApprove ? [
    ...filteredNav,
    { path: '/approvals', label: 'Aprobaciones', icon: Inbox, badge: pendingCount },
  ] : filteredNav;

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 p-4 border-b border-[#E2E8F0]">
        <div className="w-8 h-8 rounded-lg bg-[#0047AB] flex items-center justify-center flex-shrink-0">
          <Shield className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <span className="text-sm font-bold tracking-tight whitespace-nowrap" style={{ fontFamily: 'Outfit, sans-serif' }}>
            TraciumSST
          </span>
        )}
      </div>

      {/* Company Selector */}
      {!collapsed && companies.length > 0 && (
        <div className="px-2 py-2 border-b border-[#E2E8F0]">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button data-testid="company-selector" className="flex items-center gap-2 w-full p-2 rounded-lg bg-[#F1F5F9] hover:bg-[#E2E8F0] transition-colors text-left">
                <Building2 className="w-3 h-3 text-[#0047AB] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-medium text-[#0F172A] truncate">{activeCompany?.name || 'Sin empresa'}</p>
                  <p className="text-[9px] text-[#94A3B8]">{activeCompany?.workers_count || 0} trabajadores</p>
                </div>
                <ChevronDown className="w-3 h-3 text-[#94A3B8]" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52">
              {companies.map(c => (
                <DropdownMenuItem
                  key={c.company_id}
                  data-testid={`company-switch-${c.company_id}`}
                  className="text-xs"
                  onClick={() => switchCompany(c.company_id)}
                >
                  <Building2 className="w-3 h-3 mr-2" />
                  <div>
                    <p className="font-medium">{c.name}</p>
                    <p className="text-[10px] text-[#94A3B8]">{c.workers_count} trab. - Riesgo {['','I','II','III','IV','V'][c.risk_level || 2]}</p>
                  </div>
                  {c.company_id === activeCompany?.company_id && (
                    <span className="ml-auto w-2 h-2 rounded-full bg-[#2A9D8F]" />
                  )}
                </DropdownMenuItem>
              ))}
              {canManageCompanies && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-xs" onClick={() => navigate('/companies')}>
                    <Building2 className="w-3 h-3 mr-2" /> Gestionar Empresas
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {adminNavItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            data-testid={`sidebar-nav-${item.path.slice(1)}`}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-[#0047AB]/10 text-[#0047AB] border-l-2 border-[#0047AB]'
                  : 'text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
              }`
            }
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span className="truncate flex-1">{item.label}</span>}
            {!collapsed && item.badge > 0 && (
              <Badge className="bg-[#F97316] text-white text-[9px] px-1.5 py-0 h-4 min-w-4 justify-center" data-testid={`sidebar-badge-${item.path.slice(1)}`}>
                {item.badge > 99 ? '99+' : item.badge}
              </Badge>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="border-t border-[#E2E8F0] p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button data-testid="user-menu-trigger" className="flex items-center gap-2 w-full p-2 rounded-lg hover:bg-[#F1F5F9] transition-colors">
              <Avatar className="w-8 h-8">
                <AvatarImage src={user?.picture} />
                <AvatarFallback className="bg-[#0047AB] text-white text-xs">{initials}</AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="flex-1 text-left min-w-0">
                  <p className="text-xs font-medium text-[#0F172A] truncate">{user?.name}</p>
                  <Badge className={`text-[9px] px-1.5 py-0 h-4 ${ROLE_COLORS[role]}`}>
                    {ROLE_LABELS[role] || role}
                  </Badge>
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem className="text-xs"><User className="w-3 h-3 mr-2" /> Perfil</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem data-testid="logout-btn" onClick={handleLogout} className="text-xs text-red-600">
              <LogOut className="w-3 h-3 mr-2" /> Cerrar sesion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#F8F9FA]">
      <aside className={`hidden md:flex flex-col bg-white border-r border-[#E2E8F0] transition-all duration-200 ${collapsed ? 'w-16' : 'w-56'}`}>
        <SidebarContent />
        <button
          data-testid="sidebar-collapse-btn"
          onClick={() => setCollapsed(!collapsed)}
          className="absolute top-4 -right-3 w-6 h-6 rounded-full bg-white border border-[#E2E8F0] flex items-center justify-center hover:bg-[#F1F5F9] z-20 hidden md:flex"
          style={{ left: collapsed ? '52px' : '212px' }}
        >
          <ChevronLeft className={`w-3 h-3 text-[#475569] transition-transform ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-56 bg-white border-r border-[#E2E8F0]">
            <SidebarContent />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-white border-b border-[#E2E8F0] flex items-center px-4 gap-3 flex-shrink-0">
          <button data-testid="mobile-menu-btn" className="md:hidden p-1.5 rounded-lg hover:bg-[#F1F5F9]" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex-1" />
          <NotificationBell />
          <Badge variant="outline" className="text-[10px] hidden sm:flex">
            <Building2 className="w-3 h-3 mr-1" /> {activeCompany?.name || 'Sin empresa'}
          </Badge>
          <span className="text-xs text-[#94A3B8] font-medium" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
            Decreto 1072/2015
          </span>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>

      {/* Global floating quick actions + AI chatbot */}
      <FloatingActions />
    </div>
  );
}
