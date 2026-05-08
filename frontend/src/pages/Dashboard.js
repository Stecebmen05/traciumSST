import React, { useState, useEffect, useCallback } from 'react';
import API from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  FileText, AlertTriangle, Shield, GraduationCap, Search,
  ClipboardList, TrendingUp, ArrowUpRight, Sparkles, Send
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Textarea } from '@/components/ui/textarea';

const RISK_COLORS = { critical: '#D90429', high: '#F97316', medium: '#FFC300', low: '#2A9D8F' };

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [complianceSummary, setComplianceSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiQuery, setAiQuery] = useState('');
  const [aiResult, setAiResult] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      const [res, csRes] = await Promise.all([
        API.get('/dashboard'),
        API.get('/standards/compliance/summary').catch(() => ({ data: null }))
      ]);
      setData(res.data);
      setComplianceSummary(csRes.data);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const handleAiAnalysis = async () => {
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    try {
      const res = await API.post('/ai/analyze', { query: aiQuery, context_type: 'dashboard' });
      setAiResult(res.data.analysis);
    } catch (err) {
      setAiResult('Error al generar analisis');
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#0047AB] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const resScore = complianceSummary?.overall?.score || kpis.compliance_percentage || 0;
  const auditScore = data?.audit_score || null;
  const phvaBreakdown = auditScore?.phva_breakdown || null;

  // Semaphore classification
  const getStatus = (s) => {
    if (s >= 86) return { label: 'Aceptable', color: '#2A9D8F', bg: '#2A9D8F15', border: '#2A9D8F' };
    if (s >= 60) return { label: 'Moderado', color: '#FFC300', bg: '#FFC30015', border: '#FFC300' };
    return { label: 'Critico', color: '#D90429', bg: '#D9042915', border: '#D90429' };
  };
  const status = getStatus(resScore);

  const kpiCards = [
    { label: 'Puntaje Res. 0312', value: `${resScore}%`, icon: ClipboardList, color: status.color, sub: status.label },
    { label: 'Avance Plan Anual', value: `${kpis.plan_progress || 0}%`, icon: TrendingUp, color: '#2A9D8F', sub: `${kpis.completed_activities || 0}/${kpis.total_activities || 0} actividades` },
    { label: 'Incidentes Abiertos', value: kpis.open_incidents || 0, icon: Shield, color: '#D90429', sub: `de ${kpis.total_incidents || 0} totales` },
    { label: 'Riesgos Altos', value: kpis.high_risk_hazards || 0, icon: AlertTriangle, color: '#F97316', sub: `de ${kpis.total_hazards || 0} identificados` },
    { label: 'Planes Vencidos', value: kpis.overdue_plans || 0, icon: AlertTriangle, color: '#D90429', sub: `de ${kpis.total_plans || 0} abiertos` },
    { label: 'Capacitaciones', value: kpis.completed_trainings || 0, icon: GraduationCap, color: '#8B5CF6', sub: `de ${kpis.total_trainings || 0} programadas` },
    { label: 'Auditorias', value: kpis.total_audits || 0, icon: Search, color: '#0047AB', sub: 'Realizadas' },
    { label: 'Hallazgos Abiertos', value: kpis.open_findings || 0, icon: ArrowUpRight, color: '#D90429', sub: `de ${kpis.total_findings || 0} totales` },
  ];

  const complianceData = [
    { name: 'Cumple', value: resScore },
    { name: 'No cumple', value: 100 - resScore },
  ];

  const modulesData = [
    { name: 'Documentos', value: kpis.total_documents || 0 },
    { name: 'Peligros', value: kpis.total_hazards || 0 },
    { name: 'Incidentes', value: kpis.total_incidents || 0 },
    { name: 'Capacitaciones', value: kpis.total_trainings || 0 },
    { name: 'Auditorias', value: kpis.total_audits || 0 },
  ];

  return (
    <div className="space-y-6 animate-fade-in" data-testid="dashboard-page">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ fontFamily: 'Outfit, sans-serif', color: '#0F172A' }}>
          Panel de Control
        </h1>
        <p className="text-sm text-[#475569] mt-1">
          Bienvenido, {user?.name}. Resumen del estado de tu SG-SST.
        </p>
      </div>

      {/* Compliance Semaphore Banner */}
      <Card
        data-testid="compliance-semaphore"
        className="border-0 shadow-md overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${status.color}, ${status.color}dd)` }}
      >
        <CardContent className="p-5 text-white">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                <ClipboardList className="w-8 h-8" />
              </div>
              <div>
                <p className="text-xs font-medium opacity-90 uppercase tracking-wider">Estado de Cumplimiento</p>
                <p className="text-4xl font-bold mt-1" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  {resScore}%
                </p>
                <p className="text-sm opacity-90">Resolucion 0312/2019 - {status.label}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className={`px-3 py-2 rounded-lg text-center min-w-[80px] ${resScore < 60 ? 'bg-white/30' : 'bg-white/10'}`}>
                <p className="text-[10px] uppercase font-semibold opacity-90">Critico</p>
                <p className="text-xs font-bold">&lt; 60%</p>
              </div>
              <div className={`px-3 py-2 rounded-lg text-center min-w-[80px] ${resScore >= 60 && resScore < 86 ? 'bg-white/30' : 'bg-white/10'}`}>
                <p className="text-[10px] uppercase font-semibold opacity-90">Moderado</p>
                <p className="text-xs font-bold">60 - 85%</p>
              </div>
              <div className={`px-3 py-2 rounded-lg text-center min-w-[80px] ${resScore >= 86 ? 'bg-white/30' : 'bg-white/10'}`}>
                <p className="text-[10px] uppercase font-semibold opacity-90">Aceptable</p>
                <p className="text-xs font-bold">&gt; 85%</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PHVA Breakdown */}
      {phvaBreakdown && (
        <Card data-testid="phva-breakdown" className="border border-[#E2E8F0] bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#0F172A]" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Ciclo PHVA - {auditScore?.audit_title || 'Ultima auditoria'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { key: 'planear', label: 'Planear', weight: '25%', color: '#0047AB' },
                { key: 'hacer', label: 'Hacer', weight: '60%', color: '#2A9D8F' },
                { key: 'verificar', label: 'Verificar', weight: '5%', color: '#F97316' },
                { key: 'actuar', label: 'Actuar', weight: '10%', color: '#8B5CF6' },
              ].map(p => {
                const val = phvaBreakdown[p.key];
                const pct = typeof val === 'object' ? (val?.percentage ?? val?.score ?? 0) : (val || 0);
                return (
                  <div key={p.key} data-testid={`phva-${p.key}`} className="p-3 rounded-lg border border-[#E2E8F0]">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold" style={{ color: p.color }}>{p.label}</p>
                      <span className="text-[10px] text-[#94A3B8]">{p.weight}</span>
                    </div>
                    <p className="text-xl font-bold" style={{ fontFamily: 'JetBrains Mono, monospace', color: p.color }}>
                      {Math.round(pct)}%
                    </p>
                    <div className="w-full h-1.5 rounded-full bg-[#F1F5F9] mt-2 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, pct)}%`, backgroundColor: p.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="kpi-grid">
        {kpiCards.map((kpi, i) => (
          <Card key={i} className={`border border-[#E2E8F0] bg-white hover:-translate-y-0.5 transition-all duration-200 stagger-${i % 4 + 1} animate-fade-in`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide">{kpi.label}</p>
                  <p className="text-2xl font-bold mt-1" style={{ fontFamily: 'JetBrains Mono, monospace', color: kpi.color }}>
                    {kpi.value}
                  </p>
                  <p className="text-xs text-[#94A3B8] mt-0.5">{kpi.sub}</p>
                </div>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${kpi.color}15` }}>
                  <kpi.icon className="w-4 h-4" style={{ color: kpi.color }} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Compliance Pie */}
        <Card className="border border-[#E2E8F0] bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#0F172A]" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Cumplimiento Legal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={complianceData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} dataKey="value" startAngle={90} endAngle={-270}>
                    <Cell fill="#0047AB" />
                    <Cell fill="#E2E8F0" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <p className="text-center text-xs text-[#475569]">
              <span className="text-lg font-bold" style={{ fontFamily: 'JetBrains Mono, monospace', color: '#0047AB' }}>
                {resScore}%
              </span>
              {' '}Res. 0312/2019
            </p>
          </CardContent>
        </Card>

        {/* Modules Bar Chart */}
        <Card className="border border-[#E2E8F0] bg-white lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#0F172A]" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Resumen por Modulo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={modulesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#475569' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#475569' }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#0047AB" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Items + AI */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Incidents */}
        <Card className="border border-[#E2E8F0] bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#0F172A]" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Incidentes Recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(data?.recent_incidents || []).length === 0 ? (
              <p className="text-xs text-[#94A3B8] py-4 text-center">Sin incidentes registrados</p>
            ) : (
              <div className="space-y-2">
                {(data?.recent_incidents || []).map((inc, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-[#E2E8F0] last:border-0">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-[#0F172A] truncate">{inc.description}</p>
                      <p className="text-[10px] text-[#94A3B8]">{inc.date} - {inc.location}</p>
                    </div>
                    <Badge variant={inc.severity === 'critical' ? 'destructive' : inc.severity === 'moderate' ? 'default' : 'secondary'} className="text-[10px] ml-2 flex-shrink-0">
                      {inc.severity}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Analysis */}
        <Card className="border border-[#E2E8F0] bg-white" data-testid="ai-analysis-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#0F172A] flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
              <Sparkles className="w-4 h-4 text-[#0047AB]" />
              Analisis Inteligente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              data-testid="ai-query-input"
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              placeholder="Ej: Que acciones prioritarias debo tomar para mejorar el cumplimiento?"
              className="text-xs h-20 resize-none border-[#E2E8F0]"
            />
            <Button
              data-testid="ai-analyze-btn"
              onClick={handleAiAnalysis}
              disabled={aiLoading || !aiQuery.trim()}
              className="w-full text-xs h-8"
              style={{ backgroundColor: '#0047AB' }}
            >
              {aiLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <><Send className="w-3 h-3 mr-1" /> Analizar</>
              )}
            </Button>
            {aiResult && (
              <div data-testid="ai-result" className="p-3 rounded-lg bg-[#F1F5F9] text-xs text-[#0F172A] whitespace-pre-wrap max-h-40 overflow-y-auto">
                {aiResult}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
