import React, { useState, useEffect, useCallback } from 'react';
import API from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Activity, Download, FileText, FileSpreadsheet, TrendingUp, AlertTriangle, ShieldCheck, Clock, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const MONTHS = [
  { v: 0, l: 'Año completo' }, { v: 1, l: 'Enero' }, { v: 2, l: 'Febrero' }, { v: 3, l: 'Marzo' },
  { v: 4, l: 'Abril' }, { v: 5, l: 'Mayo' }, { v: 6, l: 'Junio' }, { v: 7, l: 'Julio' },
  { v: 8, l: 'Agosto' }, { v: 9, l: 'Septiembre' }, { v: 10, l: 'Octubre' }, { v: 11, l: 'Noviembre' }, { v: 12, l: 'Diciembre' },
];

const LABELS = {
  cumplimiento_resolucion_0312: 'Cumplimiento Res. 0312',
  porcentaje_capacitaciones_ejecutadas: '% Capacitaciones ejecutadas',
  trainings_planeadas: 'Capacitaciones planeadas',
  trainings_realizadas: 'Capacitaciones realizadas',
  porcentaje_planes_cerrados: '% Planes cerrados',
  porcentaje_hallazgos_cerrados: '% Hallazgos cerrados',
  planes_total: 'Planes totales',
  planes_cerrados: 'Planes cerrados',
  hallazgos_total: 'Hallazgos totales',
  hallazgos_cerrados: 'Hallazgos cerrados',
  frecuencia_at: 'Frecuencia AT',
  severidad_at: 'Severidad AT',
  mortalidad_at: 'Mortalidad AT',
  prevalencia_el: 'Prevalencia EL',
  incidencia_el: 'Incidencia EL',
  ausentismo_porcentaje: '% Ausentismo',
  accidentes_total: 'Accidentes totales',
  muertes: 'Muertes',
  dias_perdidos: 'Dias perdidos',
  enfermedades_laborales: 'Enfermedades laborales',
  horas_hombre_trabajadas: 'Horas-hombre trabajadas',
};

const FORMULAS = {
  frecuencia_at: '(# AT × 200,000) / horas-hombre',
  severidad_at: '(días perdidos × 200,000) / horas-hombre',
  mortalidad_at: '(# muertes × 100,000) / # trabajadores',
  prevalencia_el: '(# casos EL × 100,000) / # trabajadores',
  incidencia_el: '(# casos nuevos EL × 100,000) / # trabajadores',
  ausentismo_porcentaje: '(días ausencia / días programados) × 100',
};

function MetricCard({ label, value, suffix = '', color, formula }) {
  return (
    <Card className="border border-[#E2E8F0] bg-white">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-[#94A3B8] font-semibold mb-1">{label}</p>
            <p className="text-2xl font-bold" style={{ fontFamily: 'JetBrains Mono, monospace', color: color || '#0F172A' }}>
              {typeof value === 'number' ? value.toLocaleString('es-CO') : value}{suffix}
            </p>
            {formula && <p className="text-[9px] text-[#94A3B8] font-mono mt-1">{formula}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function IndicatorsArl() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(0);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get('/indicators/arl', { params: { year, month } });
      setData(res.data);
    } catch (err) { toast.error(err.response?.data?.detail || 'Error al cargar indicadores'); }
    finally { setLoading(false); }
  }, [year, month]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const exportPdf = () => {
    const url = `${process.env.REACT_APP_BACKEND_URL}/api/indicators/arl/pdf?year=${year}&month=${month}`;
    window.open(url, '_blank');
    toast.success('Generando PDF...');
  };
  const exportExcel = () => {
    const url = `${process.env.REACT_APP_BACKEND_URL}/api/indicators/arl/excel?year=${year}&month=${month}`;
    window.open(url, '_blank');
    toast.success('Descargando Excel...');
  };

  if (loading || !data) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-[#0047AB] border-t-transparent rounded-full animate-spin" /></div>;

  const compStatus = data.estructura.cumplimiento_resolucion_0312;
  const compColor = compStatus >= 86 ? '#2A9D8F' : compStatus >= 60 ? '#F97316' : '#D90429';

  return (
    <div className="space-y-6 animate-fade-in" data-testid="indicators-arl-page">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2" style={{ fontFamily: 'Outfit' }}>
            <Activity className="w-6 h-6 text-[#0047AB]" />
            Indicadores ARL
          </h1>
          <p className="text-sm text-[#475569] mt-1">Reporte mensual conforme Resolución 1111/2017 (deroga 0312/2019)</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Select value={String(year)} onValueChange={v => setYear(parseInt(v))}>
            <SelectTrigger className="w-28" data-testid="arl-year-select"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026, 2027].map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={String(month)} onValueChange={v => setMonth(parseInt(v))}>
            <SelectTrigger className="w-40" data-testid="arl-month-select"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MONTHS.map(m => <SelectItem key={m.v} value={String(m.v)}>{m.l}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={fetchData} data-testid="arl-refresh-btn">
            <RefreshCw className="w-3 h-3 mr-1" /> Actualizar
          </Button>
          <Button size="sm" className="bg-[#0047AB] hover:bg-[#003888]" onClick={exportPdf} data-testid="arl-export-pdf">
            <FileText className="w-3 h-3 mr-1" /> PDF
          </Button>
          <Button size="sm" className="bg-[#2A9D8F] hover:bg-[#238276]" onClick={exportExcel} data-testid="arl-export-excel">
            <FileSpreadsheet className="w-3 h-3 mr-1" /> Excel
          </Button>
        </div>
      </div>

      {/* Compliance hero */}
      <Card className="border-0 shadow-md overflow-hidden" style={{ background: `linear-gradient(135deg, ${compColor}, ${compColor}dd)` }} data-testid="arl-compliance-hero">
        <CardContent className="p-5 text-white">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div>
                <p className="text-xs font-medium opacity-90 uppercase tracking-wider">{data.company.name} · NIT {data.company.nit || 'N/A'}</p>
                <p className="text-4xl font-bold mt-1" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{compStatus}%</p>
                <p className="text-sm opacity-90">Cumplimiento Resolución 0312 · {compStatus >= 86 ? 'Aceptable' : compStatus >= 60 ? 'Moderado' : 'Crítico'}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs opacity-90 uppercase">Periodo</p>
              <p className="text-2xl font-bold">{data.period.label}</p>
              <p className="text-xs opacity-80">{data.company.workers} trabajadores · Riesgo {data.company.risk_level}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resultado (highest priority) */}
      <div data-testid="arl-section-resultado">
        <h2 className="text-sm font-bold text-[#1F3C5E] mb-3 flex items-center gap-2" style={{ fontFamily: 'Outfit' }}>
          <AlertTriangle className="w-4 h-4 text-[#D90429]" /> Indicadores de Resultado
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <MetricCard label={LABELS.frecuencia_at} value={data.resultado.frecuencia_at} color="#D90429" formula={FORMULAS.frecuencia_at} />
          <MetricCard label={LABELS.severidad_at} value={data.resultado.severidad_at} color="#F97316" formula={FORMULAS.severidad_at} />
          <MetricCard label={LABELS.mortalidad_at} value={data.resultado.mortalidad_at} color="#0F172A" formula={FORMULAS.mortalidad_at} />
          <MetricCard label={LABELS.prevalencia_el} value={data.resultado.prevalencia_el} color="#8B5CF6" formula={FORMULAS.prevalencia_el} />
          <MetricCard label={LABELS.incidencia_el} value={data.resultado.incidencia_el} color="#7C3AED" formula={FORMULAS.incidencia_el} />
          <MetricCard label={LABELS.ausentismo_porcentaje} value={data.resultado.ausentismo_porcentaje} suffix="%" color="#0047AB" formula={FORMULAS.ausentismo_porcentaje} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-3">
          {['accidentes_total', 'muertes', 'dias_perdidos', 'enfermedades_laborales', 'horas_hombre_trabajadas'].map(k => (
            <div key={k} className="bg-[#F8F9FA] border border-[#E2E8F0] rounded-lg p-2.5" data-testid={`arl-${k}`}>
              <p className="text-[9px] uppercase text-[#94A3B8] font-semibold">{LABELS[k]}</p>
              <p className="text-lg font-bold font-mono text-[#0F172A]">{data.resultado[k].toLocaleString('es-CO')}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Estructura */}
      <div data-testid="arl-section-estructura">
        <h2 className="text-sm font-bold text-[#1F3C5E] mb-3 flex items-center gap-2" style={{ fontFamily: 'Outfit' }}>
          <ShieldCheck className="w-4 h-4 text-[#2A9D8F]" /> Indicadores de Estructura
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard label={LABELS.cumplimiento_resolucion_0312} value={data.estructura.cumplimiento_resolucion_0312} suffix="%" color={compColor} />
          <MetricCard label={LABELS.porcentaje_capacitaciones_ejecutadas} value={data.estructura.porcentaje_capacitaciones_ejecutadas} suffix="%" color="#8B5CF6" />
          <MetricCard label={LABELS.trainings_planeadas} value={data.estructura.trainings_planeadas} color="#0047AB" />
          <MetricCard label={LABELS.trainings_realizadas} value={data.estructura.trainings_realizadas} color="#2A9D8F" />
        </div>
      </div>

      {/* Proceso */}
      <div data-testid="arl-section-proceso">
        <h2 className="text-sm font-bold text-[#1F3C5E] mb-3 flex items-center gap-2" style={{ fontFamily: 'Outfit' }}>
          <TrendingUp className="w-4 h-4 text-[#0047AB]" /> Indicadores de Proceso
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <MetricCard label={LABELS.porcentaje_planes_cerrados} value={data.proceso.porcentaje_planes_cerrados} suffix="%" color="#2A9D8F" />
          <MetricCard label={LABELS.porcentaje_hallazgos_cerrados} value={data.proceso.porcentaje_hallazgos_cerrados} suffix="%" color="#2A9D8F" />
          <MetricCard label={LABELS.planes_total} value={data.proceso.planes_total} color="#0047AB" />
          <MetricCard label={LABELS.planes_cerrados} value={data.proceso.planes_cerrados} color="#0047AB" />
          <MetricCard label={LABELS.hallazgos_total} value={data.proceso.hallazgos_total} color="#F97316" />
          <MetricCard label={LABELS.hallazgos_cerrados} value={data.proceso.hallazgos_cerrados} color="#2A9D8F" />
        </div>
      </div>

      <Card className="border border-[#E2E8F0] bg-[#F8F9FA]">
        <CardContent className="p-3">
          <p className="text-[10px] text-[#475569]">
            <Clock className="w-3 h-3 inline mr-1" />
            Indicadores calculados automáticamente desde Auditorías, Capacitaciones, Hallazgos, Planes de Acción e Incidentes.
            Métricas siguen las fórmulas oficiales de la Resolución 1111/2017 que deroga la 0312/2019. Las horas-hombre se estiman como trabajadores × 8h × 22 días × meses.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
