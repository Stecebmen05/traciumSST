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
import { Plus, AlertTriangle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const HAZARD_TYPES = ['Biologico', 'Quimico', 'Fisico', 'Biomecanico', 'Mecanico', 'Electrico', 'Locativo', 'Tecnologico', 'Psicosocial', 'Natural'];

const riskBadge = (cat) => {
  const colors = { critical: 'bg-[#D90429] text-white', high: 'bg-[#F97316] text-white', medium: 'bg-[#FFC300] text-[#0F172A]', low: 'bg-[#2A9D8F] text-white' };
  return colors[cat] || colors.low;
};

export default function HazardMatrix() {
  const [hazards, setHazards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({ area: '', hazard_type: 'Mecanico', description: '', risk_source: '', probability: 3, severity: 3, existing_controls: '', proposed_controls: '' });

  const fetchData = useCallback(async () => {
    try { const res = await API.get('/hazards'); setHazards(res.data); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async () => {
    try {
      await API.post('/hazards', { ...form, probability: parseInt(form.probability), severity: parseInt(form.severity) });
      toast.success('Peligro registrado');
      setShowDialog(false);
      setForm({ area: '', hazard_type: 'Mecanico', description: '', risk_source: '', probability: 3, severity: 3, existing_controls: '', proposed_controls: '' });
      fetchData();
    } catch { toast.error('Error'); }
  };

  const handleDelete = async (id) => {
    try { await API.delete(`/hazards/${id}`); toast.success('Eliminado'); fetchData(); }
    catch { toast.error('Error'); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-[#0047AB] border-t-transparent rounded-full animate-spin" /></div>;

  const stats = { critical: hazards.filter(h => h.risk_category === 'critical').length, high: hazards.filter(h => h.risk_category === 'high').length, medium: hazards.filter(h => h.risk_category === 'medium').length, low: hazards.filter(h => h.risk_category === 'low').length };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="hazard-matrix-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Outfit' }}>Matriz IPER</h1>
          <p className="text-sm text-[#475569] mt-1">Identificacion de Peligros y Evaluacion de Riesgos</p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button data-testid="add-hazard-btn" className="text-xs" style={{ backgroundColor: '#0047AB' }}>
              <Plus className="w-3 h-3 mr-1" /> Nuevo Peligro
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle style={{ fontFamily: 'Outfit' }}>Registrar Peligro</DialogTitle></DialogHeader>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs font-semibold">Area</Label><Input data-testid="hazard-area-input" value={form.area} onChange={e => setForm({...form, area: e.target.value})} className="mt-1" /></div>
                <div>
                  <Label className="text-xs font-semibold">Tipo de Peligro</Label>
                  <Select value={form.hazard_type} onValueChange={v => setForm({...form, hazard_type: v})}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{HAZARD_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label className="text-xs font-semibold">Descripcion</Label><Textarea data-testid="hazard-desc-input" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="mt-1" /></div>
              <div><Label className="text-xs font-semibold">Fuente de Riesgo</Label><Input value={form.risk_source} onChange={e => setForm({...form, risk_source: e.target.value})} className="mt-1" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold">Probabilidad (1-5)</Label>
                  <Select value={String(form.probability)} onValueChange={v => setForm({...form, probability: v})}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{[1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-semibold">Severidad (1-5)</Label>
                  <Select value={String(form.severity)} onValueChange={v => setForm({...form, severity: v})}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{[1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label className="text-xs font-semibold">Controles Existentes</Label><Textarea value={form.existing_controls} onChange={e => setForm({...form, existing_controls: e.target.value})} className="mt-1" /></div>
              <div><Label className="text-xs font-semibold">Controles Propuestos</Label><Textarea value={form.proposed_controls} onChange={e => setForm({...form, proposed_controls: e.target.value})} className="mt-1" /></div>
              <Button data-testid="save-hazard-btn" onClick={handleCreate} className="w-full" style={{ backgroundColor: '#0047AB' }}>Registrar Peligro</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Risk summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Critico', count: stats.critical, color: '#D90429' },
          { label: 'Alto', count: stats.high, color: '#F97316' },
          { label: 'Medio', count: stats.medium, color: '#FFC300' },
          { label: 'Bajo', count: stats.low, color: '#2A9D8F' },
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
                <TableHead className="text-xs font-semibold">Area</TableHead>
                <TableHead className="text-xs font-semibold">Tipo</TableHead>
                <TableHead className="text-xs font-semibold">Descripcion</TableHead>
                <TableHead className="text-xs font-semibold text-center">P</TableHead>
                <TableHead className="text-xs font-semibold text-center">S</TableHead>
                <TableHead className="text-xs font-semibold text-center">Nivel</TableHead>
                <TableHead className="text-xs font-semibold">Riesgo</TableHead>
                <TableHead className="text-xs font-semibold w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hazards.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <AlertTriangle className="w-8 h-8 text-[#94A3B8] mx-auto mb-2" />
                    <p className="text-xs text-[#94A3B8]">Sin peligros registrados</p>
                  </TableCell>
                </TableRow>
              ) : hazards.map(h => (
                <TableRow key={h.hazard_id} className="hover:bg-[#F8F9FA]">
                  <TableCell className="text-xs">{h.area}</TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px]">{h.hazard_type}</Badge></TableCell>
                  <TableCell className="text-xs max-w-[200px] truncate">{h.description}</TableCell>
                  <TableCell className="text-center font-mono text-xs">{h.probability}</TableCell>
                  <TableCell className="text-center font-mono text-xs">{h.severity}</TableCell>
                  <TableCell className="text-center font-mono text-xs font-bold">{h.risk_level}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${riskBadge(h.risk_category)}`}>
                      {h.risk_category}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="ghost" className="h-7 text-red-500" onClick={() => handleDelete(h.hazard_id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
