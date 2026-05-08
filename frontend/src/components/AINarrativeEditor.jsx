import React, { useState, useEffect } from 'react';
import API from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Save, Loader2, Wand2 } from 'lucide-react';
import { toast } from 'sonner';

const SECTIONS = [
  { key: 'narrative_opening', type: 'opening_narrative', label: 'Acta de Apertura (Intro)', hint: 'Introduccion, objetivo de la reunion, agenda. 3-5 parrafos.' },
  { key: 'narrative_closing', type: 'closing_narrative', label: 'Acta de Cierre (Intro)', hint: 'Sintesis de hallazgos, compromisos, proximos pasos.' },
  { key: 'narrative_report', type: 'report_narrative', label: 'Informe Final (Resumen Ejecutivo)', hint: 'Introduccion ejecutiva y conclusiones. 4-6 parrafos.' },
];

export default function AINarrativeEditor({ audit, onRefresh }) {
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState({});
  const [saving, setSaving] = useState({});

  useEffect(() => {
    setValues({
      narrative_opening: audit?.narrative_opening || '',
      narrative_closing: audit?.narrative_closing || '',
      narrative_report: audit?.narrative_report || '',
    });
  }, [audit?.audit_id, audit?.narrative_opening, audit?.narrative_closing, audit?.narrative_report]);

  const buildContext = () => {
    const f = audit?.findings || [];
    const nc = f.filter(x => x.finding_type === 'no_conformity').length;
    const obs = f.filter(x => x.finding_type === 'observation').length;
    const opp = f.filter(x => x.finding_type === 'improvement').length;
    const score = audit?.score_result?.percentage ?? 0;
    return `Empresa: ${audit?.company_name || 'N/A'}. Auditoria: ${audit?.title}. Tipo: ${audit?.audit_type}. Fecha: ${audit?.scheduled_date}. Auditor Lider: ${audit?.auditor || 'N/A'}. Puntaje: ${score}%. Hallazgos: ${nc} NC, ${obs} Observaciones, ${opp} Oportunidades de mejora. Alcance: ${audit?.scope || 'N/A'}.`;
  };

  const handleGenerate = async (section) => {
    setLoading(prev => ({ ...prev, [section.key]: true }));
    try {
      const ctx = values[section.key]
        ? `${buildContext()}\n\nTEXTO ACTUAL A MEJORAR:\n${values[section.key]}`
        : buildContext();
      const res = await API.post('/audits/ai/assist', { type: section.type, context: ctx });
      setValues(prev => ({ ...prev, [section.key]: res.data.result }));
      toast.success('Borrador generado por IA. Revisa y edita antes de guardar.');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al generar con IA');
    } finally {
      setLoading(prev => ({ ...prev, [section.key]: false }));
    }
  };

  const handleSave = async (section) => {
    setSaving(prev => ({ ...prev, [section.key]: true }));
    try {
      await API.put(`/audits/${audit.audit_id}/ai-redaction`, { [section.key]: values[section.key] });
      toast.success('Narrativa guardada. Sera incluida en el PDF.');
      onRefresh?.();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al guardar');
    } finally {
      setSaving(prev => ({ ...prev, [section.key]: false }));
    }
  };

  return (
    <Card className="border-2 border-dashed border-[#8B5CF6]/40 bg-gradient-to-br from-[#8B5CF6]/5 to-transparent" data-testid="ai-narrative-editor">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2" style={{ fontFamily: 'Outfit', color: '#0F172A' }}>
          <Wand2 className="w-4 h-4 text-[#8B5CF6]" />
          Editor IA de Actas e Informe
          <Badge className="bg-[#8B5CF6] text-white text-[10px]">Solo Auditor/Admin</Badge>
        </CardTitle>
        <p className="text-[10px] text-[#475569]">Genera con IA, revisa y guarda la narrativa de cada documento. El contenido se integra al PDF antes de cerrar la auditoria.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {SECTIONS.map(section => (
          <div key={section.key} className="border border-[#E2E8F0] rounded-lg p-3 bg-white" data-testid={`narrative-${section.key}`}>
            <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
              <div>
                <p className="text-xs font-semibold text-[#0F172A]">{section.label}</p>
                <p className="text-[10px] text-[#94A3B8]">{section.hint}</p>
              </div>
              <div className="flex gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-[10px] border-[#8B5CF6] text-[#8B5CF6]"
                  onClick={() => handleGenerate(section)}
                  disabled={loading[section.key]}
                  data-testid={`ai-generate-${section.key}`}
                >
                  {loading[section.key] ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />}
                  {values[section.key] ? 'Mejorar con IA' : 'Generar con IA'}
                </Button>
                <Button
                  size="sm"
                  className="h-7 text-[10px] bg-[#2A9D8F] hover:bg-[#238276]"
                  onClick={() => handleSave(section)}
                  disabled={saving[section.key] || !values[section.key]?.trim()}
                  data-testid={`ai-save-${section.key}`}
                >
                  {saving[section.key] ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Save className="w-3 h-3 mr-1" />}
                  Guardar
                </Button>
              </div>
            </div>
            <Textarea
              data-testid={`narrative-textarea-${section.key}`}
              value={values[section.key] || ''}
              onChange={(e) => setValues(prev => ({ ...prev, [section.key]: e.target.value }))}
              placeholder={`Escribe o genera la narrativa para: ${section.label}`}
              rows={5}
              className="text-xs font-mono resize-y"
            />
            {(audit?.[section.key] && audit[section.key] !== values[section.key]) && (
              <p className="text-[10px] text-[#F97316] mt-1">Cambios sin guardar</p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
