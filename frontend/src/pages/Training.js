import React, { useState, useEffect, useCallback } from 'react';
import API from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, GraduationCap, Trash2, CheckCircle, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function Training() {
  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', trainer: '', scheduled_date: '', duration_hours: 1, max_participants: 30 });

  const fetchData = useCallback(async () => {
    try { const res = await API.get('/trainings'); setTrainings(res.data); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async () => {
    try {
      await API.post('/trainings', { ...form, duration_hours: parseFloat(form.duration_hours), max_participants: parseInt(form.max_participants) });
      toast.success('Capacitacion creada');
      setShowDialog(false);
      setForm({ title: '', description: '', trainer: '', scheduled_date: '', duration_hours: 1, max_participants: 30 });
      fetchData();
    } catch { toast.error('Error'); }
  };

  const handleComplete = async (t) => {
    try { await API.put(`/trainings/${t.training_id}`, { status: 'completed' }); fetchData(); }
    catch { toast.error('Error'); }
  };

  const handleDelete = async (id) => {
    try { await API.delete(`/trainings/${id}`); toast.success('Eliminado'); fetchData(); }
    catch { toast.error('Error'); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-[#0047AB] border-t-transparent rounded-full animate-spin" /></div>;

  const completed = trainings.filter(t => t.status === 'completed').length;
  const scheduled = trainings.filter(t => t.status === 'scheduled').length;

  return (
    <div className="space-y-6 animate-fade-in" data-testid="training-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Outfit' }}>Capacitacion</h1>
          <p className="text-sm text-[#475569] mt-1">Plan anual de formacion y registro de asistencia</p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button data-testid="add-training-btn" className="text-xs" style={{ backgroundColor: '#0047AB' }}>
              <Plus className="w-3 h-3 mr-1" /> Nueva Capacitacion
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle style={{ fontFamily: 'Outfit' }}>Nueva Capacitacion</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label className="text-xs font-semibold">Titulo</Label><Input data-testid="training-title-input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="mt-1" /></div>
              <div><Label className="text-xs font-semibold">Descripcion</Label><Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="mt-1" /></div>
              <div><Label className="text-xs font-semibold">Formador</Label><Input value={form.trainer} onChange={e => setForm({...form, trainer: e.target.value})} className="mt-1" /></div>
              <div><Label className="text-xs font-semibold">Fecha Programada</Label><Input data-testid="training-date-input" type="date" value={form.scheduled_date} onChange={e => setForm({...form, scheduled_date: e.target.value})} className="mt-1" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs font-semibold">Duracion (h)</Label><Input type="number" value={form.duration_hours} onChange={e => setForm({...form, duration_hours: e.target.value})} className="mt-1" /></div>
                <div><Label className="text-xs font-semibold">Max. Participantes</Label><Input type="number" value={form.max_participants} onChange={e => setForm({...form, max_participants: e.target.value})} className="mt-1" /></div>
              </div>
              <Button data-testid="save-training-btn" onClick={handleCreate} className="w-full" style={{ backgroundColor: '#0047AB' }}>Crear Capacitacion</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-[#E2E8F0] bg-white"><CardContent className="p-4"><p className="text-xs text-[#94A3B8] uppercase font-medium">Total</p><p className="text-2xl font-bold mt-1" style={{ fontFamily: 'JetBrains Mono', color: '#0047AB' }}>{trainings.length}</p></CardContent></Card>
        <Card className="border border-[#E2E8F0] bg-white"><CardContent className="p-4"><p className="text-xs text-[#94A3B8] uppercase font-medium">Programadas</p><p className="text-2xl font-bold mt-1" style={{ fontFamily: 'JetBrains Mono', color: '#FFC300' }}>{scheduled}</p></CardContent></Card>
        <Card className="border border-[#E2E8F0] bg-white"><CardContent className="p-4"><p className="text-xs text-[#94A3B8] uppercase font-medium">Completadas</p><p className="text-2xl font-bold mt-1" style={{ fontFamily: 'JetBrains Mono', color: '#2A9D8F' }}>{completed}</p></CardContent></Card>
      </div>

      <Card className="border border-[#E2E8F0] bg-white">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs font-semibold">Titulo</TableHead>
                <TableHead className="text-xs font-semibold">Formador</TableHead>
                <TableHead className="text-xs font-semibold">Fecha</TableHead>
                <TableHead className="text-xs font-semibold">Duracion</TableHead>
                <TableHead className="text-xs font-semibold">Estado</TableHead>
                <TableHead className="text-xs font-semibold w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trainings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <GraduationCap className="w-8 h-8 text-[#94A3B8] mx-auto mb-2" />
                    <p className="text-xs text-[#94A3B8]">Sin capacitaciones programadas</p>
                  </TableCell>
                </TableRow>
              ) : trainings.map(t => (
                <TableRow key={t.training_id} className="hover:bg-[#F8F9FA]">
                  <TableCell className="text-xs font-medium">{t.title}</TableCell>
                  <TableCell className="text-xs text-[#475569]">{t.trainer}</TableCell>
                  <TableCell className="text-xs font-mono">{t.scheduled_date}</TableCell>
                  <TableCell className="text-xs font-mono">{t.duration_hours}h</TableCell>
                  <TableCell><Badge variant={t.status === 'completed' ? 'default' : 'secondary'} className="text-[10px]">{t.status}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {t.status !== 'completed' && (
                        <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => handleComplete(t)}>
                          <CheckCircle className="w-3 h-3 mr-1" /> Completar
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="h-7 text-red-500" onClick={() => handleDelete(t.training_id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
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
