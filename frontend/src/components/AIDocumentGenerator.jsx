import React, { useState, useEffect, useCallback } from 'react';
import API from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, Wand2, FileText, Loader2, Save, X, Search } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORY_COLORS = {
  Politica: '#0047AB',
  Manual: '#2A9D8F',
  Procedimiento: '#F97316',
  Plan: '#8B5CF6',
  Reglamento: '#1F3C5E',
  Formato: '#D90429',
};

export default function AIDocumentGenerator({ open, onClose, onCreated }) {
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filter, setFilter] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [selected, setSelected] = useState(null);
  const [customizations, setCustomizations] = useState('');
  const [generating, setGenerating] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [createdDoc, setCreatedDoc] = useState(null);
  const [editing, setEditing] = useState(false);

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await API.get('/documents/templates');
      setTemplates(res.data.items || []);
      setCategories(res.data.categories || []);
    } catch { toast.error('Error al cargar plantillas'); }
  }, []);

  useEffect(() => { if (open) fetchTemplates(); }, [open, fetchTemplates]);

  const close = () => {
    setSelected(null); setCustomizations(''); setPreviewContent(''); setCreatedDoc(null); setEditing(false);
    onClose?.();
  };

  const generate = async () => {
    if (!selected) return;
    setGenerating(true);
    try {
      const res = await API.post('/documents/generate-ai', {
        template_id: selected.template_id,
        customizations,
        save: true,
        company_id: activeCompany?.company_id || undefined,
      });
      setPreviewContent(res.data.content);
      setCreatedDoc(res.data.document);
      toast.success('Documento generado y guardado como borrador');
      onCreated?.();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al generar el documento');
    } finally { setGenerating(false); }
  };

  const saveEdit = async () => {
    if (!createdDoc) return;
    try {
      await API.put(`/documents/${createdDoc.doc_id}/ai-content`, { content: previewContent });
      toast.success('Cambios guardados');
      setEditing(false);
    } catch { toast.error('Error al guardar'); }
  };

  const filtered = templates.filter(t => {
    if (activeCategory !== 'all' && t.category !== activeCategory) return false;
    if (filter && !t.title.toLowerCase().includes(filter.toLowerCase()) && !t.description.toLowerCase().includes(filter.toLowerCase())) return false;
    return true;
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-hidden flex flex-col" data-testid="ai-doc-generator">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" style={{ fontFamily: 'Outfit' }}>
            <Wand2 className="w-5 h-5 text-[#8B5CF6]" />
            Generador de Documentos con IA
            <Badge className="bg-[#8B5CF6] text-white text-[10px]">{templates.length} plantillas MinTrabajo</Badge>
          </DialogTitle>
        </DialogHeader>

        {!previewContent ? (
          <div className="flex-1 overflow-hidden flex flex-col">
            {!selected ? (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                    <Input data-testid="ai-doc-search" value={filter} onChange={e => setFilter(e.target.value)} placeholder="Buscar plantilla..." className="pl-8 h-9 text-xs" />
                  </div>
                </div>
                <Tabs value={activeCategory} onValueChange={setActiveCategory} className="flex-1 overflow-hidden flex flex-col">
                  <TabsList className="flex-wrap h-auto" data-testid="ai-doc-categories">
                    <TabsTrigger value="all" className="text-xs">Todas ({templates.length})</TabsTrigger>
                    {categories.map(c => (
                      <TabsTrigger key={c} value={c} className="text-xs">{c} ({templates.filter(t => t.category === c).length})</TabsTrigger>
                    ))}
                  </TabsList>
                  <TabsContent value={activeCategory} className="flex-1 overflow-y-auto mt-3 pr-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {filtered.map(t => (
                        <Card
                          key={t.template_id}
                          className="border border-[#E2E8F0] hover:border-[#8B5CF6] cursor-pointer transition-all hover:-translate-y-0.5"
                          onClick={() => setSelected(t)}
                          data-testid={`ai-doc-template-${t.template_id}`}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h3 className="text-xs font-bold text-[#0F172A] flex-1">{t.title}</h3>
                              <Badge style={{ backgroundColor: CATEGORY_COLORS[t.category] || '#0047AB', color: '#fff' }} className="text-[9px]">{t.category}</Badge>
                            </div>
                            <p className="text-[10px] text-[#475569] leading-relaxed line-clamp-2">{t.description}</p>
                          </CardContent>
                        </Card>
                      ))}
                      {filtered.length === 0 && (
                        <div className="col-span-2 text-center py-8 text-xs text-[#94A3B8]">Sin resultados</div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Badge style={{ backgroundColor: CATEGORY_COLORS[selected.category], color: '#fff' }} className="text-[10px] mb-1">{selected.category}</Badge>
                    <h3 className="text-base font-bold text-[#0F172A]" style={{ fontFamily: 'Outfit' }}>{selected.title}</h3>
                    <p className="text-xs text-[#475569] mt-1">{selected.description}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelected(null)}><X className="w-4 h-4" /></Button>
                </div>

                <Card className="border border-[#E2E8F0] bg-[#0047AB]/5">
                  <CardContent className="p-3 text-xs text-[#475569]">
                    <p className="font-semibold text-[#0047AB] mb-1.5">Empresa que se usará: <span className="text-[#0F172A]">{activeCompany?.name || 'Sin empresa activa'}</span></p>
                    <p>Datos auto-inyectados: razón social, NIT, ciudad, actividad económica, # trabajadores, nivel de riesgo, sedes y procesos.</p>
                    <p className="text-[10px] text-[#94A3B8] mt-1.5">Si necesitas otra empresa, cambia la empresa activa desde el selector superior antes de generar.</p>
                  </CardContent>
                </Card>

                <div>
                  <label className="text-xs font-semibold text-[#0F172A] mb-1 block">Personalizaciones adicionales (opcional)</label>
                  <Textarea
                    data-testid="ai-doc-customizations"
                    value={customizations}
                    onChange={e => setCustomizations(e.target.value)}
                    placeholder="Ejemplo: Incluir referencia a la sede de Bogotá. Agregar política específica para contratistas. Mencionar la jornada nocturna del proceso de producción..."
                    rows={5}
                    className="text-xs resize-y"
                  />
                </div>

                <Button
                  data-testid="ai-doc-generate-btn"
                  onClick={generate}
                  disabled={generating}
                  className="w-full bg-gradient-to-r from-[#8B5CF6] to-[#0047AB] hover:opacity-90"
                >
                  {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                  {generating ? 'Generando con IA (puede tardar 20-40s)...' : 'Generar Documento con IA'}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div>
                <Badge className="bg-[#2A9D8F] text-white text-[10px] mb-1">Generado y guardado</Badge>
                <h3 className="text-base font-bold text-[#0F172A]" style={{ fontFamily: 'Outfit' }}>{createdDoc?.title}</h3>
              </div>
              <div className="flex gap-2">
                {editing ? (
                  <Button size="sm" className="bg-[#2A9D8F] hover:bg-[#238276]" onClick={saveEdit} data-testid="ai-doc-save-edit">
                    <Save className="w-3 h-3 mr-1" /> Guardar cambios
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => setEditing(true)} data-testid="ai-doc-edit-btn">
                    <FileText className="w-3 h-3 mr-1" /> Editar
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={close} data-testid="ai-doc-close-preview">Cerrar</Button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto border border-[#E2E8F0] rounded-lg p-4 bg-white" data-testid="ai-doc-preview">
              {editing ? (
                <Textarea
                  value={previewContent}
                  onChange={e => setPreviewContent(e.target.value)}
                  className="w-full h-full text-xs font-mono resize-none border-0 focus-visible:ring-0"
                  rows={30}
                />
              ) : (
                <div className="prose prose-sm max-w-none text-xs whitespace-pre-wrap font-sans text-[#0F172A]" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {previewContent}
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
