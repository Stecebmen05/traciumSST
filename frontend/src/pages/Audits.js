import React, { useState, useEffect, useCallback } from 'react';
import API from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AINarrativeEditor from '@/components/AINarrativeEditor';
import ActionPlansGantt from '@/components/ActionPlansGantt';
import { Separator } from '@/components/ui/separator';
import {
  Plus, Search, Trash2, CheckCircle, AlertCircle, Sparkles, Send, Eye, X, Clock,
  ClipboardCheck, FileText, ArrowRight, Calendar, BarChart3, Users, Upload, Download, FileDown, Edit3, Mail, ClipboardList
} from 'lucide-react';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const STATUS_LABELS = { planned: 'Programada', assigned: 'Asignada', in_progress: 'En Ejecucion', evidence_review: 'Revision Evidencias', findings_review: 'Revision Hallazgos', action_plan: 'Plan de Accion', follow_up: 'Seguimiento', closed: 'Cerrada', reviewed: 'Revisada' };
const STATUS_COLORS = { planned: '#94A3B8', assigned: '#3B82F6', in_progress: '#F97316', evidence_review: '#8B5CF6', findings_review: '#D90429', action_plan: '#FFC300', follow_up: '#0047AB', closed: '#2A9D8F', reviewed: '#2A9D8F' };
const STATUS_FLOW = ['planned', 'assigned', 'in_progress', 'evidence_review', 'findings_review', 'action_plan', 'follow_up', 'closed', 'reviewed'];

export default function Audits() {
  const { canWrite, canAuditWrite, permissions } = useAuth();
  const canEditAuditItems = permissions?.can_edit_audit_items || false;
  const canEditActionPlans = permissions?.can_edit_action_plans || false;
  const canUseAiNarrative = permissions?.can_use_ai_narrative || false;
  const [audits, setAudits] = useState([]);
  const [selectedAudit, setSelectedAudit] = useState(null);
  const [auditDetail, setAuditDetail] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('programming');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    title: '', audit_type: 'internal', pesv_level: 'avanzado', scheduled_date: '', start_time: '', end_date: '', end_time: '',
    auditor: '', scope: '', criteria: 'Resolucion 0312 de 2019, Decreto 1072 de 2015', objective: '',
    additional_auditors: [], process_responsibles: [], copasst_member: { name: '', role: '', participation: '' }
  });

  const fetchData = useCallback(async () => {
    try {
      const [aRes, hRes] = await Promise.all([
        API.get('/audits'),
        API.get('/audits/history/comparison').catch(() => ({ data: [] }))
      ]);
      setAudits(aRes.data);
      setHistory(hRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const fetchAuditDetail = async (auditId) => {
    try {
      const res = await API.get(`/audits/${auditId}`);
      setAuditDetail(res.data);
      setSelectedAudit(auditId);
    } catch { toast.error('Error cargando detalle'); }
  };

  const handleCreate = async () => {
    try {
      const res = await API.post('/audits', form);
      toast.success('Auditoria programada');
      setShowCreate(false);
      setForm({
        title: '', audit_type: 'internal', scheduled_date: '', start_time: '', end_date: '', end_time: '',
        auditor: '', scope: '', criteria: 'Resolucion 0312 de 2019, Decreto 1072 de 2015', objective: '',
        additional_auditors: [], process_responsibles: [], copasst_member: { name: '', role: '', participation: '' }
      });
      fetchData();
      fetchAuditDetail(res.data.audit_id);
    } catch (e) { toast.error(e.response?.data?.detail || 'Error'); }
  };

  const handleStatusChange = async (auditId, newStatus) => {
    try {
      await API.put(`/audits/${auditId}`, { status: newStatus });
      fetchData();
      if (selectedAudit === auditId) fetchAuditDetail(auditId);
      toast.success(`Estado: ${STATUS_LABELS[newStatus]}`);
    } catch { toast.error('Error'); }
  };

  const handleGenerateChecklist = async (auditId) => {
    try {
      const res = await API.post(`/audits/${auditId}/checklist/generate`);
      toast.success(res.data.message);
      fetchAuditDetail(auditId);
    } catch { toast.error('Error generando checklist'); }
  };

  const handleDelete = async (auditId) => {
    try { await API.delete(`/audits/${auditId}`); toast.success('Eliminada'); setSelectedAudit(null); setAuditDetail(null); fetchData(); }
    catch { toast.error('Error'); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-[#0047AB] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-fade-in" data-testid="audits-page">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Outfit' }}>Auditorias SG-SST</h1>
          <p className="text-sm text-[#475569] mt-1">Flujo completo de auditoria con soporte de IA</p>
        </div>
        {canEditAuditItems && (
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button data-testid="add-audit-btn" className="text-xs" style={{ backgroundColor: '#0047AB' }}>
                <Plus className="w-3 h-3 mr-1" /> Programar Auditoria
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle style={{ fontFamily: 'Outfit' }}>Programar Auditoria</DialogTitle></DialogHeader>
              <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                <div><Label className="text-xs font-semibold">Titulo</Label><Input data-testid="audit-title-input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="mt-1" placeholder="Auditoria interna SG-SST Q1 2026" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold">Tipo de Auditoria</Label>
                    <Select value={form.audit_type} onValueChange={v => {
                      const updates = { audit_type: v };
                      if (v === 'pesv') updates.criteria = 'Resolucion 40595 de 2022 - Plan Estrategico de Seguridad Vial';
                      else updates.criteria = 'Resolucion 0312 de 2019, Decreto 1072 de 2015';
                      setForm({...form, ...updates});
                    }}>
                      <SelectTrigger className="mt-1" data-testid="audit-type-select"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="internal">SG-SST Interna</SelectItem>
                        <SelectItem value="external">SG-SST Externa</SelectItem>
                        <SelectItem value="pesv">PESV (Seguridad Vial)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {form.audit_type === 'pesv' && (
                    <div>
                      <Label className="text-xs font-semibold">Nivel PESV</Label>
                      <Select value={form.pesv_level || 'avanzado'} onValueChange={v => setForm({...form, pesv_level: v})}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="basico">Basico</SelectItem>
                          <SelectItem value="estandar">Estandar</SelectItem>
                          <SelectItem value="avanzado">Avanzado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {form.audit_type !== 'pesv' && <div><Label className="text-xs font-semibold">Criterios</Label><Input value={form.criteria} onChange={e => setForm({...form, criteria: e.target.value})} className="mt-1" /></div>}
                </div>
                <Separator />
                <p className="text-xs font-bold text-[#1F3C5E] uppercase">Fechas y Horarios</p>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs font-semibold">Fecha Inicio</Label><Input data-testid="audit-date-input" type="date" value={form.scheduled_date} onChange={e => setForm({...form, scheduled_date: e.target.value})} className="mt-1" /></div>
                  <div><Label className="text-xs font-semibold">Hora Inicio</Label><Input type="time" value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})} className="mt-1" data-testid="audit-start-time" /></div>
                  <div><Label className="text-xs font-semibold">Fecha Fin (estimada)</Label><Input type="date" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} className="mt-1" /></div>
                  <div><Label className="text-xs font-semibold">Hora Fin (estimada)</Label><Input type="time" value={form.end_time} onChange={e => setForm({...form, end_time: e.target.value})} className="mt-1" data-testid="audit-end-time" /></div>
                </div>
                <Separator />
                <p className="text-xs font-bold text-[#1F3C5E] uppercase">Equipo Auditor</p>
                <div><Label className="text-xs font-semibold">Auditor Lider *</Label><Input value={form.auditor} onChange={e => setForm({...form, auditor: e.target.value})} className="mt-1" placeholder="Nombre del auditor lider" data-testid="audit-lead-auditor" /></div>
                <div><Label className="text-xs font-semibold">Auditores Adicionales (separar por coma)</Label><Input value={(form.additional_auditors || []).join(', ')} onChange={e => setForm({...form, additional_auditors: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})} className="mt-1" placeholder="Auditor apoyo 1, Observador 1" /></div>
                <Separator />
                <p className="text-xs font-bold text-[#1F3C5E] uppercase">Responsables del Proceso SG-SST</p>
                <div><Label className="text-xs font-semibold">Responsables (separar por coma)</Label><Input value={(form.process_responsibles || []).join(', ')} onChange={e => setForm({...form, process_responsibles: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})} className="mt-1" placeholder="Responsable SST, Lider de area" /></div>
                <Separator />
                <p className="text-xs font-bold text-[#D90429] uppercase">Miembro COPASST *</p>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label className="text-xs font-semibold">Nombre *</Label><Input value={form.copasst_member?.name || ''} onChange={e => setForm({...form, copasst_member: {...(form.copasst_member || {}), name: e.target.value}})} className="mt-1" data-testid="copasst-name" /></div>
                  <div><Label className="text-xs font-semibold">Rol</Label><Input value={form.copasst_member?.role || ''} onChange={e => setForm({...form, copasst_member: {...(form.copasst_member || {}), role: e.target.value}})} className="mt-1" placeholder="Presidente, Secretario" /></div>
                  <div><Label className="text-xs font-semibold">Participacion</Label><Input value={form.copasst_member?.participation || ''} onChange={e => setForm({...form, copasst_member: {...(form.copasst_member || {}), participation: e.target.value}})} className="mt-1" placeholder="Observador, Participante" /></div>
                </div>
                <Separator />
                <div><Label className="text-xs font-semibold">Objetivo</Label><Textarea value={form.objective} onChange={e => setForm({...form, objective: e.target.value})} className="mt-1" placeholder="Verificar cumplimiento del SG-SST..." /></div>
                <div><Label className="text-xs font-semibold">Alcance</Label><Textarea value={form.scope} onChange={e => setForm({...form, scope: e.target.value})} className="mt-1" placeholder="Todos los procesos del SG-SST..." /></div>
                <Button data-testid="save-audit-btn" onClick={handleCreate} className="w-full" style={{ backgroundColor: '#0047AB' }}>Programar Auditoria</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-[#F1F5F9] border border-[#E2E8F0] flex-wrap">
          <TabsTrigger value="programming" data-testid="tab-programming">Programacion</TabsTrigger>
          <TabsTrigger value="execution" data-testid="tab-execution">Ejecucion</TabsTrigger>
          <TabsTrigger value="findings" data-testid="tab-findings">Hallazgos</TabsTrigger>
          <TabsTrigger value="action_plans" data-testid="tab-action-plans">Plan de Accion</TabsTrigger>
          <TabsTrigger value="consolidation" data-testid="tab-consolidation">Consolidado</TabsTrigger>
          <TabsTrigger value="history" data-testid="tab-history">Historico</TabsTrigger>
        </TabsList>

        {/* PROGRAMMING TAB */}
        <TabsContent value="programming" className="space-y-4 mt-4">
          <AuditList audits={audits} onSelect={fetchAuditDetail} onStatusChange={handleStatusChange} onDelete={handleDelete} selectedId={selectedAudit} canWrite={canEditAuditItems} />
          {selectedAudit && auditDetail && (
            <AuditProgrammingEdit key={auditDetail.audit_id} audit={auditDetail} onRefresh={() => { fetchAuditDetail(selectedAudit); fetchData(); }} canWrite={canEditAuditItems} onClose={() => setSelectedAudit(null)} />
          )}
        </TabsContent>

        {/* EXECUTION TAB */}
        <TabsContent value="execution" className="space-y-4 mt-4">
          {!selectedAudit ? (
            <EmptyState msg="Selecciona una auditoria en la pestana Programacion" />
          ) : (
            <ExecutionView audit={auditDetail} onRefresh={() => fetchAuditDetail(selectedAudit)} onGenerateChecklist={() => handleGenerateChecklist(selectedAudit)} canWrite={canEditAuditItems} />
          )}
        </TabsContent>

        {/* FINDINGS TAB */}
        <TabsContent value="findings" className="space-y-4 mt-4">
          {!selectedAudit ? (
            <EmptyState msg="Selecciona una auditoria primero" />
          ) : (
            <FindingsView audit={auditDetail} onRefresh={() => fetchAuditDetail(selectedAudit)} canWrite={canEditAuditItems} />
          )}
        </TabsContent>

        {/* ACTION PLANS TAB */}
        <TabsContent value="action_plans" className="space-y-4 mt-4">
          {!selectedAudit ? (
            <EmptyState msg="Selecciona una auditoria primero" />
          ) : (
            <ActionPlansView audit={auditDetail} onRefresh={() => fetchAuditDetail(selectedAudit)} canWrite={canEditActionPlans} />
          )}
        </TabsContent>

        {/* CONSOLIDATION TAB */}
        <TabsContent value="consolidation" className="space-y-4 mt-4">
          {!selectedAudit ? (
            <EmptyState msg="Selecciona una auditoria primero" />
          ) : (
            <ConsolidationView audit={auditDetail} onRefresh={() => { fetchAuditDetail(selectedAudit); fetchData(); }} canWrite={canEditAuditItems} canUseAiNarrative={canUseAiNarrative} />
          )}
        </TabsContent>

        {/* HISTORY TAB */}
        <TabsContent value="history" className="space-y-4 mt-4">
          <HistoryView history={history} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState({ msg }) {
  return <Card className="border border-[#E2E8F0] bg-white"><CardContent className="p-8 text-center"><Search className="w-8 h-8 text-[#94A3B8] mx-auto mb-2" /><p className="text-xs text-[#94A3B8]">{msg}</p></CardContent></Card>;
}

// === AUDIT LIST ===
function AuditList({ audits, onSelect, onStatusChange, onDelete, selectedId, canWrite }) {
  const { canDownloadReports, user } = useAuth();
  const isPrivRole = ['admin', 'owner', 'auditor'].includes(user?.role);
  const canPlanAudit = ['admin', 'owner', 'auditor', 'sgsst_manager'].includes(user?.role);
  const [emailDlg, setEmailDlg] = useState({ open: false, audit: null, recipients: '', comment: '', sending: false });

  const handleSendEmail = async () => {
    if (!emailDlg.audit) return;
    setEmailDlg(d => ({ ...d, sending: true }));
    try {
      const recArr = emailDlg.recipients
        .split(/[,;\n]/)
        .map(s => s.trim())
        .filter(s => s && s.includes('@'));
      const res = await API.post(`/audits/${emailDlg.audit.audit_id}/plan/send-email`, {
        recipients: recArr,
        comment: emailDlg.comment,
      });
      const { sent = 0, total = 0, failed = [] } = res.data || {};
      if (sent > 0) toast.success(`Plan enviado a ${sent}/${total} destinatarios`);
      else toast.error('No se pudo enviar el Plan de Auditoria');
      if (failed.length) toast.warning(`Fallos: ${failed.join(', ')}`);
      setEmailDlg({ open: false, audit: null, recipients: '', comment: '', sending: false });
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al enviar el plan');
      setEmailDlg(d => ({ ...d, sending: false }));
    }
  };

  return (
    <div className="space-y-2">
      {audits.length === 0 ? <EmptyState msg="Sin auditorias programadas" /> : audits.map(a => (
        <Card key={a.audit_id} className={`border bg-white cursor-pointer transition-all hover:border-[#0047AB]/40 ${selectedId === a.audit_id ? 'border-[#0047AB] ring-1 ring-[#0047AB]/20' : 'border-[#E2E8F0]'}`} onClick={() => onSelect(a.audit_id)}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="text-sm font-semibold text-[#0F172A]">{a.title}</h3>
                  <Badge style={{ backgroundColor: STATUS_COLORS[a.status], color: '#fff' }} className="text-[10px]">{STATUS_LABELS[a.status]}</Badge>
                  <Badge variant={a.audit_type === 'pesv' ? 'secondary' : a.audit_type === 'internal' ? 'default' : 'outline'} className="text-[10px]" style={a.audit_type === 'pesv' ? { backgroundColor: '#7C3AED', color: '#fff' } : {}}>{a.audit_type === 'internal' ? 'SG-SST Interna' : a.audit_type === 'external' ? 'SG-SST Externa' : 'PESV'}</Badge>
                </div>
                <div className="flex items-center gap-4 text-[10px] text-[#94A3B8] flex-wrap">
                  <span><Calendar className="w-3 h-3 inline mr-0.5" />{a.scheduled_date}</span>
                  <span><Users className="w-3 h-3 inline mr-0.5" />{a.auditor || 'Sin asignar'}</span>
                  <span><AlertCircle className="w-3 h-3 inline mr-0.5" />{a.findings_count} hallazgos</span>
                  <span><ClipboardCheck className="w-3 h-3 inline mr-0.5" />{a.checklist_completed || 0}/{a.checklist_count || 0} checklist</span>
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0 flex-wrap justify-end">
                {canPlanAudit && (
                  <>
                    <Button size="sm" variant="outline" className="h-7 text-[10px] border-[#7C3AED]/40 text-[#7C3AED] hover:bg-[#7C3AED]/5" onClick={e => { e.stopPropagation(); window.open(`${process.env.REACT_APP_BACKEND_URL}/api/audits/${a.audit_id}/plan/pdf`, '_blank'); }} data-testid={`audit-plan-pdf-${a.audit_id}`}>
                      <ClipboardList className="w-3 h-3 mr-0.5" /> Plan PDF
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-[10px] border-[#0047AB]/40 text-[#0047AB] hover:bg-[#0047AB]/5" onClick={e => { e.stopPropagation(); setEmailDlg({ open: true, audit: a, recipients: '', comment: '', sending: false }); }} data-testid={`audit-plan-email-${a.audit_id}`}>
                      <Mail className="w-3 h-3 mr-0.5" /> Enviar Plan
                    </Button>
                  </>
                )}
                {canDownloadReports && (isPrivRole || ['closed', 'reviewed'].includes(a.status)) && (
                  <>
                    <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={e => { e.stopPropagation(); window.open(`${process.env.REACT_APP_BACKEND_URL}/api/audits/${a.audit_id}/opening-minutes/pdf`, '_blank'); }} data-testid={`opening-minutes-${a.audit_id}`}>
                      <FileDown className="w-3 h-3 mr-0.5" /> Acta Apertura
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={e => { e.stopPropagation(); window.open(`${process.env.REACT_APP_BACKEND_URL}/api/audits/${a.audit_id}/closing-minutes/pdf`, '_blank'); }} data-testid={`closing-minutes-${a.audit_id}`}>
                      <FileDown className="w-3 h-3 mr-0.5" /> Acta Cierre
                    </Button>
                  </>
                )}
                {canWrite && a.status !== 'reviewed' && (
                  <Select value={a.status} onValueChange={v => { onStatusChange(a.audit_id, v); }}>
                    <SelectTrigger className="w-[130px] h-7 text-[10px]" onClick={e => e.stopPropagation()}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUS_FLOW.map(s => <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
                {canWrite && <Button size="sm" variant="ghost" className="h-7 text-red-500" onClick={e => { e.stopPropagation(); onDelete(a.audit_id); }}><Trash2 className="w-3 h-3" /></Button>}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <Dialog open={emailDlg.open} onOpenChange={v => !v && setEmailDlg({ open: false, audit: null, recipients: '', comment: '', sending: false })}>
        <DialogContent className="max-w-lg" data-testid="audit-plan-email-dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#1F3C5E]">
              <Mail className="w-4 h-4 text-[#0047AB]" /> Enviar Plan de Auditoria por Email
            </DialogTitle>
          </DialogHeader>
          {emailDlg.audit && (
            <div className="space-y-3 text-sm">
              <div className="bg-[#F1F5F9] p-3 rounded border border-[#E2E8F0] text-[12px]">
                <div className="font-semibold text-[#0F172A]">{emailDlg.audit.title}</div>
                <div className="text-[#64748B] mt-1">
                  {emailDlg.audit.scheduled_date} - {emailDlg.audit.auditor || 'Sin auditor'}
                </div>
              </div>
              <div className="text-[11px] text-[#64748B] leading-relaxed bg-[#FEF3C7] border border-[#FCD34D] p-2 rounded">
                Se enviara automaticamente a Owner, Admins y Responsables SG-SST de la empresa.
                Agrega destinatarios adicionales abajo si lo necesitas (auditados, COPASST, etc.).
              </div>
              <div>
                <Label className="text-xs">Destinatarios adicionales (separados por coma)</Label>
                <Textarea
                  value={emailDlg.recipients}
                  onChange={e => setEmailDlg(d => ({ ...d, recipients: e.target.value }))}
                  placeholder="copasst@empresa.com, lider@empresa.com"
                  className="text-xs mt-1 h-16"
                  data-testid="audit-plan-email-recipients"
                />
              </div>
              <div>
                <Label className="text-xs">Nota adicional (opcional)</Label>
                <Textarea
                  value={emailDlg.comment}
                  onChange={e => setEmailDlg(d => ({ ...d, comment: e.target.value }))}
                  placeholder="Por favor confirmen su disponibilidad para la reunion de apertura."
                  className="text-xs mt-1 h-20"
                  data-testid="audit-plan-email-comment"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button size="sm" variant="outline" onClick={() => setEmailDlg({ open: false, audit: null, recipients: '', comment: '', sending: false })} disabled={emailDlg.sending} data-testid="audit-plan-email-cancel">
                  Cancelar
                </Button>
                <Button size="sm" className="bg-[#0047AB] hover:bg-[#003585]" onClick={handleSendEmail} disabled={emailDlg.sending} data-testid="audit-plan-email-send">
                  {emailDlg.sending ? 'Enviando...' : (<><Send className="w-3 h-3 mr-1" /> Enviar</>)}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// === AUDIT PROGRAMMING EDIT ===
function AuditProgrammingEdit({ audit, onRefresh, canWrite, onClose }) {
  const isClosed = audit.status === 'closed' || audit.status === 'reviewed';
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setEditForm({
      title: audit.title || '', audit_type: audit.audit_type || 'internal',
      scheduled_date: audit.scheduled_date || '', start_time: audit.start_time || '',
      end_date: audit.end_date || '', end_time: audit.end_time || '',
      auditor: audit.auditor || '',
      additional_auditors: (audit.additional_auditors || []).join(', '),
      process_responsibles: (audit.process_responsibles || []).join(', '),
      copasst_member: audit.copasst_member || { name: '', role: '', participation: '' },
      scope: audit.scope || '', criteria: audit.criteria || '', objective: audit.objective || '',
    });
  }, [audit.audit_id, audit.title, audit.scheduled_date, audit.auditor, audit.status]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...editForm,
        additional_auditors: editForm.additional_auditors.split(',').map(s => s.trim()).filter(Boolean),
        process_responsibles: editForm.process_responsibles.split(',').map(s => s.trim()).filter(Boolean),
      };
      await API.put(`/audits/${audit.audit_id}`, payload);
      toast.success('Programacion actualizada');
      setCollapsed(true);
      onRefresh();
    } catch (err) { toast.error(err.response?.data?.detail || 'Error al guardar'); }
    finally { setSaving(false); }
  };

  const history = audit.change_history || [];

  if (collapsed) return null;

  return (
    <Card className="border border-[#E2E8F0] bg-white">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold" style={{ fontFamily: 'Outfit' }}>
            <Edit3 className="w-4 h-4 inline mr-1" />Programacion: {audit.title}
            {isClosed && <Badge className="ml-2 bg-[#94A3B8] text-white text-[10px]">Bloqueada (Cerrada)</Badge>}
          </CardTitle>
          {history.length > 0 && (
            <Button size="sm" variant="ghost" className="h-6 text-[10px] text-[#94A3B8]" onClick={() => setShowHistory(!showHistory)} data-testid="show-change-history">
              {showHistory ? 'Ocultar' : `Ver Historial (${history.length})`}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isClosed && (
          <div className="flex items-center gap-3 p-3 bg-[#D90429]/5 rounded border border-[#D90429]/20">
            <p className="text-xs text-[#D90429] flex-1">La auditoria esta cerrada. Reabra para editar la programacion.</p>
            <Button size="sm" className="text-xs h-7" style={{ backgroundColor: '#0047AB' }} onClick={async () => {
              try { await API.put(`/audits/${audit.audit_id}`, { status: 'in_progress' }); toast.success('Auditoria reabierta'); onRefresh(); }
              catch (err) { toast.error(err.response?.data?.detail || 'Error'); }
            }} data-testid="reopen-audit-btn">Reabrir Auditoria</Button>
          </div>
        )}
        <fieldset disabled={isClosed}>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs font-semibold">Titulo</Label><Input value={editForm.title || ''} onChange={e => setEditForm({...editForm, title: e.target.value})} className="mt-1" data-testid="edit-title" /></div>
            <div>
              <Label className="text-xs font-semibold">Tipo</Label>
              <Select value={editForm.audit_type || 'internal'} onValueChange={v => setEditForm({...editForm, audit_type: v})}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="internal">SG-SST Interna</SelectItem><SelectItem value="external">SG-SST Externa</SelectItem><SelectItem value="pesv">PESV (Seguridad Vial)</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3 mt-2">
            <div><Label className="text-xs font-semibold">Fecha Inicio</Label><Input type="date" value={editForm.scheduled_date || ''} onChange={e => setEditForm({...editForm, scheduled_date: e.target.value})} className="mt-1" data-testid="edit-start-date" /></div>
            <div><Label className="text-xs font-semibold">Hora Inicio</Label><Input type="time" value={editForm.start_time || ''} onChange={e => setEditForm({...editForm, start_time: e.target.value})} className="mt-1" /></div>
            <div><Label className="text-xs font-semibold">Fecha Fin</Label><Input type="date" value={editForm.end_date || ''} onChange={e => setEditForm({...editForm, end_date: e.target.value})} className="mt-1" /></div>
            <div><Label className="text-xs font-semibold">Hora Fin</Label><Input type="time" value={editForm.end_time || ''} onChange={e => setEditForm({...editForm, end_time: e.target.value})} className="mt-1" /></div>
          </div>
          <Separator className="my-3" />
          <p className="text-xs font-bold text-[#1F3C5E] uppercase">Equipo Auditor</p>
          <div className="grid grid-cols-2 gap-3 mt-1">
            <div><Label className="text-xs font-semibold">Auditor Lider *</Label><Input value={editForm.auditor || ''} onChange={e => setEditForm({...editForm, auditor: e.target.value})} className="mt-1" data-testid="edit-auditor" /></div>
            <div><Label className="text-xs font-semibold">Auditores Adicionales</Label><Input value={editForm.additional_auditors || ''} onChange={e => setEditForm({...editForm, additional_auditors: e.target.value})} className="mt-1" placeholder="Separar por coma" /></div>
          </div>
          <div className="mt-2"><Label className="text-xs font-semibold">Responsables del Proceso SG-SST</Label><Input value={editForm.process_responsibles || ''} onChange={e => setEditForm({...editForm, process_responsibles: e.target.value})} className="mt-1" placeholder="Separar por coma" /></div>
          <Separator className="my-3" />
          <p className="text-xs font-bold text-[#D90429] uppercase">Miembro COPASST *</p>
          <div className="grid grid-cols-3 gap-3 mt-1">
            <div><Label className="text-xs font-semibold">Nombre</Label><Input value={editForm.copasst_member?.name || ''} onChange={e => setEditForm({...editForm, copasst_member: {...(editForm.copasst_member || {}), name: e.target.value}})} className="mt-1" data-testid="edit-copasst-name" /></div>
            <div><Label className="text-xs font-semibold">Rol</Label><Input value={editForm.copasst_member?.role || ''} onChange={e => setEditForm({...editForm, copasst_member: {...(editForm.copasst_member || {}), role: e.target.value}})} className="mt-1" /></div>
            <div><Label className="text-xs font-semibold">Participacion</Label><Input value={editForm.copasst_member?.participation || ''} onChange={e => setEditForm({...editForm, copasst_member: {...(editForm.copasst_member || {}), participation: e.target.value}})} className="mt-1" /></div>
          </div>
          <Separator className="my-3" />
          <div><Label className="text-xs font-semibold">Objetivo</Label><Textarea value={editForm.objective || ''} onChange={e => setEditForm({...editForm, objective: e.target.value})} className="mt-1 text-xs" /></div>
          <div className="mt-2"><Label className="text-xs font-semibold">Alcance</Label><Textarea value={editForm.scope || ''} onChange={e => setEditForm({...editForm, scope: e.target.value})} className="mt-1 text-xs" /></div>
          <div className="mt-2"><Label className="text-xs font-semibold">Criterios</Label><Input value={editForm.criteria || ''} onChange={e => setEditForm({...editForm, criteria: e.target.value})} className="mt-1" /></div>
          {!isClosed && <Button data-testid="save-programming-btn" onClick={handleSave} disabled={saving} className="w-full mt-3" style={{ backgroundColor: '#0047AB' }}>{saving ? 'Guardando...' : 'Guardar Cambios en Programacion'}</Button>}
        </fieldset>
        {showHistory && history.length > 0 && (
          <div className="border-t border-[#E2E8F0] pt-3 mt-3">
            <p className="text-xs font-bold text-[#94A3B8] mb-2">Historial de Cambios en Programacion</p>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {history.slice().reverse().map((ch, i) => (
                <div key={i} className="text-[10px] p-1.5 bg-[#F8F9FA] rounded flex gap-2">
                  <span className="font-mono text-[#0047AB]">{ch.field}</span>
                  <span className="text-[#94A3B8]">por {ch.by}</span>
                  <span className="text-[#94A3B8]">{ch.at?.split('T')[0]}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// === EXECUTION VIEW (Checklist) ===
function ExecutionView({ audit, onRefresh, onGenerateChecklist, canWrite }) {
  const [generating, setGenerating] = useState(false);
  if (!audit) return null;
  const checklist = audit.checklist || [];
  const score = audit.score_result || null;
  const evaluated = checklist.filter(c => ['cumple', 'no_cumple', 'parcial', 'no_aplica'].includes(c.result)).length;
  const compliant = checklist.filter(c => c.result === 'cumple').length;
  const nonCompliant = checklist.filter(c => c.result === 'no_cumple').length;
  const partial = checklist.filter(c => c.result === 'parcial').length;
  const naCount = checklist.filter(c => c.result === 'no_aplica').length;
  const hasNonCompliant = nonCompliant > 0 || partial > 0;

  const handleCheck = async (item, updates) => {
    try {
      await API.put(`/audits/${audit.audit_id}/checklist/${item.item_id}`, updates);
      // Silently refresh score without reloading entire view
      if (updates.result && updates.result !== item.result) {
        onRefresh();
      }
    }
    catch { toast.error('Error al guardar'); }
  };

  const handleGenerateFindings = async () => {
    setGenerating(true);
    try {
      const res = await API.post(`/audits/${audit.audit_id}/findings/generate-from-checklist`);
      toast.success(res.data.message);
      onRefresh();
    } catch { toast.error('Error generando hallazgos'); }
    finally { setGenerating(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold" style={{ fontFamily: 'Outfit' }}>Ejecucion: {audit.title}</h2>
          <p className="text-xs text-[#475569]">Checklist basado en estandares aplicables</p>
        </div>
        <div className="flex gap-2">
          {canWrite && hasNonCompliant && (
            <Button data-testid="generate-findings-btn" onClick={handleGenerateFindings} disabled={generating} className="text-xs" style={{ backgroundColor: '#D90429' }}>
              <AlertCircle className="w-3 h-3 mr-1" /> {generating ? 'Generando...' : `Generar Hallazgos (${nonCompliant + partial})`}
            </Button>
          )}
          {canWrite && checklist.length === 0 && (
            <Button data-testid="generate-checklist-btn" onClick={onGenerateChecklist} className="text-xs" style={{ backgroundColor: '#0047AB' }}>
              <ClipboardCheck className="w-3 h-3 mr-1" /> Generar Checklist
            </Button>
          )}
        </div>
      </div>
      {score && (
        <Card className="border-2" style={{ borderColor: score.classification?.color || '#E2E8F0' }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs font-semibold text-[#94A3B8] uppercase">{audit.audit_type === 'pesv' ? 'Puntaje PESV Res. 40595/2022' : 'Puntaje Res. 0312/2019'}</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-bold font-mono" style={{ color: score.classification?.color }}>{score.percentage}%</span>
                  {score.total_obtained != null && <span className="text-xs font-mono text-[#94A3B8]">{score.total_obtained}/{score.total_possible} pts</span>}
                </div>
              </div>
              <Badge data-testid="score-classification" className="text-xs px-3 py-1" style={{ backgroundColor: score.classification?.color, color: '#fff' }}>
                {score.classification?.label}
              </Badge>
            </div>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {(audit.audit_type === 'pesv' ? ['PLANIFICACION', 'IMPLEMENTACION', 'SEGUIMIENTO', 'MEJORA'] : ['PLANEAR', 'HACER', 'VERIFICAR', 'ACTUAR']).map(cycle => {
                const c = (audit.audit_type === 'pesv' ? score.by_fase : score.by_cycle)?.[cycle] || {};
                const pctVal = c.pct || 0;
                return (
                  <div key={cycle} className="text-center p-2 rounded bg-[#F8F9FA]">
                    <p className="text-[9px] font-bold text-[#94A3B8] uppercase">{cycle}</p>
                    <p className="text-sm font-bold font-mono" style={{ color: pctVal >= 85 ? '#2A9D8F' : pctVal >= 60 ? '#FFC300' : '#D90429' }}>{pctVal}%</p>
                    <p className="text-[9px] text-[#94A3B8]">{c.cumple || c.obtained || 0}/{c.total || c.possible || 0}</p>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-[#475569] mt-2 leading-relaxed">{score.classification?.action}</p>
          </CardContent>
        </Card>
      )}

      {checklist.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Card className="border border-[#E2E8F0] bg-white"><CardContent className="p-3 text-center"><p className="text-[10px] text-[#94A3B8] uppercase">Evaluados</p><p className="text-xl font-bold font-mono text-[#0047AB]">{evaluated}/{checklist.length}</p></CardContent></Card>
          <Card className="border border-[#2A9D8F]/20 bg-[#2A9D8F]/5"><CardContent className="p-3 text-center"><p className="text-[10px] text-[#94A3B8] uppercase">Cumple</p><p className="text-xl font-bold font-mono" style={{ color: '#2A9D8F' }}>{compliant}</p></CardContent></Card>
          <Card className="border border-[#D90429]/20 bg-[#D90429]/5"><CardContent className="p-3 text-center"><p className="text-[10px] text-[#94A3B8] uppercase">No Cumple</p><p className="text-xl font-bold font-mono" style={{ color: '#D90429' }}>{nonCompliant}</p></CardContent></Card>
          <Card className="border border-[#FFC300]/20 bg-[#FFC300]/5"><CardContent className="p-3 text-center"><p className="text-[10px] text-[#94A3B8] uppercase">Parcial</p><p className="text-xl font-bold font-mono" style={{ color: '#B8860B' }}>{partial}</p></CardContent></Card>
          <Card className="border border-[#E2E8F0] bg-[#F8F9FA]"><CardContent className="p-3 text-center"><p className="text-[10px] text-[#94A3B8] uppercase">No Aplica</p><p className="text-xl font-bold font-mono text-[#94A3B8]">{naCount}</p></CardContent></Card>
        </div>
      )}
      {checklist.length > 0 && (
        <Card className="border border-[#E2E8F0] bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[#94A3B8]">Progreso de evaluacion ({evaluated}/{checklist.length} items)</span>
              <span className="font-mono text-sm font-bold" style={{ color: '#0047AB' }}>{score?.percentage || 0}%</span>
            </div>
            <Progress value={checklist.length > 0 ? Math.round((evaluated / checklist.length) * 100) : 0} className="h-2" />
          </CardContent>
        </Card>
      )}
      <div className="space-y-1">
        {checklist.map(item => (
          <ChecklistRow key={item.item_id} item={item} auditId={audit.audit_id} onUpdate={handleCheck} canWrite={canWrite} />
        ))}
      </div>
    </div>
  );
}

function ChecklistRow({ item, auditId, onUpdate, canWrite }) {
  const [expanded, setExpanded] = useState(false);
  const [obs, setObs] = useState(item.observations || '');
  const [result, setResult] = useState(item.result || '');
  const [aiLoading, setAiLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const saveTimerRef = React.useRef(null);

  const handleAiObservation = async () => {
    setAiLoading(true);
    try {
      const res = await API.post('/audits/ai/assist', { type: 'checklist_observation', context: `Estandar ${item.code}: ${item.description}. Evidencia requerida: ${item.evidence_required}. Resultado: ${result || 'pendiente'}` });
      const newObs = res.data.result;
      setObs(newObs);
      toast.success('Observacion generada por IA');
      // Auto-save the AI observation
      doSave({ observations: newObs, result });
    } catch { toast.error('Error IA'); }
    finally { setAiLoading(false); }
  };

  const doSave = async (updates) => {
    setSaving(true);
    try {
      await onUpdate(item, updates);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { /* handled by parent */ }
    finally { setSaving(false); }
  };

  const handleResultChange = (v) => {
    setResult(v);
    doSave({ result: v, checked: true, observations: obs });
  };

  const handleObsChange = (e) => {
    const val = e.target.value;
    setObs(val);
    // Debounce auto-save: save 1.2s after user stops typing
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      if (val !== item.observations) {
        doSave({ observations: val, result });
      }
    }, 1200);
  };

  // Cleanup timer on unmount
  React.useEffect(() => { return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); }; }, []);

  const resultBadge = () => {
    if (!item.result) return null;
    const styles = {
      cumple: 'bg-[#2A9D8F] text-white',
      no_cumple: 'bg-[#D90429] text-white',
      parcial: 'bg-[#FFC300] text-[#0F172A]',
      no_aplica: 'bg-[#94A3B8] text-white',
    };
    const labels = { cumple: 'Cumple', no_cumple: 'No Cumple', parcial: 'Parcial', no_aplica: 'No Aplica' };
    return <Badge className={`text-[10px] ${styles[item.result] || ''}`}>{labels[item.result] || item.result}</Badge>;
  };

  const borderColor = item.result === 'cumple' ? 'border-[#2A9D8F]/30' : item.result === 'no_cumple' ? 'border-[#D90429]/30' : item.result === 'parcial' ? 'border-[#FFC300]/30' : item.result === 'no_aplica' ? 'border-[#94A3B8]/30' : 'border-[#E2E8F0]';

  return (
    <div className={`border rounded-lg bg-white ${borderColor}`}>
      <div className="flex items-center gap-3 p-3 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-[#0047AB]">{item.code}</span>
            <Badge variant="outline" className="text-[10px]">{item.phva}</Badge>
            {resultBadge()}
            {saving && <span className="text-[9px] text-[#94A3B8] animate-pulse">Guardando...</span>}
            {saved && <span className="text-[9px] text-[#2A9D8F]">Guardado</span>}
          </div>
          <p className={`text-xs mt-0.5 ${item.result === 'no_aplica' ? 'text-[#94A3B8] line-through' : 'text-[#0F172A]'}`}>{item.description}</p>
        </div>
        {item.result === 'cumple' ? <CheckCircle className="w-4 h-4 text-[#2A9D8F] flex-shrink-0" /> : item.result === 'no_cumple' ? <AlertCircle className="w-4 h-4 text-[#D90429] flex-shrink-0" /> : item.result === 'no_aplica' ? <div className="w-4 h-4 rounded-full bg-[#94A3B8] flex-shrink-0" /> : <div className="w-4 h-4 rounded-full border-2 border-[#E2E8F0] flex-shrink-0" />}
      </div>
      {expanded && canWrite && (
        <div className="px-3 pb-3 border-t border-[#E2E8F0] pt-3 space-y-2">
          {item.criterio && (
            <div className="bg-[#F0F4FF] border border-[#0047AB]/10 rounded p-2">
              <p className="text-[10px] font-bold text-[#0047AB] uppercase mb-0.5">Criterio (Res. 0312)</p>
              <p className="text-[10px] text-[#1E293B] leading-relaxed">{item.criterio}</p>
            </div>
          )}
          {item.modo_verificacion && (
            <div className="bg-[#FFFBEB] border border-[#FFC300]/20 rounded p-2">
              <p className="text-[10px] font-bold text-[#B8860B] uppercase mb-0.5">Modo de Verificacion</p>
              <p className="text-[10px] text-[#1E293B] leading-relaxed">{item.modo_verificacion}</p>
            </div>
          )}
          <p className="text-[10px] text-[#475569]"><span className="font-semibold">Evidencia requerida:</span> {item.evidence_required}</p>
          <div>
            <Label className="text-[10px] font-semibold">Resultado</Label>
            <Select value={result} onValueChange={handleResultChange}>
              <SelectTrigger className="h-7 text-xs mt-0.5" data-testid={`result-select-${item.item_id}`}><SelectValue placeholder="Evaluar" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cumple">Cumple</SelectItem>
                <SelectItem value="no_cumple">No Cumple</SelectItem>
                <SelectItem value="parcial">Cumple Parcialmente</SelectItem>
                <SelectItem value="no_aplica">No Aplica</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {result !== 'no_aplica' && (
            <div>
              <div className="flex items-center justify-between">
                <Label className="text-[10px] font-semibold">Observaciones <span className="font-normal text-[#94A3B8]">(auto-guarda)</span></Label>
                <Button size="sm" variant="ghost" className="h-6 text-[10px] text-[#0047AB]" onClick={handleAiObservation} disabled={aiLoading}>
                  <Sparkles className="w-3 h-3 mr-0.5" />{aiLoading ? 'Generando...' : 'Redactar con IA'}
                </Button>
              </div>
              <Textarea value={obs} onChange={handleObsChange} className="text-xs h-16 mt-0.5" placeholder="Escriba sus observaciones. Se guardaran automaticamente..." />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// === FINDINGS VIEW ===
function FindingsView({ audit, onRefresh, canWrite }) {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ finding_type: 'no_conformity', description: '', area: '', standard_ref: '', corrective_action: '', responsible: '', due_date: '' });
  const [aiLoading, setAiLoading] = useState(false);
  if (!audit) return null;
  const findings = audit.findings || [];

  const handleCreate = async () => {
    try { await API.post('/findings', { ...form, audit_id: audit.audit_id }); toast.success('Hallazgo registrado'); setShowCreate(false); setForm({ finding_type: 'no_conformity', description: '', area: '', standard_ref: '', corrective_action: '', responsible: '', due_date: '' }); onRefresh(); }
    catch { toast.error('Error'); }
  };

  const handleAiFinding = async () => {
    setAiLoading(true);
    try {
      const ncItems = (audit.checklist || []).filter(c => c.result === 'no_cumple');
      const context = `Auditoria: ${audit.title}. Items no conformes:\n${ncItems.map(i => `- ${i.code}: ${i.description}`).join('\n')}\n\nRedacta un hallazgo de auditoria para el area: ${form.area || 'General'}. Estandar: ${form.standard_ref || 'General'}`;
      const res = await API.post('/audits/ai/assist', { type: 'finding', context });
      setForm(f => ({ ...f, description: res.data.result }));
      toast.success('Hallazgo redactado por IA');
    } catch { toast.error('Error IA'); }
    finally { setAiLoading(false); }
  };

  const handleClose = async (fId) => {
    try { await API.put(`/findings/${fId}`, { status: 'closed' }); toast.success('Cerrado'); onRefresh(); }
    catch { toast.error('Error'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold" style={{ fontFamily: 'Outfit' }}>Hallazgos: {audit.title}</h2>
        {canWrite && (
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button data-testid="add-finding-btn" className="text-xs" style={{ backgroundColor: '#D90429' }}><Plus className="w-3 h-3 mr-1" /> Nuevo Hallazgo</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle style={{ fontFamily: 'Outfit' }}>Registrar Hallazgo</DialogTitle></DialogHeader>
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold">Tipo</Label>
                    <Select value={form.finding_type} onValueChange={v => setForm({...form, finding_type: v})}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no_conformity">No Conformidad</SelectItem>
                        <SelectItem value="observation">Observacion</SelectItem>
                        <SelectItem value="improvement">Oportunidad de Mejora</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label className="text-xs font-semibold">Estandar Ref.</Label><Input value={form.standard_ref} onChange={e => setForm({...form, standard_ref: e.target.value})} className="mt-1" placeholder="3.2.1" /></div>
                </div>
                <div><Label className="text-xs font-semibold">Area</Label><Input value={form.area} onChange={e => setForm({...form, area: e.target.value})} className="mt-1" /></div>
                <div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold">Descripcion del Hallazgo</Label>
                    <Button size="sm" variant="ghost" className="h-6 text-[10px] text-[#0047AB]" onClick={handleAiFinding} disabled={aiLoading}>
                      <Sparkles className="w-3 h-3 mr-0.5" />{aiLoading ? 'Redactando...' : 'Redactar con IA'}
                    </Button>
                  </div>
                  <Textarea data-testid="finding-desc-input" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="mt-1 min-h-[80px]" />
                </div>
                <div><Label className="text-xs font-semibold">Responsable</Label><Input value={form.responsible} onChange={e => setForm({...form, responsible: e.target.value})} className="mt-1" /></div>
                <div><Label className="text-xs font-semibold">Fecha Limite</Label><Input type="date" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})} className="mt-1" /></div>
                <Button data-testid="save-finding-btn" onClick={handleCreate} className="w-full" style={{ backgroundColor: '#D90429' }}>Registrar Hallazgo</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'No Conformidades', count: findings.filter(f => f.finding_type === 'no_conformity').length, color: '#D90429' },
          { label: 'Observaciones', count: findings.filter(f => f.finding_type === 'observation').length, color: '#FFC300' },
          { label: 'Mejoras', count: findings.filter(f => f.finding_type === 'improvement').length, color: '#2A9D8F' },
        ].map(s => (
          <Card key={s.label} className="border border-[#E2E8F0] bg-white"><CardContent className="p-3 text-center"><p className="text-[10px] text-[#94A3B8] uppercase">{s.label}</p><p className="text-xl font-bold" style={{ fontFamily: 'JetBrains Mono', color: s.color }}>{s.count}</p></CardContent></Card>
        ))}
      </div>
      <div className="space-y-2">
        {findings.map(f => (
          <Card key={f.finding_id} className="border border-[#E2E8F0] bg-white">
            <CardContent className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={f.finding_type === 'no_conformity' ? 'destructive' : f.finding_type === 'observation' ? 'default' : 'secondary'} className="text-[10px]">
                      {f.finding_type === 'no_conformity' ? 'NC' : f.finding_type === 'observation' ? 'OBS' : 'OM'}
                    </Badge>
                    {f.standard_ref && <span className="text-[10px] font-mono text-[#0047AB]">{f.standard_ref}</span>}
                    <Badge variant={f.status === 'closed' ? 'default' : 'secondary'} className="text-[10px]">{f.status}</Badge>
                  </div>
                  <p className="text-xs text-[#0F172A]">{f.description}</p>
                  <div className="flex gap-3 text-[10px] text-[#94A3B8] mt-1">
                    {f.area && <span>Area: {f.area}</span>}
                    {f.responsible && <span>Resp: {f.responsible}</span>}
                    {f.due_date && <span>Limite: {f.due_date}</span>}
                  </div>
                </div>
                {canWrite && f.status !== 'closed' && (
                  <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => handleClose(f.finding_id)}>
                    <CheckCircle className="w-3 h-3 mr-0.5" /> Cerrar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// === ACTION PLANS VIEW ===
function ActionPlansView({ audit, onRefresh, canWrite }) {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ finding_id: '', action: '', action_type: 'corrective', responsible: '', start_date: '', due_date: '', resources: '', evidence: '' });
  const [aiLoading, setAiLoading] = useState({});
  const [followUpNote, setFollowUpNote] = useState({});
  if (!audit) return null;
  const plans = audit.action_plans || [];
  const findings = audit.findings || [];

  const handleCreate = async () => {
    try { await API.post('/action-plans', { ...form, audit_id: audit.audit_id }); toast.success('Plan creado'); setShowCreate(false); setForm({ finding_id: '', action: '', action_type: 'corrective', responsible: '', start_date: '', due_date: '', resources: '', evidence: '' }); onRefresh(); }
    catch { toast.error('Error'); }
  };

  const buildContext = () => {
    const finding = findings.find(f => f.finding_id === form.finding_id);
    const typeLabels = { corrective: 'Correctiva', preventive: 'Preventiva', improvement: 'Mejora' };
    const parts = [
      `Empresa: ${audit?.company_name || 'N/A'}`,
      `Hallazgo: ${finding?.description || finding?.title || 'General'}`,
      `Tipo de hallazgo: ${finding?.finding_type || 'no_conformity'}`,
      `Severidad: ${finding?.severity || 'N/A'}`,
      `Area: ${finding?.area || 'General'}`,
      `Tipo de accion solicitada: ${typeLabels[form.action_type] || form.action_type}`,
    ];
    if (form.action) parts.push(`Accion actual a mejorar: ${form.action}`);
    if (form.responsible) parts.push(`Responsable: ${form.responsible}`);
    if (form.due_date) parts.push(`Fecha limite: ${form.due_date}`);
    return parts.join('. ') + '.';
  };

  const aiSuggest = async (field) => {
    if (!form.finding_id) { toast.error('Selecciona un hallazgo primero'); return; }
    setAiLoading(p => ({ ...p, [field]: true }));
    try {
      const typeMap = { action: 'action_plan_action', resources: 'action_plan_resources', evidence: 'action_plan_evidence' };
      const res = await API.post('/audits/ai/assist', { type: typeMap[field], context: buildContext() });
      setForm(f => ({ ...f, [field]: res.data.result }));
      toast.success('Sugerencia generada por IA');
    } catch { toast.error('Error IA'); }
    finally { setAiLoading(p => ({ ...p, [field]: false })); }
  };

  const handleAddFollowUp = async (planId) => {
    const note = followUpNote[planId];
    if (!note) return;
    try { await API.post(`/action-plans/${planId}/follow-up`, { note }); toast.success('Seguimiento agregado'); setFollowUpNote(p => ({...p, [planId]: ''})); onRefresh(); }
    catch { toast.error('Error'); }
  };

  const handleClosePlan = async (planId) => {
    try { await API.put(`/action-plans/${planId}`, { status: 'closed', progress: 100 }); toast.success('Plan cerrado'); onRefresh(); }
    catch { toast.error('Error'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold" style={{ fontFamily: 'Outfit' }}>Planes de Accion: {audit.title}</h2>
        {canWrite && (
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button data-testid="add-action-plan-btn" className="text-xs" style={{ backgroundColor: '#0047AB' }}><Plus className="w-3 h-3 mr-1" /> Nuevo Plan</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
              <DialogHeader><DialogTitle style={{ fontFamily: 'Outfit' }}>Nuevo Plan de Accion</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs font-semibold">Hallazgo Relacionado *</Label>
                  <Select value={form.finding_id} onValueChange={v => setForm({...form, finding_id: v})}>
                    <SelectTrigger className="mt-1" data-testid="ap-finding-select"><SelectValue placeholder="Seleccionar hallazgo" /></SelectTrigger>
                    <SelectContent>{findings.map(f => <SelectItem key={f.finding_id} value={f.finding_id}>{f.finding_type === 'no_conformity' ? 'NC' : f.finding_type === 'observation' ? 'OBS' : 'OM'}: {(f.description || f.title || '').substring(0, 60)}...</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-semibold">Tipo de Accion *</Label>
                  <Select value={form.action_type} onValueChange={v => setForm({...form, action_type: v})}>
                    <SelectTrigger className="mt-1" data-testid="ap-type-select"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="corrective">Correctiva</SelectItem>
                      <SelectItem value="preventive">Preventiva</SelectItem>
                      <SelectItem value="improvement">Mejora</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold">Accion *</Label>
                    <Button size="sm" variant="ghost" className="h-6 text-[10px] text-[#8B5CF6]" onClick={() => aiSuggest('action')} disabled={aiLoading.action || !form.finding_id} data-testid="ap-ai-action">
                      <Sparkles className="w-3 h-3 mr-0.5" />{aiLoading.action ? 'Generando...' : (form.action ? 'Mejorar con IA' : 'Sugerir con IA')}
                    </Button>
                  </div>
                  <Textarea data-testid="ap-action-input" value={form.action} onChange={e => setForm({...form, action: e.target.value})} className="mt-1 min-h-[80px] text-xs" placeholder="Describe la accion concreta a ejecutar..." />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs font-semibold">Responsable *</Label><Input value={form.responsible} onChange={e => setForm({...form, responsible: e.target.value})} className="mt-1" data-testid="ap-responsible" placeholder="Nombre y cargo" /></div>
                  <div><Label className="text-xs font-semibold">&nbsp;</Label><div className="h-9" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs font-semibold">Fecha Inicio</Label><Input type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} className="mt-1" data-testid="ap-start-date" /></div>
                  <div><Label className="text-xs font-semibold">Fecha Fin *</Label><Input type="date" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})} className="mt-1" data-testid="ap-due-date" /></div>
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold">Recursos</Label>
                    <Button size="sm" variant="ghost" className="h-6 text-[10px] text-[#8B5CF6]" onClick={() => aiSuggest('resources')} disabled={aiLoading.resources || !form.finding_id} data-testid="ap-ai-resources">
                      <Sparkles className="w-3 h-3 mr-0.5" />{aiLoading.resources ? 'Generando...' : (form.resources ? 'Mejorar con IA' : 'Sugerir con IA')}
                    </Button>
                  </div>
                  <Textarea data-testid="ap-resources-input" value={form.resources} onChange={e => setForm({...form, resources: e.target.value})} className="mt-1 min-h-[60px] text-xs" placeholder="Humanos, tecnicos, economicos, materiales..." />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold">Evidencia</Label>
                    <Button size="sm" variant="ghost" className="h-6 text-[10px] text-[#8B5CF6]" onClick={() => aiSuggest('evidence')} disabled={aiLoading.evidence || !form.finding_id} data-testid="ap-ai-evidence">
                      <Sparkles className="w-3 h-3 mr-0.5" />{aiLoading.evidence ? 'Generando...' : (form.evidence ? 'Mejorar con IA' : 'Sugerir con IA')}
                    </Button>
                  </div>
                  <Textarea data-testid="ap-evidence-input" value={form.evidence} onChange={e => setForm({...form, evidence: e.target.value})} className="mt-1 min-h-[60px] text-xs" placeholder="Registros, certificados, listas de asistencia, fotografias..." />
                </div>
                <Button data-testid="save-action-plan-btn" onClick={handleCreate} className="w-full" style={{ backgroundColor: '#0047AB' }} disabled={!form.finding_id || !form.action.trim() || !form.responsible.trim() || !form.due_date}>Crear Plan</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
      <div className="space-y-2">
        <ActionPlansGantt plans={plans} />
        {plans.map(p => (
          <Card key={p.plan_id} className="border border-[#E2E8F0] bg-white" data-testid={`plan-${p.plan_id}`}>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Badge className="text-[10px]" style={{ backgroundColor: p.action_type === 'corrective' ? '#D90429' : p.action_type === 'preventive' ? '#F97316' : '#2A9D8F', color: '#fff' }}>{p.action_type === 'corrective' ? 'Correctiva' : p.action_type === 'preventive' ? 'Preventiva' : 'Mejora'}</Badge>
                    <Badge variant={p.status === 'closed' ? 'default' : 'secondary'} className="text-[10px]">{p.status}</Badge>
                  </div>
                  <p className="text-xs text-[#0F172A] whitespace-pre-wrap font-medium">{p.action}</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-[10px]">
                    <div><span className="text-[#94A3B8]">Resp:</span> <span className="font-semibold text-[#0F172A]">{p.responsible || 'N/A'}</span></div>
                    <div><span className="text-[#94A3B8]">Inicio:</span> <span className="font-mono text-[#0F172A]">{p.start_date || 'N/A'}</span></div>
                    <div><span className="text-[#94A3B8]">Fin:</span> <span className="font-mono text-[#0F172A]">{p.due_date || 'N/A'}</span></div>
                  </div>
                  {p.resources && (
                    <div className="mt-1.5 p-2 bg-[#F8F9FA] rounded text-[10px]">
                      <span className="text-[#94A3B8] font-semibold">Recursos:</span> <span className="text-[#0F172A] whitespace-pre-wrap">{p.resources}</span>
                    </div>
                  )}
                  {p.evidence && (
                    <div className="mt-1.5 p-2 bg-[#0047AB]/5 rounded text-[10px] border-l-2 border-[#0047AB]">
                      <span className="text-[#0047AB] font-semibold">Evidencia:</span> <span className="text-[#0F172A] whitespace-pre-wrap">{p.evidence}</span>
                    </div>
                  )}
                </div>
                {canWrite && p.status !== 'closed' && <Button size="sm" variant="outline" className="h-7 text-[10px] flex-shrink-0" onClick={() => handleClosePlan(p.plan_id)}><CheckCircle className="w-3 h-3 mr-0.5" /> Cerrar</Button>}
              </div>
              {/* Follow-up notes */}
              {(p.follow_up_notes || []).length > 0 && (
                <div className="border-t border-[#E2E8F0] pt-2 space-y-1">
                  <p className="text-[10px] font-semibold text-[#94A3B8]">Seguimiento:</p>
                  {p.follow_up_notes.map((n, i) => (
                    <div key={i} className="text-[10px] p-1.5 bg-[#F8F9FA] rounded"><span className="font-medium">{n.by}</span> <span className="text-[#94A3B8]">({n.date?.split('T')[0]})</span>: {n.note}</div>
                  ))}
                </div>
              )}
              {canWrite && p.status !== 'closed' && (
                <div className="flex gap-2">
                  <Input value={followUpNote[p.plan_id] || ''} onChange={e => setFollowUpNote(prev => ({...prev, [p.plan_id]: e.target.value}))} placeholder="Nota de seguimiento..." className="h-7 text-xs flex-1" />
                  <Button size="sm" className="h-7 text-[10px]" style={{ backgroundColor: '#0047AB' }} onClick={() => handleAddFollowUp(p.plan_id)}>Agregar</Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// === CONSOLIDATION VIEW (Fase 4+5: AI-enhanced report + closure) ===
function ConsolidationView({ audit, onRefresh, canWrite, canUseAiNarrative }) {
  const { user, canDownloadReports } = useAuth();
  const isAuditClosed = ['closed', 'reviewed'].includes(audit?.status);
  const isPrivRole = ['admin', 'owner', 'auditor'].includes(user?.role);
  const showPdfDownloads = canDownloadReports && (isPrivRole || isAuditClosed);
  const [aiLoading, setAiLoading] = useState({});
  const [sections, setSections] = useState({
    executive_summary: audit?.executive_summary || audit?.ai_redacted_summary || '',
    strengths: audit?.ai_redacted_strengths || '',
    findings_report: audit?.ai_redacted_findings || '',
    recommendations: audit?.ai_redacted_recommendations || '',
    conclusions: audit?.ai_redacted_conclusions || '',
  });
  const [closureForm, setClosureForm] = useState({
    end_date: audit?.end_date || '', end_time: audit?.end_time || '',
  });
  const [reviewForm, setReviewForm] = useState({ conclusions: '', decisions: '', resources_needed: '', next_steps: '' });

  useEffect(() => {
    setSections({
      executive_summary: audit?.executive_summary || audit?.ai_redacted_summary || '',
      strengths: audit?.ai_redacted_strengths || '',
      findings_report: audit?.ai_redacted_findings || '',
      recommendations: audit?.ai_redacted_recommendations || '',
      conclusions: audit?.ai_redacted_conclusions || '',
    });
    setClosureForm({ end_date: audit?.end_date || '', end_time: audit?.end_time || '' });
  }, [audit?.audit_id, audit?.executive_summary, audit?.ai_redacted_summary, audit?.ai_redacted_strengths, audit?.ai_redacted_findings, audit?.ai_redacted_recommendations, audit?.ai_redacted_conclusions, audit?.end_date, audit?.end_time]);

  if (!audit) return null;
  const findings = audit.findings || [];
  const plans = audit.action_plans || [];
  const checklist = audit.checklist || [];
  const score = audit.score_result || null;
  const review = audit.management_review;
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  const buildContext = (type) => {
    const nc = findings.filter(f => f.finding_type === 'no_conformity');
    const obs = findings.filter(f => f.finding_type === 'observation');
    const opp = findings.filter(f => f.finding_type === 'improvement');
    const base = `Empresa: ${audit.company_name || 'N/A'}. Auditoria: ${audit.title}. Tipo: ${audit.audit_type === 'internal' ? 'SG-SST Interna' : audit.audit_type === 'external' ? 'SG-SST Externa' : 'PESV'}. Fecha: ${audit.scheduled_date}. Auditor Lider: ${audit.auditor}. Alcance: ${audit.scope}. Puntaje: ${score?.percentage || 0}% (${score?.classification?.label || 'N/A'}). `;
    const findingsText = findings.map(f => `[${f.finding_type === 'no_conformity' ? 'NC' : f.finding_type === 'observation' ? 'OBS' : 'OM'}] ${f.standard_ref}: ${f.description}`).join('. ');
    const statsText = `Cumple: ${checklist.filter(c => c.result === 'cumple').length}/${checklist.length}. No Conformidades: ${nc.length}. Observaciones: ${obs.length}. Oportunidades de Mejora: ${opp.length}. Planes de accion: ${plans.length} (cerrados: ${plans.filter(p => p.status === 'closed').length}).`;
    const phvaText = score?.by_cycle ? Object.entries(score.by_cycle).map(([k,v]) => `${k}: ${v.pct}%`).join(', ') : '';
    return `${base}${statsText} PHVA: ${phvaText}. Hallazgos: ${findingsText}`;
  };

  const handleAiGenerate = async (type) => {
    setAiLoading(prev => ({...prev, [type]: true}));
    try {
      const res = await API.post('/audits/ai/assist', { type, context: buildContext(type) });
      setSections(prev => ({...prev, [type === 'executive_summary' ? 'executive_summary' : type]: res.data.result}));
      toast.success('Texto generado por IA');
    } catch { toast.error('Error al generar con IA'); }
    finally { setAiLoading(prev => ({...prev, [type]: false})); }
  };

  const handleSaveSection = async (field, value) => {
    const map = { executive_summary: 'executive_summary', strengths: 'ai_redacted_strengths', findings_report: 'ai_redacted_findings', recommendations: 'ai_redacted_recommendations', conclusions: 'ai_redacted_conclusions' };
    try {
      if (field === 'executive_summary') {
        await API.put(`/audits/${audit.audit_id}`, { executive_summary: value });
      } else {
        await API.put(`/audits/${audit.audit_id}/ai-redaction`, { [map[field]]: value });
      }
      toast.success('Seccion guardada');
      onRefresh();
    } catch { toast.error('Error al guardar'); }
  };

  const handleClosure = async () => {
    try {
      await API.post(`/audits/${audit.audit_id}/submit-closure`, closureForm);
      toast.success('Cierre enviado a aprobacion');
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al enviar cierre');
    }
  };

  const handleApproveClosure = async () => {
    try {
      await API.post(`/audits/${audit.audit_id}/approve-closure`, {});
      toast.success('Cierre aprobado y auditoria cerrada');
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al aprobar cierre');
    }
  };

  const handleRejectClosure = async () => {
    const reason = window.prompt('Motivo del rechazo:');
    if (!reason || !reason.trim()) return;
    try {
      await API.post(`/audits/${audit.audit_id}/reject-closure`, { reason });
      toast.success('Cierre rechazado');
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al rechazar');
    }
  };

  const handleSaveReview = async () => {
    try { await API.post(`/audits/${audit.audit_id}/management-review`, reviewForm); toast.success('Revision guardada'); onRefresh(); }
    catch { toast.error('Error'); }
  };

  const handleDownloadReport = () => { window.open(`${BACKEND_URL}/api/audits/${audit.audit_id}/report/pdf`, '_blank'); toast.success('Generando informe PDF...'); };

  const ReportSection = ({ title, field, aiType, placeholder, color = '#0047AB' }) => (
    <Card className="border border-[#E2E8F0] bg-white">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold" style={{ fontFamily: 'Outfit' }}>{title}</CardTitle>
          <div className="flex gap-1">
            {canWrite && <Button size="sm" variant="ghost" className="h-6 text-[10px]" style={{ color }} onClick={() => handleAiGenerate(aiType)} disabled={aiLoading[aiType]} data-testid={`ai-${field}-btn`}>
              <Sparkles className="w-3 h-3 mr-0.5" />{aiLoading[aiType] ? 'Generando...' : 'Mejorar con IA'}
            </Button>}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {canWrite ? (
          <>
            <Textarea data-testid={`${field}-input`} value={sections[field]} onChange={e => setSections(prev => ({...prev, [field]: e.target.value}))} className="text-xs min-h-[100px]" placeholder={placeholder} />
            <Button size="sm" className="text-xs h-7 mt-2" style={{ backgroundColor: color }} onClick={() => handleSaveSection(field, sections[field])}>Guardar</Button>
          </>
        ) : (<p className="text-xs text-[#0F172A] whitespace-pre-wrap">{sections[field] || 'Pendiente'}</p>)}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-bold" style={{ fontFamily: 'Outfit' }}>Informe Consolidado: {audit.title}</h2>
        {audit.report_stale && <Badge className="bg-[#F97316] text-white text-[10px] ml-2" data-testid="report-stale-badge">Ejecucion modificada - Regenerar informe</Badge>}
        <div className="flex gap-2">
          {showPdfDownloads ? (
            <>
              <Button data-testid="download-audit-report" onClick={handleDownloadReport} className="text-xs" style={{ backgroundColor: '#1F3C5E' }}>
                <FileText className="w-3 h-3 mr-1" /> Generar Informe PDF
              </Button>
              <Button data-testid="download-closing-minutes" variant="outline" className="text-xs" onClick={() => { window.open(`${BACKEND_URL}/api/audits/${audit.audit_id}/closing-minutes/pdf`, '_blank'); toast.success('Generando Acta de Cierre...'); }}>
                <FileDown className="w-3 h-3 mr-1" /> Acta de Cierre
              </Button>
            </>
          ) : canDownloadReports ? (
            <Badge variant="outline" className="text-[10px] border-[#F97316] text-[#F97316]" data-testid="pdf-locked-badge">
              <Clock className="w-3 h-3 mr-1" /> Descargas disponibles al cerrar la auditoria
            </Badge>
          ) : null}
        </div>
      </div>

      {/* Score + Stats */}
      {score && (
        <Card className="border-2" style={{ borderColor: score.classification?.color || '#E2E8F0' }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-[10px] font-semibold text-[#94A3B8] uppercase">{audit.audit_type === 'pesv' ? 'Resultado PESV Res. 40595/2022' : 'Resultado Res. 0312/2019'}</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-bold font-mono" style={{ color: score.classification?.color }}>{score.percentage}%</span>
                  <span className="text-xs font-mono text-[#94A3B8]">{score.total_obtained}/{score.total_possible} pts</span>
                </div>
              </div>
              <Badge className="text-xs px-3 py-1" style={{ backgroundColor: score.classification?.color, color: '#fff' }}>{score.classification?.label}</Badge>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {(audit.audit_type === 'pesv' ? ['PLANIFICACION', 'IMPLEMENTACION', 'SEGUIMIENTO', 'MEJORA'] : ['PLANEAR', 'HACER', 'VERIFICAR', 'ACTUAR']).map(cycle => {
                const c = (audit.audit_type === 'pesv' ? score.by_fase : score.by_cycle)?.[cycle] || {};
                return (<div key={cycle} className="text-center p-2 rounded bg-[#F8F9FA]"><p className="text-[9px] font-bold text-[#94A3B8]">{cycle}</p><p className="text-sm font-bold font-mono" style={{ color: (c.pct||0) >= 85 ? '#2A9D8F' : (c.pct||0) >= 60 ? '#FFC300' : '#D90429' }}>{c.pct||0}%</p></div>);
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card className="border border-[#E2E8F0]"><CardContent className="p-3 text-center"><p className="text-[10px] text-[#94A3B8] uppercase">Hallazgos</p><p className="text-xl font-bold font-mono text-[#D90429]">{findings.length}</p></CardContent></Card>
        <Card className="border border-[#E2E8F0]"><CardContent className="p-3 text-center"><p className="text-[10px] text-[#94A3B8] uppercase">No Conf.</p><p className="text-xl font-bold font-mono text-[#D90429]">{findings.filter(f=>f.finding_type==='no_conformity').length}</p></CardContent></Card>
        <Card className="border border-[#E2E8F0]"><CardContent className="p-3 text-center"><p className="text-[10px] text-[#94A3B8] uppercase">Observaciones</p><p className="text-xl font-bold font-mono text-[#FFC300]">{findings.filter(f=>f.finding_type==='observation').length}</p></CardContent></Card>
        <Card className="border border-[#E2E8F0]"><CardContent className="p-3 text-center"><p className="text-[10px] text-[#94A3B8] uppercase">Planes</p><p className="text-xl font-bold font-mono text-[#F97316]">{plans.length}</p></CardContent></Card>
        <Card className="border border-[#E2E8F0]"><CardContent className="p-3 text-center"><p className="text-[10px] text-[#94A3B8] uppercase">Cerrados</p><p className="text-xl font-bold font-mono text-[#2A9D8F]">{plans.filter(p=>p.status==='closed').length}/{plans.length}</p></CardContent></Card>
      </div>

      {/* Audit Info */}
      <Card className="border border-[#E2E8F0] bg-white">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold" style={{ fontFamily: 'Outfit' }}>Datos de la Auditoria</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
            <div><span className="font-semibold text-[#94A3B8]">Tipo:</span> {audit.audit_type === 'internal' ? 'SG-SST Interna' : audit.audit_type === 'external' ? 'SG-SST Externa' : 'PESV'}</div>
            <div><span className="font-semibold text-[#94A3B8]">Auditor Lider:</span> {audit.auditor || 'N/A'}</div>
            <div><span className="font-semibold text-[#94A3B8]">Fecha Inicio:</span> {audit.scheduled_date} {audit.start_time || ''}</div>
            <div><span className="font-semibold text-[#94A3B8]">Fecha Cierre:</span> {audit.end_date || 'Pendiente'} {audit.end_time || ''}</div>
            <div><span className="font-semibold text-[#94A3B8]">Alcance:</span> {audit.scope || 'N/A'}</div>
            <div><span className="font-semibold text-[#94A3B8]">Criterios:</span> {audit.criteria || 'N/A'}</div>
            {(audit.additional_auditors || []).length > 0 && <div className="col-span-2"><span className="font-semibold text-[#94A3B8]">Auditores Adicionales:</span> {audit.additional_auditors.join(', ')}</div>}
            {(audit.process_responsibles || []).length > 0 && <div className="col-span-2"><span className="font-semibold text-[#94A3B8]">Responsables del Proceso:</span> {audit.process_responsibles.join(', ')}</div>}
            {audit.copasst_member?.name && <div className="col-span-2"><span className="font-semibold text-[#D90429]">Miembro COPASST:</span> {audit.copasst_member.name} ({audit.copasst_member.role || 'N/A'}) - {audit.copasst_member.participation || 'Participante'}</div>}
          </div>
        </CardContent>
      </Card>

      {/* AI-assisted report sections */}
      <ReportSection title="Resumen Ejecutivo" field="executive_summary" aiType="executive_summary" placeholder="Resumen ejecutivo de la auditoria..." />
      <ReportSection title="Fortalezas Identificadas" field="strengths" aiType="strengths" placeholder="Fortalezas del SG-SST..." color="#2A9D8F" />
      <ReportSection title="Hallazgos (Redaccion Mejorada)" field="findings_report" aiType="findings_report" placeholder="Detalle de hallazgos..." color="#D90429" />
      <ReportSection title="Recomendaciones" field="recommendations" aiType="recommendations" placeholder="Recomendaciones para la mejora..." color="#F97316" />
      <ReportSection title="Conclusiones" field="conclusions" aiType="conclusions" placeholder="Conclusiones de la auditoria..." color="#1F3C5E" />

      {/* Management Review */}
      <Card className="border border-[#E2E8F0] bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold" style={{ fontFamily: 'Outfit' }}>Revision por la Alta Direccion</CardTitle>
        </CardHeader>
        <CardContent>
          {review ? (
            <div className="space-y-2 text-xs">
              <div><span className="font-semibold text-[#94A3B8]">Revisor:</span> {review.reviewer} ({review.date?.split('T')[0]})</div>
              <div><span className="font-semibold">Conclusiones:</span><p className="text-[#0F172A] whitespace-pre-wrap mt-0.5">{review.conclusions}</p></div>
              {review.decisions && <div><span className="font-semibold">Decisiones:</span><p className="text-[#0F172A] mt-0.5">{review.decisions}</p></div>}
              {review.next_steps && <div><span className="font-semibold">Proximos pasos:</span><p className="text-[#0F172A] mt-0.5">{review.next_steps}</p></div>}
              <Badge className="bg-[#2A9D8F] text-white text-[10px]">Revisada por Alta Direccion</Badge>
            </div>
          ) : canWrite ? (
            <div className="space-y-3">
              <div><Label className="text-xs font-semibold">Conclusiones</Label><Textarea value={reviewForm.conclusions} onChange={e => setReviewForm({...reviewForm, conclusions: e.target.value})} className="mt-1 min-h-[80px] text-xs" /></div>
              <div><Label className="text-xs font-semibold">Decisiones</Label><Textarea value={reviewForm.decisions} onChange={e => setReviewForm({...reviewForm, decisions: e.target.value})} className="mt-1 text-xs" /></div>
              <div><Label className="text-xs font-semibold">Proximos Pasos</Label><Textarea value={reviewForm.next_steps} onChange={e => setReviewForm({...reviewForm, next_steps: e.target.value})} className="mt-1 text-xs" /></div>
              <Button data-testid="save-review-btn" onClick={handleSaveReview} className="w-full" style={{ backgroundColor: '#0047AB' }}>Guardar Revision</Button>
            </div>
          ) : <p className="text-xs text-[#94A3B8]">Pendiente de revision</p>}
        </CardContent>
      </Card>

      {/* AI Narrative Editor (auditor/admin only, shown when audit still editable) */}
      {canUseAiNarrative && !isAuditClosed && audit.closure_approval_status !== 'pending' && (
        <AINarrativeEditor audit={audit} onRefresh={onRefresh} />
      )}

      {/* Closure Panel - Fase 5 with Approval Workflow */}
      {canWrite && audit.status !== 'closed' && audit.status !== 'reviewed' && audit.closure_approval_status !== 'pending' && (
        <Card className="border-2 border-[#2A9D8F] bg-[#2A9D8F]/5">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-[#2A9D8F]" style={{ fontFamily: 'Outfit' }}>Cierre de Auditoria</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-[#475569]">Complete los datos de cierre y enviar a aprobacion. Se validara: auditor lider, fecha/hora de cierre y miembro COPASST.</p>
            {audit.closure_approval_status === 'rejected' && (
              <div className="p-2 rounded bg-[#D90429]/10 border border-[#D90429]/30">
                <p className="text-xs font-semibold text-[#D90429]">Cierre rechazado previamente</p>
                <p className="text-[10px] text-[#475569] mt-0.5">Motivo: {audit.closure_rejection_reason || 'Sin motivo registrado'}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs font-semibold">Fecha de Cierre *</Label><Input type="date" value={closureForm.end_date} onChange={e => setClosureForm({...closureForm, end_date: e.target.value})} className="mt-1" data-testid="closure-end-date" /></div>
              <div><Label className="text-xs font-semibold">Hora de Cierre *</Label><Input type="time" value={closureForm.end_time} onChange={e => setClosureForm({...closureForm, end_time: e.target.value})} className="mt-1" data-testid="closure-end-time" /></div>
            </div>
            <Button data-testid="close-audit-btn" onClick={handleClosure} className="w-full" style={{ backgroundColor: '#2A9D8F' }} disabled={!closureForm.end_date || !closureForm.end_time}>
              <Send className="w-4 h-4 mr-2" /> Enviar Cierre a Aprobacion
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Pending approval banner */}
      {audit.closure_approval_status === 'pending' && audit.status !== 'closed' && (
        <Card className="border-2 border-[#F97316] bg-[#F97316]/5">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-[#F97316] flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-[#F97316]" style={{ fontFamily: 'Outfit' }}>Cierre pendiente de aprobacion</p>
                <p className="text-xs text-[#475569] mt-0.5">
                  Enviado por {audit.closure_submitted_by || 'N/A'} el {audit.closure_submitted_at?.split('T')[0] || 'N/A'}
                </p>
                <p className="text-xs text-[#475569] mt-1">
                  Fecha/Hora propuesta: <span className="font-semibold">{audit.pending_closure_data?.end_date || audit.end_date} {audit.pending_closure_data?.end_time || audit.end_time}</span>
                </p>
              </div>
            </div>
            {['admin', 'owner', 'sgsst_manager'].includes(user?.role) && (
              <div className="flex gap-2 pt-2 border-t border-[#F97316]/30">
                <Button data-testid="approve-closure-btn" onClick={handleApproveClosure} className="flex-1 bg-[#2A9D8F] hover:bg-[#238276] text-xs">
                  <CheckCircle className="w-4 h-4 mr-2" /> Aprobar Cierre
                </Button>
                <Button data-testid="reject-closure-btn" onClick={handleRejectClosure} variant="outline" className="flex-1 border-[#D90429] text-[#D90429] text-xs">
                  <X className="w-4 h-4 mr-2" /> Rechazar
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {audit.status === 'closed' && (
        <div className="space-y-2">
          <Badge className="bg-[#2A9D8F] text-white text-sm px-4 py-2">Auditoria Cerrada - {audit.end_date} {audit.end_time}</Badge>
          {audit.closure_approved_by && (
            <p className="text-[10px] text-[#475569]">Aprobado por: {audit.closure_approved_by} ({audit.closure_approved_at?.split('T')[0]})</p>
          )}
        </div>
      )}
    </div>
  );
}

// === HISTORY VIEW ===
function HistoryView({ history }) {
  const chartData = history.map(h => ({ name: h.date || h.title?.substring(0, 10), NC: h.no_conformities, OBS: h.observations, cumplimiento: h.compliance_rate, cierre: h.closure_rate })).reverse();

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold" style={{ fontFamily: 'Outfit' }}>Auditoria Historica y Comparativa</h2>
      {history.length === 0 ? <EmptyState msg="Sin auditorias cerradas para comparar" /> : (
        <>
          {chartData.length > 1 && (
            <Card className="border border-[#E2E8F0] bg-white">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold" style={{ fontFamily: 'Outfit' }}>Tendencia de Hallazgos</CardTitle></CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="NC" fill="#D90429" name="No Conformidades" radius={[4,4,0,0]} />
                      <Bar dataKey="OBS" fill="#FFC300" name="Observaciones" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
          <Card className="border border-[#E2E8F0] bg-white">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-semibold">Auditoria</TableHead>
                    <TableHead className="text-xs font-semibold">Fecha</TableHead>
                    <TableHead className="text-xs font-semibold text-center">NC</TableHead>
                    <TableHead className="text-xs font-semibold text-center">OBS</TableHead>
                    <TableHead className="text-xs font-semibold text-center">Cumplimiento</TableHead>
                    <TableHead className="text-xs font-semibold text-center">Cierre</TableHead>
                    <TableHead className="text-xs font-semibold">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map(h => (
                    <TableRow key={h.audit_id}>
                      <TableCell className="text-xs font-medium">{h.title}</TableCell>
                      <TableCell className="text-xs font-mono">{h.date}</TableCell>
                      <TableCell className="text-center font-mono text-xs text-[#D90429] font-bold">{h.no_conformities}</TableCell>
                      <TableCell className="text-center font-mono text-xs text-[#FFC300] font-bold">{h.observations}</TableCell>
                      <TableCell className="text-center font-mono text-xs">{h.compliance_rate}%</TableCell>
                      <TableCell className="text-center font-mono text-xs">{h.closure_rate}%</TableCell>
                      <TableCell><Badge style={{ backgroundColor: STATUS_COLORS[h.status], color: '#fff' }} className="text-[10px]">{STATUS_LABELS[h.status]}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
