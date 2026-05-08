import React, { useState, useEffect, useCallback, useRef } from 'react';
import API from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Building2, Trash2, ArrowRightLeft, CheckCircle, Image as ImageIcon, Upload, X } from 'lucide-react';
import { toast } from 'sonner';

const MAX_LOGO_MB = 2;
const ALLOWED = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

export default function Companies() {
  const { activeCompany, switchCompany, fetchContext } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({ name: '', nit: '', workers_count: 25, risk_level: 2, economic_activity: '', city: '', sedes: 'Sede Principal', processes: 'Administrativo, Operativo' });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const createFileRef = useRef(null);
  const rowFileRefs = useRef({});

  const fetchCompanies = useCallback(async () => {
    try { const res = await API.get('/companies'); setCompanies(res.data); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);

  const validateLogo = (f) => {
    if (!ALLOWED.includes(f.type)) { toast.error('Formato no permitido (PNG, JPG o WebP)'); return false; }
    if (f.size > MAX_LOGO_MB * 1024 * 1024) { toast.error(`Logo supera ${MAX_LOGO_MB} MB`); return false; }
    return true;
  };

  const onLogoChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!validateLogo(f)) return;
    setLogoFile(f);
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result);
    reader.readAsDataURL(f);
  };

  const uploadLogo = async (companyId, file) => {
    const fd = new FormData();
    fd.append('file', file);
    await API.post(`/companies/${companyId}/logo`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  };

  const handleCreate = async () => {
    try {
      const payload = {
        ...form,
        workers_count: parseInt(form.workers_count) || 25,
        risk_level: parseInt(form.risk_level) || 2,
        sedes: form.sedes.split(',').map(s => s.trim()),
        processes: form.processes.split(',').map(s => s.trim()),
      };
      const res = await API.post('/companies', payload);
      if (logoFile && res.data?.company_id) {
        try { await uploadLogo(res.data.company_id, logoFile); } catch { toast.error('Empresa creada, pero fallo subir el logo'); }
      }
      toast.success('Empresa creada');
      setShowDialog(false);
      setForm({ name: '', nit: '', workers_count: 25, risk_level: 2, economic_activity: '', city: '', sedes: 'Sede Principal', processes: 'Administrativo, Operativo' });
      setLogoFile(null); setLogoPreview('');
      fetchCompanies();
      fetchContext();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al crear');
    }
  };

  const handleRowLogo = async (companyId, e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!validateLogo(f)) return;
    try {
      await uploadLogo(companyId, f);
      toast.success('Logo actualizado');
      fetchCompanies();
    } catch (err) { toast.error(err.response?.data?.detail || 'Error al subir logo'); }
  };

  const removeLogo = async (companyId) => {
    if (!window.confirm('Eliminar el logo de esta empresa?')) return;
    try { await API.delete(`/companies/${companyId}/logo`); toast.success('Logo eliminado'); fetchCompanies(); }
    catch (err) { toast.error(err.response?.data?.detail || 'Error'); }
  };

  const handleSwitch = async (companyId) => {
    await switchCompany(companyId);
    toast.success('Empresa activa cambiada');
  };

  const handleDelete = async (companyId) => {
    if (companyId === activeCompany?.company_id) {
      toast.error('No puedes eliminar la empresa activa');
      return;
    }
    try { await API.delete(`/companies/${companyId}`); toast.success('Eliminada'); fetchCompanies(); fetchContext(); }
    catch (err) { toast.error(err.response?.data?.detail || 'Error'); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-[#0047AB] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-fade-in" data-testid="companies-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Outfit' }}>Gestion de Empresas</h1>
          <p className="text-sm text-[#475569] mt-1">Administra multiples empresas, logotipos y cambia entre ellas</p>
        </div>
        <Dialog open={showDialog} onOpenChange={(o) => { setShowDialog(o); if (!o) { setLogoFile(null); setLogoPreview(''); } }}>
          <DialogTrigger asChild>
            <Button data-testid="add-company-btn" className="text-xs" style={{ backgroundColor: '#0047AB' }}>
              <Plus className="w-3 h-3 mr-1" /> Nueva Empresa
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle style={{ fontFamily: 'Outfit' }}>Nueva Empresa</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label className="text-xs font-semibold">Nombre</Label><Input data-testid="company-name-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="mt-1" placeholder="Nombre de la empresa" /></div>
              <div><Label className="text-xs font-semibold">NIT</Label><Input value={form.nit} onChange={e => setForm({...form, nit: e.target.value})} className="mt-1" placeholder="900123456-1" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs font-semibold">Trabajadores</Label><Input data-testid="company-workers-input" type="number" value={form.workers_count} onChange={e => setForm({...form, workers_count: e.target.value})} className="mt-1" /></div>
                <div>
                  <Label className="text-xs font-semibold">Nivel de Riesgo</Label>
                  <Select value={String(form.risk_level)} onValueChange={v => setForm({...form, risk_level: v})}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>Riesgo {['','I','II','III','IV','V'][n]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label className="text-xs font-semibold">Actividad Economica</Label><Input value={form.economic_activity} onChange={e => setForm({...form, economic_activity: e.target.value})} className="mt-1" /></div>
              <div><Label className="text-xs font-semibold">Ciudad</Label><Input value={form.city} onChange={e => setForm({...form, city: e.target.value})} className="mt-1" /></div>
              <div><Label className="text-xs font-semibold">Sedes (separadas por coma)</Label><Input value={form.sedes} onChange={e => setForm({...form, sedes: e.target.value})} className="mt-1" /></div>
              <div><Label className="text-xs font-semibold">Procesos (separados por coma)</Label><Input value={form.processes} onChange={e => setForm({...form, processes: e.target.value})} className="mt-1" /></div>

              {/* Logo upload */}
              <div className="border border-dashed border-[#CBD5E1] rounded-lg p-3 bg-[#F8F9FA]">
                <Label className="text-xs font-semibold flex items-center gap-1.5"><ImageIcon className="w-3 h-3" /> Logo de la Empresa (opcional)</Label>
                <p className="text-[10px] text-[#94A3B8] mt-0.5">Aparecera en los PDFs de Acta de Apertura, Cierre e Informe Final. PNG, JPG o WebP, max {MAX_LOGO_MB} MB.</p>
                <div className="flex items-center gap-3 mt-2">
                  {logoPreview ? (
                    <div className="relative">
                      <img src={logoPreview} alt="logo preview" className="w-20 h-20 object-contain rounded border border-[#E2E8F0] bg-white" data-testid="logo-preview-img" />
                      <button type="button" onClick={() => { setLogoFile(null); setLogoPreview(''); if (createFileRef.current) createFileRef.current.value = ''; }} className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#D90429] text-white flex items-center justify-center text-xs" data-testid="logo-remove-preview">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded border border-dashed border-[#CBD5E1] flex items-center justify-center bg-white">
                      <ImageIcon className="w-6 h-6 text-[#CBD5E1]" />
                    </div>
                  )}
                  <div className="flex-1">
                    <input ref={createFileRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={onLogoChange} className="hidden" data-testid="logo-file-input" />
                    <Button type="button" variant="outline" size="sm" className="text-xs h-8" onClick={() => createFileRef.current?.click()} data-testid="logo-choose-btn">
                      <Upload className="w-3 h-3 mr-1" /> {logoPreview ? 'Cambiar logo' : 'Subir logo'}
                    </Button>
                  </div>
                </div>
              </div>

              <Button data-testid="save-company-btn" onClick={handleCreate} className="w-full" style={{ backgroundColor: '#0047AB' }}>Crear Empresa</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {companies.map(c => {
          const isActive = c.company_id === activeCompany?.company_id;
          return (
            <Card key={c.company_id} className={`border bg-white transition-all hover:-translate-y-0.5 ${isActive ? 'border-[#0047AB] ring-1 ring-[#0047AB]/20' : 'border-[#E2E8F0]'}`} data-testid={`company-card-${c.company_id}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3 gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {c.logo_data_url ? (
                      <img src={c.logo_data_url} alt={`${c.name} logo`} className="w-12 h-12 object-contain rounded border border-[#E2E8F0] bg-white flex-shrink-0" data-testid={`company-logo-${c.company_id}`} />
                    ) : (
                      <div className="w-12 h-12 rounded bg-[#F1F5F9] flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-6 h-6 text-[#94A3B8]" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-[#0F172A] truncate">{c.name}</h3>
                        {isActive && <Badge className="bg-[#2A9D8F] text-white text-[10px]">Activa</Badge>}
                      </div>
                      {c.nit && <p className="text-xs text-[#94A3B8] font-mono mt-0.5">NIT: {c.nit}</p>}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  <div className="p-2 bg-[#F8F9FA] rounded">
                    <p className="text-[10px] text-[#94A3B8]">Trabajadores</p>
                    <p className="font-bold font-mono text-[#0047AB]">{c.workers_count}</p>
                  </div>
                  <div className="p-2 bg-[#F8F9FA] rounded">
                    <p className="text-[10px] text-[#94A3B8]">Riesgo</p>
                    <p className="font-bold font-mono text-[#0047AB]">{['','I','II','III','IV','V'][c.risk_level || 2]}</p>
                  </div>
                </div>

                {c.city && <p className="text-xs text-[#475569] mb-1">{c.city}</p>}
                {c.economic_activity && <p className="text-xs text-[#94A3B8] mb-3">{c.economic_activity}</p>}

                <div className="flex gap-2 flex-wrap">
                  {!isActive ? (
                    <Button size="sm" variant="outline" className="text-xs h-8 flex-1" onClick={() => handleSwitch(c.company_id)} data-testid={`switch-company-${c.company_id}`}>
                      <ArrowRightLeft className="w-3 h-3 mr-1" /> Activar
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" className="text-xs h-8 flex-1 border-[#2A9D8F] text-[#2A9D8F]" disabled>
                      <CheckCircle className="w-3 h-3 mr-1" /> Empresa Activa
                    </Button>
                  )}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    ref={(el) => { rowFileRefs.current[c.company_id] = el; }}
                    onChange={(e) => handleRowLogo(c.company_id, e)}
                    data-testid={`logo-input-${c.company_id}`}
                  />
                  <Button size="sm" variant="outline" className="text-xs h-8" onClick={() => rowFileRefs.current[c.company_id]?.click()} data-testid={`logo-update-${c.company_id}`}>
                    <ImageIcon className="w-3 h-3 mr-1" /> {c.logo_data_url ? 'Cambiar' : 'Logo'}
                  </Button>
                  {c.logo_data_url && (
                    <Button size="sm" variant="ghost" className="h-8 text-red-500" onClick={() => removeLogo(c.company_id)} data-testid={`logo-remove-${c.company_id}`}>
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                  {!isActive && (
                    <Button size="sm" variant="ghost" className="h-8 text-red-500" onClick={() => handleDelete(c.company_id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
