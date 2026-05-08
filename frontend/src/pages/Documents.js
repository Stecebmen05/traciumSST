import React, { useState, useEffect, useCallback } from 'react';
import API from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, FileText, Trash2, Send, CheckCircle2, XCircle, Clock, History, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import AIDocumentGenerator from '@/components/AIDocumentGenerator';

const CATEGORIES = ['Politica', 'Procedimiento', 'Formato', 'Registro', 'Manual', 'Matriz', 'Plan', 'Otro'];

const APPROVAL_BADGES = {
  pending: { label: 'Pendiente Aprobacion', color: 'bg-[#F97316] text-white', icon: Clock },
  approved: { label: 'Aprobado', color: 'bg-[#2A9D8F] text-white', icon: CheckCircle2 },
  rejected: { label: 'Rechazado', color: 'bg-[#D90429] text-white', icon: XCircle },
};

export default function Documents() {
  const { canWrite, user } = useAuth();
  const isApprover = ['admin', 'owner', 'sgsst_manager'].includes(user?.role);
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({ title: '', category: 'Politica', description: '', version: '1.0' });
  const [rejectDoc, setRejectDoc] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [historyDoc, setHistoryDoc] = useState(null);
  const [showAIGen, setShowAIGen] = useState(false);

  const fetchDocs = useCallback(async () => {
    try { const res = await API.get('/documents'); setDocs(res.data); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  const handleCreate = async () => {
    try {
      await API.post('/documents', form);
      toast.success('Documento creado');
      setShowDialog(false);
      setForm({ title: '', category: 'Politica', description: '', version: '1.0' });
      fetchDocs();
    } catch { toast.error('Error al crear'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Eliminar este documento?')) return;
    try { await API.delete(`/documents/${id}`); toast.success('Eliminado'); fetchDocs(); }
    catch { toast.error('Error'); }
  };

  const handleSubmit = async (id) => {
    try { await API.post(`/documents/${id}/submit-approval`); toast.success('Enviado a aprobacion'); fetchDocs(); }
    catch (err) { toast.error(err.response?.data?.detail || 'Error'); }
  };

  const handleApprove = async (id) => {
    try { await API.post(`/documents/${id}/approve`, {}); toast.success('Documento aprobado'); fetchDocs(); }
    catch (err) { toast.error(err.response?.data?.detail || 'Error al aprobar'); }
  };

  const confirmReject = async () => {
    if (!rejectReason.trim()) { toast.error('Motivo requerido'); return; }
    try {
      await API.post(`/documents/${rejectDoc.doc_id}/reject`, { reason: rejectReason });
      toast.success('Rechazado');
      setRejectDoc(null); setRejectReason('');
      fetchDocs();
    } catch (err) { toast.error(err.response?.data?.detail || 'Error'); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-[#0047AB] border-t-transparent rounded-full animate-spin" /></div>;

  const pendingCount = docs.filter(d => d.approval_status === 'pending').length;

  return (
    <div className="space-y-6 animate-fade-in" data-testid="documents-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Outfit' }}>Gestion Documental</h1>
          <p className="text-sm text-[#475569] mt-1 flex items-center gap-2 flex-wrap">
            <span>Versionamiento, aprobacion y trazabilidad de documentos</span>
            {pendingCount > 0 && <Badge className="bg-[#F97316] text-white text-[10px]">{pendingCount} pendientes</Badge>}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            data-testid="ai-doc-trigger"
            className="text-xs bg-gradient-to-r from-[#8B5CF6] to-[#0047AB] hover:opacity-90"
            onClick={() => setShowAIGen(true)}
            disabled={!canWrite}
          >
            <Wand2 className="w-3 h-3 mr-1" /> Crear con IA
          </Button>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button data-testid="add-document-btn" className="text-xs" style={{ backgroundColor: '#0047AB' }} disabled={!canWrite}>
              <Plus className="w-3 h-3 mr-1" /> Nuevo Documento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle style={{ fontFamily: 'Outfit' }}>Nuevo Documento</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label className="text-xs font-semibold">Titulo</Label><Input data-testid="doc-title-input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="mt-1" /></div>
              <div>
                <Label className="text-xs font-semibold">Categoria</Label>
                <Select value={form.category} onValueChange={v => setForm({...form, category: v})}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs font-semibold">Descripcion</Label><Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="mt-1" /></div>
              <div><Label className="text-xs font-semibold">Version</Label><Input value={form.version} onChange={e => setForm({...form, version: e.target.value})} className="mt-1" /></div>
              <Button data-testid="save-document-btn" onClick={handleCreate} className="w-full" style={{ backgroundColor: '#0047AB' }}>Guardar</Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <AIDocumentGenerator open={showAIGen} onClose={() => setShowAIGen(false)} onCreated={fetchDocs} />

      <Card className="border border-[#E2E8F0] bg-white">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs font-semibold">Titulo</TableHead>
                <TableHead className="text-xs font-semibold">Categoria</TableHead>
                <TableHead className="text-xs font-semibold">Version</TableHead>
                <TableHead className="text-xs font-semibold">Aprobacion</TableHead>
                <TableHead className="text-xs font-semibold">Creado por</TableHead>
                <TableHead className="text-xs font-semibold w-56">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {docs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <FileText className="w-8 h-8 text-[#94A3B8] mx-auto mb-2" />
                    <p className="text-xs text-[#94A3B8]">Sin documentos registrados</p>
                  </TableCell>
                </TableRow>
              ) : docs.map(doc => {
                const approval = doc.approval_status;
                const badge = APPROVAL_BADGES[approval];
                const Icon = badge?.icon;
                return (
                  <TableRow key={doc.doc_id} className="hover:bg-[#F8F9FA]" data-testid={`doc-row-${doc.doc_id}`}>
                    <TableCell className="text-xs font-medium">{doc.title}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]">{doc.category}</Badge></TableCell>
                    <TableCell className="font-mono text-xs text-[#0047AB]">{doc.version}</TableCell>
                    <TableCell>
                      {badge ? (
                        <Badge data-testid={`doc-approval-${doc.doc_id}`} className={`text-[10px] ${badge.color}`}>
                          <Icon className="w-2.5 h-2.5 mr-0.5" /> {badge.label}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">Borrador</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-[#475569]">{doc.created_by}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 flex-wrap">
                        {canWrite && (!approval || approval === 'rejected') && (
                          <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => handleSubmit(doc.doc_id)} data-testid={`doc-submit-${doc.doc_id}`}>
                            <Send className="w-3 h-3 mr-0.5" /> Enviar
                          </Button>
                        )}
                        {isApprover && approval === 'pending' && (
                          <>
                            <Button size="sm" className="h-7 text-[10px] bg-[#2A9D8F] hover:bg-[#238276]" onClick={() => handleApprove(doc.doc_id)} data-testid={`doc-approve-${doc.doc_id}`}>
                              <CheckCircle2 className="w-3 h-3 mr-0.5" /> Aprobar
                            </Button>
                            <Button size="sm" variant="outline" className="h-7 text-[10px] text-[#D90429] border-[#D90429]" onClick={() => setRejectDoc(doc)} data-testid={`doc-reject-${doc.doc_id}`}>
                              <XCircle className="w-3 h-3 mr-0.5" /> Rechazar
                            </Button>
                          </>
                        )}
                        {(doc.approval_history?.length > 0) && (
                          <Button size="sm" variant="ghost" className="h-7 text-[10px]" onClick={() => setHistoryDoc(doc)} data-testid={`doc-history-${doc.doc_id}`}>
                            <History className="w-3 h-3" />
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" className="h-7 text-red-500" onClick={() => handleDelete(doc.doc_id)} data-testid={`doc-delete-${doc.doc_id}`}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Reject dialog */}
      <Dialog open={!!rejectDoc} onOpenChange={(o) => !o && setRejectDoc(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Rechazar documento</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-xs text-[#475569]">Indica el motivo del rechazo. El autor recibira esta retroalimentacion.</p>
            <Textarea data-testid="reject-reason-input" value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Motivo del rechazo" rows={4} />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setRejectDoc(null)}>Cancelar</Button>
              <Button data-testid="confirm-reject-btn" className="bg-[#D90429]" onClick={confirmReject} aria-label="doc-reject-confirm-btn">Confirmar rechazo</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* History dialog */}
      <Dialog open={!!historyDoc} onOpenChange={(o) => !o && setHistoryDoc(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Historial de aprobacion - {historyDoc?.title}</DialogTitle></DialogHeader>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {(historyDoc?.approval_history || []).map((h, i) => (
              <div key={i} className="border-l-2 border-[#0047AB] pl-3 py-1">
                <p className="text-xs font-semibold text-[#0F172A]">{h.action.toUpperCase()}</p>
                <p className="text-[10px] text-[#475569]">Por: {h.by_name || 'Usuario'} - {new Date(h.at).toLocaleString('es-CO')}</p>
                {h.comment && <p className="text-xs text-[#475569] mt-1 italic">"{h.comment}"</p>}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
