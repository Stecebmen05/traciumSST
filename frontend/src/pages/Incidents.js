import React, { useState, useEffect, useCallback } from 'react';
import API from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Shield, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';

export default function Incidents() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [form, setForm] = useState({ incident_type: 'Incidente', date: '', location: '', description: '', affected_person: '', severity: 'minor', immediate_actions: '' });

  const fetchData = useCallback(async () => {
    try { const res = await API.get('/incidents'); setIncidents(res.data); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async () => {
    try {
      await API.post('/incidents', form);
      toast.success('Incidente registrado');
      setShowCreate(false);
      setForm({ incident_type: 'Incidente', date: '', location: '', description: '', affected_person: '', severity: 'minor', immediate_actions: '' });
      fetchData();
    } catch { toast.error('Error'); }
  };

  const handleUpdateStatus = async (inc, status) => {
    try { await API.put(`/incidents/${inc.incident_id}`, { status }); fetchData(); }
    catch { toast.error('Error'); }
  };

  const handleUpdateInvestigation = async (id, root_cause, corrective_actions) => {
    try {
      await API.put(`/incidents/${id}`, { root_cause, corrective_actions, status: 'investigating' });
      toast.success('Investigacion actualizada');
      setShowDetail(null);
      fetchData();
    } catch { toast.error('Error'); }
  };

  const handleDelete = async (id) => {
    try { await API.delete(`/incidents/${id}`); toast.success('Eliminado'); fetchData(); }
    catch { toast.error('Error'); }
  };

  const sevColors = { minor: 'bg-[#2A9D8F] text-white', moderate: 'bg-[#FFC300] text-[#0F172A]', major: 'bg-[#F97316] text-white', critical: 'bg-[#D90429] text-white' };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-[#0047AB] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-fade-in" data-testid="incidents-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Outfit' }}>Incidentes y Accidentes</h1>
          <p className="text-sm text-[#475569] mt-1">Registro, investigacion y acciones correctivas</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button data-testid="add-incident-btn" className="text-xs" style={{ backgroundColor: '#D90429' }}>
              <Plus className="w-3 h-3 mr-1" /> Reportar Incidente
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle style={{ fontFamily: 'Outfit' }}>Nuevo Incidente</DialogTitle></DialogHeader>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold">Tipo</Label>
                  <Select value={form.incident_type} onValueChange={v => setForm({...form, incident_type: v})}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Incidente">Incidente</SelectItem>
                      <SelectItem value="Accidente">Accidente</SelectItem>
                      <SelectItem value="Casi accidente">Casi accidente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-semibold">Severidad</Label>
                  <Select value={form.severity} onValueChange={v => setForm({...form, severity: v})}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minor">Leve</SelectItem>
                      <SelectItem value="moderate">Moderado</SelectItem>
                      <SelectItem value="major">Grave</SelectItem>
                      <SelectItem value="critical">Critico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label className="text-xs font-semibold">Fecha</Label><Input data-testid="incident-date-input" type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="mt-1" /></div>
              <div><Label className="text-xs font-semibold">Ubicacion</Label><Input data-testid="incident-location-input" value={form.location} onChange={e => setForm({...form, location: e.target.value})} className="mt-1" /></div>
              <div><Label className="text-xs font-semibold">Persona Afectada</Label><Input value={form.affected_person} onChange={e => setForm({...form, affected_person: e.target.value})} className="mt-1" /></div>
              <div><Label className="text-xs font-semibold">Descripcion</Label><Textarea data-testid="incident-desc-input" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="mt-1" /></div>
              <div><Label className="text-xs font-semibold">Acciones Inmediatas</Label><Textarea value={form.immediate_actions} onChange={e => setForm({...form, immediate_actions: e.target.value})} className="mt-1" /></div>
              <Button data-testid="save-incident-btn" onClick={handleCreate} className="w-full" style={{ backgroundColor: '#D90429' }}>Registrar Incidente</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total', count: incidents.length, color: '#0047AB' },
          { label: 'Abiertos', count: incidents.filter(i => i.status === 'open').length, color: '#D90429' },
          { label: 'Investigando', count: incidents.filter(i => i.status === 'investigating').length, color: '#FFC300' },
          { label: 'Cerrados', count: incidents.filter(i => i.status === 'closed').length, color: '#2A9D8F' },
        ].map(s => (
          <Card key={s.label} className="border border-[#E2E8F0] bg-white">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-[#94A3B8] uppercase font-medium">{s.label}</p>
              <p className="text-2xl font-bold mt-1" style={{ fontFamily: 'JetBrains Mono', color: s.color }}>{s.count}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border border-[#E2E8F0] bg-white">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs font-semibold">Tipo</TableHead>
                <TableHead className="text-xs font-semibold">Fecha</TableHead>
                <TableHead className="text-xs font-semibold">Ubicacion</TableHead>
                <TableHead className="text-xs font-semibold">Descripcion</TableHead>
                <TableHead className="text-xs font-semibold">Severidad</TableHead>
                <TableHead className="text-xs font-semibold">Estado</TableHead>
                <TableHead className="text-xs font-semibold w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incidents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Shield className="w-8 h-8 text-[#94A3B8] mx-auto mb-2" />
                    <p className="text-xs text-[#94A3B8]">Sin incidentes registrados</p>
                  </TableCell>
                </TableRow>
              ) : incidents.map(inc => (
                <TableRow key={inc.incident_id} className="hover:bg-[#F8F9FA]">
                  <TableCell><Badge variant="outline" className="text-[10px]">{inc.incident_type}</Badge></TableCell>
                  <TableCell className="text-xs font-mono">{inc.date}</TableCell>
                  <TableCell className="text-xs">{inc.location}</TableCell>
                  <TableCell className="text-xs max-w-[200px] truncate">{inc.description}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${sevColors[inc.severity] || sevColors.minor}`}>{inc.severity}</span>
                  </TableCell>
                  <TableCell><Badge variant={inc.status === 'closed' ? 'default' : 'secondary'} className="text-[10px]">{inc.status}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" className="h-7" onClick={() => setShowDetail(inc)}><Eye className="w-3 h-3" /></Button>
                      <Button size="sm" variant="ghost" className="h-7 text-red-500" onClick={() => handleDelete(inc.incident_id)}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detail/Investigation Dialog */}
      {showDetail && (
        <InvestigationDialog incident={showDetail} onClose={() => setShowDetail(null)} onSave={handleUpdateInvestigation} onStatusChange={handleUpdateStatus} />
      )}
    </div>
  );
}

function InvestigationDialog({ incident, onClose, onSave, onStatusChange }) {
  const [rootCause, setRootCause] = useState(incident.root_cause || '');
  const [corrActions, setCorrActions] = useState(incident.corrective_actions || '');

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle style={{ fontFamily: 'Outfit' }}>Investigacion de Incidente</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div><span className="text-[#94A3B8]">Tipo:</span> <span className="font-medium">{incident.incident_type}</span></div>
            <div><span className="text-[#94A3B8]">Fecha:</span> <span className="font-mono">{incident.date}</span></div>
            <div><span className="text-[#94A3B8]">Ubicacion:</span> <span>{incident.location}</span></div>
            <div><span className="text-[#94A3B8]">Severidad:</span> <span className="font-medium">{incident.severity}</span></div>
          </div>
          <div className="text-xs p-2 bg-[#F1F5F9] rounded">{incident.description}</div>
          <div>
            <Label className="text-xs font-semibold">Causa Raiz (Arbol de Causas)</Label>
            <Textarea data-testid="root-cause-input" value={rootCause} onChange={e => setRootCause(e.target.value)} className="mt-1" placeholder="Analisis de causa raiz..." />
          </div>
          <div>
            <Label className="text-xs font-semibold">Acciones Correctivas</Label>
            <Textarea data-testid="corrective-actions-input" value={corrActions} onChange={e => setCorrActions(e.target.value)} className="mt-1" placeholder="Plan de accion correctiva..." />
          </div>
          <div className="flex gap-2">
            <Button data-testid="save-investigation-btn" className="flex-1 text-xs" style={{ backgroundColor: '#0047AB' }} onClick={() => onSave(incident.incident_id, rootCause, corrActions)}>
              Guardar Investigacion
            </Button>
            {incident.status !== 'closed' && (
              <Button variant="outline" className="text-xs" onClick={() => { onStatusChange(incident, 'closed'); onClose(); }}>
                Cerrar Incidente
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
