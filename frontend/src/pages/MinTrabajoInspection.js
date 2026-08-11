import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import API from '@/lib/api';
import { Landmark, Plus, Trash2, FileDown, Sparkles, CheckCircle2, XCircle, Minus, Loader2, ScrollText, ChevronRight, Search } from 'lucide-react';

const TIER_COLORS = { micro: '#2A9D8F', medium: '#0047AB', large: '#7C3AED' };
const COMPLIANCE_COLORS = { cumple: '#2A9D8F', no_cumple: '#D90429', na: '#94A3B8' };

export default function MinTrabajoInspection() {
  const { user } = useAuth();
  const canWrite = ['admin', 'owner', 'auditor', 'sgsst_manager'].includes(user?.role);
  const [tiers, setTiers] = useState({});
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ title: '', inspector_name: '', inspection_date: new Date().toISOString().slice(0, 10) });
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [aiLoadingAll, setAiLoadingAll] = useState(false);
  const [refining, setRefining] = useState(null);
  const [savingItem, setSavingItem] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [t, list] = await Promise.all([API.get('/mintrabajo/tiers'), API.get('/mintrabajo/inspections')]);
      setTiers(t.data);
      setInspections(list.data);
    } catch (e) { toast.error('Error cargando inspecciones'); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openDetail = async (id) => {
    setSelected(id);
    try {
      const res = await API.get(`/mintrabajo/inspections/${id}`);
      setDetail(res.data);
    } catch (e) { toast.error('Error cargando detalle'); }
  };

  const closeDetail = () => { setSelected(null); setDetail(null); };

  const handleCreate = async () => {
    try {
      const res = await API.post('/mintrabajo/inspections', createForm);
      toast.success(`Inspeccion creada (${res.data.tier_label})`);
      setShowCreate(false);
      setCreateForm({ title: '', inspector_name: '', inspection_date: new Date().toISOString().slice(0, 10) });
      await fetchAll();
      openDetail(res.data.inspection_id);
      // Auto-load AI suggestions on creation as per user choice 2b
      setTimeout(() => triggerAiSuggest(res.data.inspection_id, true), 500);
    } catch (err) { toast.error(err.response?.data?.detail || 'Error al crear'); }
  };

  const triggerAiSuggest = async (id, silent = false) => {
    setAiLoadingAll(true);
    if (!silent) toast.info('Generando sugerencias con IA...');
    try {
      const res = await API.post(`/mintrabajo/inspections/${id}/ai/suggest-all`);
      toast.success(`${res.data.generated} sugerencias IA generadas`);
      const d = await API.get(`/mintrabajo/inspections/${id}`);
      setDetail(d.data);
    } catch (e) { toast.error(e.response?.data?.detail || 'Error IA'); }
    setAiLoadingAll(false);
  };

  const updateItem = async (itemId, patch) => {
    if (!detail) return;
    setSavingItem(itemId);
    try {
      await API.put(`/mintrabajo/inspections/${detail.inspection_id}/items/${itemId}`, patch);
      setDetail(prev => ({
        ...prev,
        categories: prev.categories.map(c => ({
          ...c,
          items: c.items.map(it => it.item_id === itemId ? { ...it, ...patch } : it)
        }))
      }));
    } catch (e) { toast.error('Error guardando'); }
    setSavingItem(null);
  };

  const refineText = async (itemId, currentText) => {
    if (!currentText?.trim()) { toast.warning('Escribe una nota primero'); return; }
    setRefining(itemId);
    try {
      const res = await API.post(`/mintrabajo/inspections/${detail.inspection_id}/items/${itemId}/ai/refine`, { text: currentText });
      await updateItem(itemId, { observation: res.data.refined });
      toast.success('Redaccion mejorada');
    } catch (e) { toast.error('Error IA'); }
    setRefining(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Eliminar esta inspeccion?')) return;
    try {
      await API.delete(`/mintrabajo/inspections/${id}`);
      toast.success('Inspeccion eliminada');
      fetchAll();
    } catch (e) { toast.error('Error'); }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6" data-testid="mintrabajo-page">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <Landmark className="w-6 h-6 text-[#0047AB]" />
            <h1 className="text-2xl font-bold text-[#1F3C5E]" style={{ fontFamily: 'Outfit' }}>Inspeccion General MinTrabajo</h1>
          </div>
          <p className="text-sm text-[#64748B] mt-1">Anexo Tecnico oficial - Resolucion 0312/2019, Decreto 1072/2015 - con verificacion asistida por IA</p>
        </div>
        {canWrite && (
          <Button onClick={() => setShowCreate(true)} className="bg-[#0047AB] hover:bg-[#003585]" data-testid="new-inspection-btn">
            <Plus className="w-4 h-4 mr-1" /> Nueva Inspeccion
          </Button>
        )}
      </div>

      {/* Tier info cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {Object.entries(tiers).map(([key, t]) => (
          <Card key={key} className="border" style={{ borderColor: `${TIER_COLORS[key]}40` }}>
            <CardContent className="p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${TIER_COLORS[key]}20` }}>
                <ScrollText className="w-5 h-5" style={{ color: TIER_COLORS[key] }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-[#94A3B8] uppercase tracking-wide font-semibold">{key}</p>
                <p className="text-xs font-semibold text-[#0F172A] leading-tight">{t.label}</p>
                <p className="text-[10px] text-[#64748B] mt-0.5">{t.categories_count} categorias - {t.items_count} items</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Inspections list */}
      <Card className="border border-[#E2E8F0]">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Search className="w-4 h-4" /> Mis Inspecciones</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-sm text-[#94A3B8]">Cargando...</div>
          ) : inspections.length === 0 ? (
            <div className="text-center py-8 text-sm text-[#94A3B8]">Aun no hay inspecciones. Crea la primera.</div>
          ) : (
            <div className="space-y-2">
              {inspections.map(i => (
                <div key={i.inspection_id} className="border border-[#E2E8F0] rounded-lg p-3 hover:border-[#0047AB]/40 cursor-pointer bg-white" onClick={() => openDetail(i.inspection_id)} data-testid={`inspection-row-${i.inspection_id}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold text-[#0F172A]">{i.title}</h3>
                        <Badge className="text-[10px]" style={{ backgroundColor: TIER_COLORS[i.tier], color: '#fff' }}>{i.tier_label}</Badge>
                        <Badge variant="outline" className="text-[10px]">{i.status === 'in_progress' ? 'En progreso' : 'Completada'}</Badge>
                      </div>
                      <div className="mt-1.5 flex items-center gap-4 text-[10px] text-[#64748B]">
                        <span>Inspector: {i.inspector_name}</span>
                        <span>Fecha: {i.inspection_date}</span>
                      </div>
                      <div className="mt-2 flex items-center gap-3">
                        <div className="flex-1 max-w-[240px]">
                          <Progress value={i.compliance_pct} className="h-1.5" />
                        </div>
                        <span className="text-[11px] font-bold" style={{ color: i.compliance_pct >= 80 ? '#2A9D8F' : i.compliance_pct >= 50 ? '#F97316' : '#D90429' }}>{i.compliance_pct}% cumple</span>
                        <span className="text-[10px] text-[#94A3B8]">{i.items_cumple}/{i.items_total} - No: {i.items_no_cumple} - Pend: {i.items_pending}</span>
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={e => { e.stopPropagation(); window.open(`${process.env.REACT_APP_BACKEND_URL}/api/mintrabajo/inspections/${i.inspection_id}/pdf`, '_blank'); }} data-testid={`inspection-pdf-${i.inspection_id}`}>
                        <FileDown className="w-3 h-3 mr-0.5" /> PDF
                      </Button>
                      {canWrite && (
                        <Button size="sm" variant="ghost" className="h-7 text-red-500" onClick={e => { e.stopPropagation(); handleDelete(i.inspection_id); }}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                      <ChevronRight className="w-4 h-4 text-[#94A3B8] mt-1" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md" data-testid="create-inspection-dialog">
          <DialogHeader><DialogTitle className="text-[#1F3C5E]">Nueva Inspeccion MinTrabajo</DialogTitle></DialogHeader>
          <div className="space-y-3 text-sm">
            <div className="bg-[#F1F5F9] p-3 rounded border border-[#E2E8F0] text-[11px] text-[#475569] leading-relaxed">
              El sistema seleccionara automaticamente el checklist correcto segun el tamano y nivel de riesgo de tu empresa activa. Las sugerencias de IA se pre-cargaran al crear la inspeccion.
            </div>
            <div>
              <Label className="text-xs">Titulo</Label>
              <Input value={createForm.title} onChange={e => setCreateForm({ ...createForm, title: e.target.value })} placeholder="Ej: Inspeccion General SG-SST Q2 2026" className="text-xs mt-1" data-testid="create-title-input" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Inspector</Label>
                <Input value={createForm.inspector_name} onChange={e => setCreateForm({ ...createForm, inspector_name: e.target.value })} placeholder="Nombre" className="text-xs mt-1" data-testid="create-inspector-input" />
              </div>
              <div>
                <Label className="text-xs">Fecha</Label>
                <Input type="date" value={createForm.inspection_date} onChange={e => setCreateForm({ ...createForm, inspection_date: e.target.value })} className="text-xs mt-1" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button size="sm" variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
              <Button size="sm" className="bg-[#0047AB] hover:bg-[#003585]" onClick={handleCreate} data-testid="create-submit-btn">Crear y ejecutar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Execution dialog */}
      <Dialog open={!!selected} onOpenChange={v => !v && closeDetail()}>
        <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto" data-testid="detail-dialog">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle className="text-[#1F3C5E] flex items-center gap-2">
                  <Landmark className="w-5 h-5" /> {detail.title}
                </DialogTitle>
                <div className="flex items-center gap-2 flex-wrap mt-1">
                  <Badge style={{ backgroundColor: TIER_COLORS[detail.tier], color: '#fff' }} className="text-[10px]">{detail.tier_label}</Badge>
                  <span className="text-[11px] text-[#64748B]">Inspector: {detail.inspector_name}</span>
                  <span className="text-[11px] text-[#64748B]">Fecha: {detail.inspection_date}</span>
                </div>
              </DialogHeader>
              <div className="flex justify-between items-center gap-2 border-b pb-2 mb-2">
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => triggerAiSuggest(detail.inspection_id)} disabled={aiLoadingAll} data-testid="ai-suggest-all-btn">
                    {aiLoadingAll ? <Loader2 className="w-3 h-3 mr-0.5 animate-spin" /> : <Sparkles className="w-3 h-3 mr-0.5" />}
                    {aiLoadingAll ? 'Generando...' : 'Regenerar sugerencias IA'}
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => window.open(`${process.env.REACT_APP_BACKEND_URL}/api/mintrabajo/inspections/${detail.inspection_id}/pdf`, '_blank')}>
                    <FileDown className="w-3 h-3 mr-0.5" /> Descargar PDF
                  </Button>
                </div>
                <Button size="sm" variant="ghost" onClick={closeDetail}>Cerrar</Button>
              </div>

              <Accordion type="multiple" defaultValue={detail.categories.map((_, i) => `cat-${i}`)}>
                {detail.categories.map((cat, cIdx) => {
                  const done = cat.items.filter(it => it.compliance).length;
                  return (
                    <AccordionItem key={cIdx} value={`cat-${cIdx}`} className="border-b border-[#E2E8F0]">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-sm font-semibold text-[#1F3C5E]">{cat.name}</span>
                          <Badge variant="outline" className="text-[10px]">{done}/{cat.items.length}</Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-3">
                        {cat.items.map(it => (
                          <div key={it.item_id} className="border border-[#E2E8F0] rounded-lg p-3 bg-white space-y-2" data-testid={`item-${it.code}`}>
                            <div className="flex items-start justify-between gap-2 flex-wrap">
                              <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-bold text-[#0047AB]">{it.code}</p>
                                <h4 className="text-sm font-semibold text-[#0F172A]">{it.name}</h4>
                                {it.legal && <p className="text-[10px] text-[#94A3B8] mt-0.5"><b>Legal:</b> {it.legal}</p>}
                              </div>
                              <div className="flex gap-1 flex-shrink-0">
                                <Button size="sm" variant={it.compliance === 'cumple' ? 'default' : 'outline'} className={`h-6 text-[10px] ${it.compliance === 'cumple' ? 'bg-[#2A9D8F] hover:bg-[#238577]' : ''}`} onClick={() => updateItem(it.item_id, { compliance: 'cumple' })} disabled={!canWrite} data-testid={`cumple-${it.code}`}>
                                  <CheckCircle2 className="w-3 h-3 mr-0.5" /> Cumple
                                </Button>
                                <Button size="sm" variant={it.compliance === 'no_cumple' ? 'default' : 'outline'} className={`h-6 text-[10px] ${it.compliance === 'no_cumple' ? 'bg-[#D90429] hover:bg-[#9c0320]' : ''}`} onClick={() => updateItem(it.item_id, { compliance: 'no_cumple' })} disabled={!canWrite} data-testid={`nocumple-${it.code}`}>
                                  <XCircle className="w-3 h-3 mr-0.5" /> No Cumple
                                </Button>
                                <Button size="sm" variant={it.compliance === 'na' ? 'default' : 'outline'} className={`h-6 text-[10px] ${it.compliance === 'na' ? 'bg-[#94A3B8] hover:bg-[#64748B]' : ''}`} onClick={() => updateItem(it.item_id, { compliance: 'na' })} disabled={!canWrite} data-testid={`na-${it.code}`}>
                                  <Minus className="w-3 h-3 mr-0.5" /> N/A
                                </Button>
                              </div>
                            </div>
                            {it.description && <p className="text-[11px] text-[#475569] italic">{it.description}</p>}

                            {/* AI Suggestion pre-loaded */}
                            {it.ai_suggestion && (
                              <div className="bg-gradient-to-r from-[#F5F3FF] to-[#EFF6FF] border-l-2 border-[#7C3AED] p-2 rounded text-[11px]">
                                <p className="font-semibold text-[#7C3AED] flex items-center gap-1 mb-1"><Sparkles className="w-3 h-3" /> Sugerencia IA de verificacion</p>
                                <div className="text-[#334155] whitespace-pre-wrap leading-relaxed">{it.ai_suggestion}</div>
                              </div>
                            )}

                            {it.evidences?.length > 0 && (
                              <div className="text-[10px] text-[#64748B]">
                                <b>Evidencias sugeridas:</b> {it.evidences.join(' - ')}
                              </div>
                            )}

                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <Label className="text-[10px] font-semibold">Observacion del inspector</Label>
                                {canWrite && (
                                  <Button size="sm" variant="ghost" className="h-5 text-[9px] text-[#7C3AED]" onClick={() => refineText(it.item_id, it.observation)} disabled={refining === it.item_id}>
                                    {refining === it.item_id ? <Loader2 className="w-2.5 h-2.5 mr-0.5 animate-spin" /> : <Sparkles className="w-2.5 h-2.5 mr-0.5" />} Ajustar con IA
                                  </Button>
                                )}
                              </div>
                              <Textarea
                                value={it.observation || ''}
                                onChange={e => setDetail(prev => ({ ...prev, categories: prev.categories.map((c, ci) => ci === cIdx ? { ...c, items: c.items.map(i2 => i2.item_id === it.item_id ? { ...i2, observation: e.target.value } : i2) } : c) }))}
                                onBlur={e => updateItem(it.item_id, { observation: e.target.value })}
                                className="text-[11px] min-h-[50px]"
                                placeholder="Describe hallazgos, evidencia entregada, cumplimiento parcial..."
                                data-testid={`obs-${it.code}`}
                                disabled={!canWrite}
                              />
                            </div>
                            <div>
                              <Label className="text-[10px] font-semibold">Notas de evidencia</Label>
                              <Input
                                value={it.evidence_notes || ''}
                                onChange={e => setDetail(prev => ({ ...prev, categories: prev.categories.map((c, ci) => ci === cIdx ? { ...c, items: c.items.map(i2 => i2.item_id === it.item_id ? { ...i2, evidence_notes: e.target.value } : i2) } : c) }))}
                                onBlur={e => updateItem(it.item_id, { evidence_notes: e.target.value })}
                                className="text-[11px] mt-1"
                                placeholder="Documento aportado, referencia archivo..."
                                data-testid={`ev-${it.code}`}
                                disabled={!canWrite}
                              />
                            </div>
                          </div>
                        ))}
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
