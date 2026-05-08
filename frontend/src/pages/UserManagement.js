import React, { useState, useEffect, useCallback } from 'react';
import API from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users as UsersIcon, Shield, Plus, Key, Building2, UserX, UserCheck, Clock } from 'lucide-react';
import { toast } from 'sonner';

const ROLES = [
  { value: 'owner', label: 'Propietario', color: 'bg-[#7C3AED]', desc: 'Acceso total, ve todas las empresas y datos' },
  { value: 'admin', label: 'Administrador', color: 'bg-[#0047AB]', desc: 'CRUD completo, gestion de empresas y usuarios' },
  { value: 'sgsst_manager', label: 'Responsable SST', color: 'bg-[#2A9D8F]', desc: 'CRUD en todos los modulos del SG-SST' },
  { value: 'auditor', label: 'Auditor', color: 'bg-[#F97316]', desc: 'Lectura total, hallazgos y checklist en auditorias' },
  { value: 'area_leader', label: 'Lider de Area', color: 'bg-[#8B5CF6]', desc: 'Lectura, reportar incidentes' },
  { value: 'collaborator', label: 'Colaborador', color: 'bg-[#94A3B8]', desc: 'Solo lectura de su empresa asignada' },
];

export default function UserManagement() {
  const { canManageUsers, companies } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showPwDialog, setShowPwDialog] = useState(null);
  const [showDemo, setShowDemo] = useState(false);
  const [demoResult, setDemoResult] = useState(null);
  const [newPw, setNewPw] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'collaborator', company_id: '' });
  const [demoForm, setDemoForm] = useState({ name: 'Usuario Demo', role: 'collaborator', company_id: '', days: 7 });

  const fetchUsers = useCallback(async () => {
    try { const res = await API.get('/users'); setUsers(res.data); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleCreate = async () => {
    try {
      await API.post('/auth/create-user', form);
      toast.success(`Usuario ${form.name} creado exitosamente`);
      setShowCreate(false);
      setForm({ name: '', email: '', password: '', role: 'collaborator', company_id: '' });
      fetchUsers();
    } catch (err) { toast.error(err.response?.data?.detail || 'Error al crear usuario'); }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await API.put(`/users/${userId}/role`, { role: newRole });
      toast.success('Rol actualizado');
      fetchUsers();
    } catch (err) { toast.error(err.response?.data?.detail || 'Error'); }
  };

  const handleCompanyAssign = async (userId, companyId) => {
    try {
      await API.put(`/users/${userId}/company`, { company_id: companyId });
      toast.success('Empresa asignada');
      fetchUsers();
    } catch (err) { toast.error(err.response?.data?.detail || 'Error'); }
  };

  const handlePasswordChange = async () => {
    if (!showPwDialog || !newPw) return;
    try {
      await API.put(`/users/${showPwDialog}/password`, { password: newPw });
      toast.success('Contraseña actualizada');
      setShowPwDialog(null);
      setNewPw('');
    } catch (err) { toast.error(err.response?.data?.detail || 'Error'); }
  };

  const handleToggleStatus = async (userId, currentActive) => {
    try {
      const res = await API.put(`/users/${userId}/toggle-status`);
      toast.success(res.data.message);
      fetchUsers();
    } catch (err) { toast.error(err.response?.data?.detail || 'Error'); }
  };

  const handleCreateDemo = async () => {
    try {
      const res = await API.post('/users/create-demo', demoForm);
      setDemoResult(res.data);
      toast.success('Usuario demo creado');
      fetchUsers();
    } catch (err) { toast.error(err.response?.data?.detail || 'Error'); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-[#0047AB] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-fade-in" data-testid="users-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Outfit' }}>Gestion de Usuarios</h1>
          <p className="text-sm text-[#475569] mt-1">Crea usuarios, asigna roles y empresas</p>
        </div>
        {canManageUsers && (
          <div className="flex gap-2">
            <Dialog open={showDemo} onOpenChange={v => { setShowDemo(v); if (!v) setDemoResult(null); }}>
              <DialogTrigger asChild>
                <Button variant="outline" data-testid="create-demo-btn"><Clock className="w-4 h-4 mr-1" /> Crear Demo</Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle style={{ fontFamily: 'Outfit' }}>Crear Usuario de Prueba</DialogTitle></DialogHeader>
                {demoResult ? (
                  <div className="space-y-3 p-3 bg-[#2A9D8F]/5 border border-[#2A9D8F]/20 rounded">
                    <p className="text-sm font-bold text-[#2A9D8F]">Usuario demo creado exitosamente</p>
                    <div className="space-y-1 text-xs">
                      <p><span className="font-semibold">Nombre:</span> {demoResult.name}</p>
                      <p><span className="font-semibold">Email:</span> <code className="bg-[#F1F5F9] px-1 rounded">{demoResult.email}</code></p>
                      <p><span className="font-semibold">Contraseña:</span> <code className="bg-[#F1F5F9] px-1 rounded">{demoResult.demo_password}</code></p>
                      <p><span className="font-semibold">Expira:</span> {demoResult.demo_expires_at?.split('T')[0]}</p>
                    </div>
                    <p className="text-[10px] text-[#94A3B8]">Comparta estas credenciales con el usuario. La cuenta se desactivara automaticamente al expirar.</p>
                    <Button onClick={() => { navigator.clipboard.writeText(`Email: ${demoResult.email}\nContraseña: ${demoResult.demo_password}`); toast.success('Copiado al portapapeles'); }} variant="outline" className="w-full text-xs">Copiar Credenciales</Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div><Label className="text-xs font-semibold">Nombre</Label><Input value={demoForm.name} onChange={e => setDemoForm({...demoForm, name: e.target.value})} className="mt-1" /></div>
                    <div>
                      <Label className="text-xs font-semibold">Rol</Label>
                      <Select value={demoForm.role} onValueChange={v => setDemoForm({...demoForm, role: v})}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>{ROLES.filter(r => r.value !== 'owner').map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    {companies.length > 0 && (
                      <div>
                        <Label className="text-xs font-semibold">Empresa</Label>
                        <Select value={demoForm.company_id} onValueChange={v => setDemoForm({...demoForm, company_id: v})}>
                          <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                          <SelectContent>{companies.map(c => <SelectItem key={c.company_id} value={c.company_id}>{c.name}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    )}
                    <div>
                      <Label className="text-xs font-semibold">Dias de acceso</Label>
                      <Select value={String(demoForm.days)} onValueChange={v => setDemoForm({...demoForm, days: parseInt(v)})}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3">3 dias</SelectItem>
                          <SelectItem value="7">7 dias</SelectItem>
                          <SelectItem value="15">15 dias</SelectItem>
                          <SelectItem value="30">30 dias</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button data-testid="save-demo-btn" onClick={handleCreateDemo} className="w-full" style={{ backgroundColor: '#2A9D8F' }}>Crear Usuario de Prueba</Button>
                  </div>
                )}
              </DialogContent>
            </Dialog>
            <Dialog open={showCreate} onOpenChange={setShowCreate}>
              <DialogTrigger asChild>
                <Button data-testid="create-user-btn" style={{ backgroundColor: '#0047AB' }}><Plus className="w-4 h-4 mr-1" /> Crear Usuario</Button>
              </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle style={{ fontFamily: 'Outfit' }}>Crear Nuevo Usuario</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label className="text-xs font-semibold">Nombre Completo *</Label><Input data-testid="new-user-name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="mt-1" placeholder="Juan Perez" /></div>
                <div><Label className="text-xs font-semibold">Correo Electronico *</Label><Input data-testid="new-user-email" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="mt-1" placeholder="juan@empresa.com" /></div>
                <div><Label className="text-xs font-semibold">Contraseña *</Label><Input data-testid="new-user-password" type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="mt-1" placeholder="Minimo 6 caracteres" /></div>
                <div>
                  <Label className="text-xs font-semibold">Rol</Label>
                  <Select value={form.role} onValueChange={v => setForm({...form, role: v})}>
                    <SelectTrigger className="mt-1" data-testid="new-user-role"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label} - {r.desc}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {companies.length > 0 && (
                  <div>
                    <Label className="text-xs font-semibold">Empresa</Label>
                    <Select value={form.company_id} onValueChange={v => setForm({...form, company_id: v})}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar empresa" /></SelectTrigger>
                      <SelectContent>
                        {companies.map(c => <SelectItem key={c.company_id} value={c.company_id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <Button data-testid="save-user-btn" onClick={handleCreate} className="w-full" style={{ backgroundColor: '#0047AB' }}>Crear Usuario</Button>
              </div>
            </DialogContent>
          </Dialog>
          </div>
        )}
      </div>

      {/* Role summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {ROLES.map(r => {
          const count = users.filter(u => u.role === r.value).length;
          return (
            <Card key={r.value} className="border border-[#E2E8F0] bg-white">
              <CardContent className="p-3 text-center">
                <p className="text-[10px] text-[#94A3B8] uppercase font-medium">{r.label}</p>
                <p className="text-xl font-bold mt-0.5" style={{ fontFamily: 'JetBrains Mono', color: '#0047AB' }}>{count}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* RBAC info */}
      <Card className="border border-[#E2E8F0] bg-[#F8F9FA]">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2"><Shield className="w-4 h-4 text-[#0047AB]" /><h3 className="text-xs font-semibold">Permisos por Rol (RBAC)</h3></div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-[10px]">
            <div className="p-2 bg-white rounded border border-[#E2E8F0]"><p className="font-semibold text-[#7C3AED]">Propietario (Owner)</p><p className="text-[#475569]">Acceso total a todas las empresas, usuarios, auditorias y configuracion</p></div>
            <div className="p-2 bg-white rounded border border-[#E2E8F0]"><p className="font-semibold text-[#0047AB]">Admin / Responsable SST</p><p className="text-[#475569]">CRUD completo en empresas asignadas, gestion de usuarios</p></div>
            <div className="p-2 bg-white rounded border border-[#E2E8F0]"><p className="font-semibold text-[#F97316]">Auditor</p><p className="text-[#475569]">Lectura, ejecutar auditorias, hallazgos y planes en empresa asignada</p></div>
            <div className="p-2 bg-white rounded border border-[#E2E8F0]"><p className="font-semibold text-[#94A3B8]">Lider / Colaborador</p><p className="text-[#475569]">Solo lectura y reportes en su empresa asignada</p></div>
          </div>
        </CardContent>
      </Card>

      {/* Password change dialog */}
      <Dialog open={!!showPwDialog} onOpenChange={v => { if (!v) { setShowPwDialog(null); setNewPw(''); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle style={{ fontFamily: 'Outfit' }}>Cambiar Contraseña</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs font-semibold">Nueva Contraseña</Label><Input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} className="mt-1" placeholder="Minimo 6 caracteres" /></div>
            <Button onClick={handlePasswordChange} className="w-full" style={{ backgroundColor: '#0047AB' }}>Actualizar Contraseña</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Card className="border border-[#E2E8F0] bg-white">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs font-semibold">Usuario</TableHead>
                <TableHead className="text-xs font-semibold">Email</TableHead>
                <TableHead className="text-xs font-semibold">Tipo Auth</TableHead>
                <TableHead className="text-xs font-semibold">Rol</TableHead>
                {canManageUsers && <TableHead className="text-xs font-semibold">Cambiar Rol</TableHead>}
                {canManageUsers && <TableHead className="text-xs font-semibold">Empresa</TableHead>}
                {canManageUsers && <TableHead className="text-xs font-semibold">Acciones</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8"><UsersIcon className="w-8 h-8 text-[#94A3B8] mx-auto mb-2" /><p className="text-xs text-[#94A3B8]">Sin usuarios registrados</p></TableCell></TableRow>
              ) : users.map(u => {
                const roleInfo = ROLES.find(r => r.value === u.role) || ROLES[4];
                return (
                  <TableRow key={u.user_id} className={`hover:bg-[#F8F9FA] ${u.active === false ? 'opacity-50' : ''}`}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="w-7 h-7"><AvatarImage src={u.picture} /><AvatarFallback className="bg-[#0047AB] text-white text-[10px]">{u.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                        <div>
                          <span className="text-xs font-medium">{u.name}</span>
                          <div className="flex gap-1 mt-0.5">
                            {u.active === false && <Badge className="bg-[#D90429] text-white text-[8px] px-1 py-0">Inhabilitado</Badge>}
                            {u.is_demo && <Badge className="bg-[#F97316] text-white text-[8px] px-1 py-0">Demo {u.demo_expires_at ? `(${u.demo_expires_at.split('T')[0]})` : ''}</Badge>}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-[#475569]">{u.email}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]">{u.auth_type === 'email' ? 'Email/Clave' : 'Google'}</Badge></TableCell>
                    <TableCell><Badge className={`${roleInfo.color} text-white text-[10px]`}>{roleInfo.label}</Badge></TableCell>
                    {canManageUsers && (
                      <TableCell>
                        <Select value={u.role || 'collaborator'} onValueChange={v => handleRoleChange(u.user_id, v)}>
                          <SelectTrigger className="w-[140px] h-7 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>{ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
                        </Select>
                      </TableCell>
                    )}
                    {canManageUsers && (
                      <TableCell>
                        {companies.length > 0 ? (
                          <Select value={u.active_company_id || ''} onValueChange={v => handleCompanyAssign(u.user_id, v)}>
                            <SelectTrigger className="w-[140px] h-7 text-xs"><SelectValue placeholder="Asignar" /></SelectTrigger>
                            <SelectContent>{companies.map(c => <SelectItem key={c.company_id} value={c.company_id}>{c.name}</SelectItem>)}</SelectContent>
                          </Select>
                        ) : <span className="text-[10px] text-[#94A3B8]">Sin empresas</span>}
                      </TableCell>
                    )}
                    {canManageUsers && (
                      <TableCell>
                        <div className="flex gap-1">
                          {u.auth_type === 'email' && (
                            <Button size="sm" variant="ghost" className="h-7 text-[10px]" onClick={() => setShowPwDialog(u.user_id)} data-testid={`change-pw-${u.user_id}`}>
                              <Key className="w-3 h-3 mr-0.5" /> Clave
                            </Button>
                          )}
                          {u.role !== 'owner' && (
                            <Button size="sm" variant="ghost" className={`h-7 text-[10px] ${u.active === false ? 'text-[#2A9D8F]' : 'text-[#D90429]'}`}
                              onClick={() => handleToggleStatus(u.user_id, u.active !== false)}
                              data-testid={`toggle-status-${u.user_id}`}>
                              {u.active === false ? <><UserCheck className="w-3 h-3 mr-0.5" /> Habilitar</> : <><UserX className="w-3 h-3 mr-0.5" /> Inhabilitar</>}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
