import React, { useState, useEffect, useCallback } from 'react';
import API from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle2, XCircle, Clock, FileText, ClipboardCheck, Inbox, History } from 'lucide-react';
import { toast } from 'sonner';

export default function Approvals() {
  const { user } = useAuth();
  const [data, setData] = useState({ documents: [], audits: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [rejectItem, setRejectItem] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [historyItem, setHistoryItem] = useState(null);
  const [detail, setDetail] = useState(null);

  const fetchPending = useCallback(async () => {
    try {
      const res = await API.get('/approvals/pending');
      setData(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPending(); }, [fetchPending]);

  const openDocDetail = async (docId) => {
    try {
      const res = await API.get('/documents');
      const doc = res.data.find(d => d.doc_id === docId);
      setDetail({ kind: 'document', ...doc });
    } catch { toast.error('Error al cargar documento'); }
  };

  const openAuditDetail = async (auditId) => {
    try {
      const res = await API.get(`/audits/${auditId}`);
      setDetail({ kind: 'audit', ...res.data });
    } catch { toast.error('Error al cargar auditoria'); }
  };

  const approveDoc = async (docId) => {
    try {
      await API.post(`/documents/${docId}/approve`, {});
      toast.success('Documento aprobado');
      fetchPending();
      setDetail(null);
    } catch (err) { toast.error(err.response?.data?.detail || 'Error al aprobar'); }
  };

  const approveAudit = async (auditId) => {
    try {
      await API.post(`/audits/${auditId}/approve-closure`, {});
      toast.success('Cierre de auditoria aprobado');
      fetchPending();
      setDetail(null);
    } catch (err) { toast.error(err.response?.data?.detail || 'Error al aprobar'); }
  };

  const confirmReject = async () => {
    if (!rejectReason.trim()) { toast.error('Motivo requerido'); return; }
    try {
      const path = rejectItem.kind === 'document'
        ? `/documents/${rejectItem.id}/reject`
        : `/audits/${rejectItem.id}/reject-closure`;
      await API.post(path, { reason: rejectReason });
      toast.success('Rechazado');
      setRejectItem(null); setRejectReason('');
      fetchPending();
      setDetail(null);
    } catch (err) { toast.error(err.response?.data?.detail || 'Error'); }
  };

  const formatDate = (iso) => {
    if (!iso) return 'N/A';
    try { return new Date(iso).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' }); }
    catch { return iso; }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-[#0047AB] border-t-transparent rounded-full animate-spin" /></div>;

  const docs = data.documents || [];
  const audits = data.audits || [];

  return (
    <div className="space-y-6 animate-fade-in" data-testid="approvals-page">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2" style={{ fontFamily: 'Outfit' }}>
            <Inbox className="w-6 h-6 text-[#F97316]" />
            Aprobaciones Pendientes
            {data.total > 0 && <Badge className="bg-[#F97316] text-white">{data.total}</Badge>}
          </h1>
          <p className="text-sm text-[#475569] mt-1">Documentos y cierres de auditoria esperando tu revision</p>
        </div>
      </div>

      {data.total === 0 ? (
        <Card className="border border-dashed border-[#E2E8F0] bg-white">
          <CardContent className="py-16 text-center">
            <CheckCircle2 className="w-12 h-12 text-[#2A9D8F] mx-auto mb-3" />
            <p className="text-sm font-semibold text-[#0F172A]">Todo al dia</p>
            <p className="text-xs text-[#94A3B8] mt-1">No hay aprobaciones pendientes en este momento.</p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue={docs.length > 0 ? 'documents' : 'audits'}>
          <TabsList>
            <TabsTrigger value="documents" data-testid="tab-documents">
              <FileText className="w-3 h-3 mr-1" /> Documentos ({docs.length})
            </TabsTrigger>
            <TabsTrigger value="audits" data-testid="tab-audits">
              <ClipboardCheck className="w-3 h-3 mr-1" /> Auditorias ({audits.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="documents" className="mt-4 space-y-3">
            {docs.length === 0 ? (
              <Card className="border border-[#E2E8F0] bg-white"><CardContent className="py-8 text-center"><p className="text-xs text-[#94A3B8]">Sin documentos pendientes</p></CardContent></Card>
            ) : docs.map(d => (
              <Card key={d.doc_id} className="border border-[#F97316]/40 bg-[#F97316]/5 hover:border-[#F97316] transition-colors" data-testid={`pending-doc-${d.doc_id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="text-sm font-bold text-[#0F172A]">{d.title}</h3>
                        <Badge variant="outline" className="text-[10px]">{d.category}</Badge>
                        <Badge className="bg-[#F97316] text-white text-[10px]"><Clock className="w-2.5 h-2.5 mr-0.5" /> Pendiente</Badge>
                      </div>
                      <p className="text-xs text-[#475569]">Version {d.version} · Enviado por <b>{d.submitted_by || 'N/A'}</b> · {formatDate(d.submitted_at)}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => openDocDetail(d.doc_id)} data-testid={`detail-doc-${d.doc_id}`}>Ver detalle</Button>
                      <Button size="sm" className="h-8 text-xs bg-[#2A9D8F] hover:bg-[#238276]" onClick={() => approveDoc(d.doc_id)} data-testid={`approve-doc-${d.doc_id}`}>
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Aprobar
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 text-xs border-[#D90429] text-[#D90429]" onClick={() => setRejectItem({ kind: 'document', id: d.doc_id, title: d.title })} data-testid={`reject-doc-${d.doc_id}`}>
                        <XCircle className="w-3 h-3 mr-1" /> Rechazar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="audits" className="mt-4 space-y-3">
            {audits.length === 0 ? (
              <Card className="border border-[#E2E8F0] bg-white"><CardContent className="py-8 text-center"><p className="text-xs text-[#94A3B8]">Sin cierres pendientes</p></CardContent></Card>
            ) : audits.map(a => (
              <Card key={a.audit_id} className="border border-[#F97316]/40 bg-[#F97316]/5 hover:border-[#F97316] transition-colors" data-testid={`pending-audit-${a.audit_id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="text-sm font-bold text-[#0F172A]">{a.title}</h3>
                        <Badge variant="outline" className="text-[10px]">{a.audit_type}</Badge>
                        <Badge className="bg-[#F97316] text-white text-[10px]"><Clock className="w-2.5 h-2.5 mr-0.5" /> Cierre pendiente</Badge>
                      </div>
                      <p className="text-xs text-[#475569]">Enviado por <b>{a.submitted_by || 'N/A'}</b> · {formatDate(a.submitted_at)}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => openAuditDetail(a.audit_id)} data-testid={`detail-audit-${a.audit_id}`}>Ver detalle</Button>
                      <Button size="sm" className="h-8 text-xs bg-[#2A9D8F] hover:bg-[#238276]" onClick={() => approveAudit(a.audit_id)} data-testid={`approve-audit-${a.audit_id}`}>
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Aprobar Cierre
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 text-xs border-[#D90429] text-[#D90429]" onClick={() => setRejectItem({ kind: 'audit', id: a.audit_id, title: a.title })} data-testid={`reject-audit-${a.audit_id}`}>
                        <XCircle className="w-3 h-3 mr-1" /> Rechazar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      )}

      {/* Reject dialog */}
      <Dialog open={!!rejectItem} onOpenChange={(o) => !o && setRejectItem(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Rechazar - {rejectItem?.title}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-xs text-[#475569]">Indica el motivo del rechazo. Se notificara al autor.</p>
            <Textarea data-testid="reject-reason-input" value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Motivo del rechazo" rows={4} />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setRejectItem(null)}>Cancelar</Button>
              <Button data-testid="confirm-reject-btn" className="bg-[#D90429] hover:bg-[#a00320]" onClick={confirmReject}>Confirmar rechazo</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail dialog */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{detail?.kind === 'document' ? `Documento: ${detail?.title}` : `Auditoria: ${detail?.title}`}</DialogTitle></DialogHeader>
          {detail?.kind === 'document' && (
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-[#F8F9FA] rounded"><p className="text-[10px] text-[#94A3B8]">Categoria</p><p className="font-semibold">{detail.category}</p></div>
                <div className="p-2 bg-[#F8F9FA] rounded"><p className="text-[10px] text-[#94A3B8]">Version</p><p className="font-mono">{detail.version}</p></div>
              </div>
              <div className="p-3 bg-white border border-[#E2E8F0] rounded">
                <p className="text-[10px] text-[#94A3B8] mb-1">Descripcion</p>
                <p className="text-xs whitespace-pre-wrap">{detail.description || '(Sin descripcion)'}</p>
              </div>
              <div className="flex gap-2 pt-2 border-t border-[#E2E8F0]">
                <Button className="flex-1 bg-[#2A9D8F] hover:bg-[#238276]" onClick={() => approveDoc(detail.doc_id)}><CheckCircle2 className="w-3 h-3 mr-1" /> Aprobar</Button>
                <Button variant="outline" className="flex-1 border-[#D90429] text-[#D90429]" onClick={() => setRejectItem({ kind: 'document', id: detail.doc_id, title: detail.title })}><XCircle className="w-3 h-3 mr-1" /> Rechazar</Button>
              </div>
            </div>
          )}
          {detail?.kind === 'audit' && (
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-[#F8F9FA] rounded"><p className="text-[10px] text-[#94A3B8]">Tipo</p><p className="font-semibold">{detail.audit_type}</p></div>
                <div className="p-2 bg-[#F8F9FA] rounded"><p className="text-[10px] text-[#94A3B8]">Estado</p><p className="font-semibold">{detail.status}</p></div>
                <div className="p-2 bg-[#F8F9FA] rounded"><p className="text-[10px] text-[#94A3B8]">Auditor</p><p className="font-semibold">{detail.auditor}</p></div>
                <div className="p-2 bg-[#F8F9FA] rounded"><p className="text-[10px] text-[#94A3B8]">COPASST</p><p className="font-semibold">{detail.copasst_member?.name || 'N/A'}</p></div>
                <div className="p-2 bg-[#F8F9FA] rounded"><p className="text-[10px] text-[#94A3B8]">Fecha Cierre</p><p className="font-mono">{detail.pending_closure_data?.end_date || detail.end_date || 'N/A'}</p></div>
                <div className="p-2 bg-[#F8F9FA] rounded"><p className="text-[10px] text-[#94A3B8]">Hora Cierre</p><p className="font-mono">{detail.pending_closure_data?.end_time || detail.end_time || 'N/A'}</p></div>
              </div>
              <div className="p-3 bg-white border border-[#E2E8F0] rounded">
                <p className="text-[10px] text-[#94A3B8] mb-1">Hallazgos</p>
                <p className="text-xs">Total: {detail.findings_count || 0}</p>
              </div>
              <div className="flex gap-2 pt-2 border-t border-[#E2E8F0]">
                <Button className="flex-1 bg-[#2A9D8F] hover:bg-[#238276]" onClick={() => approveAudit(detail.audit_id)}><CheckCircle2 className="w-3 h-3 mr-1" /> Aprobar Cierre</Button>
                <Button variant="outline" className="flex-1 border-[#D90429] text-[#D90429]" onClick={() => setRejectItem({ kind: 'audit', id: detail.audit_id, title: detail.title })}><XCircle className="w-3 h-3 mr-1" /> Rechazar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
