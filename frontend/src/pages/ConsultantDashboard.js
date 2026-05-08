import React, { useState, useEffect, useCallback } from 'react';
import API from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Building2, TrendingUp, AlertTriangle, Shield, Search } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const RISK_LABELS = ['', 'I', 'II', 'III', 'IV', 'V'];

export default function ConsultantDashboard() {
  const { companies } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await API.get('/consultant/dashboard');
      setData(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-[#0047AB] border-t-transparent rounded-full animate-spin" /></div>;

  const avgScore = data.length > 0 ? Math.round(data.reduce((s, c) => s + c.compliance_score, 0) / data.length) : 0;
  const totalFindings = data.reduce((s, c) => s + c.open_findings, 0);
  const totalAudits = data.reduce((s, c) => s + c.total_audits, 0);
  const totalWorkers = data.reduce((s, c) => s + c.workers_count, 0);

  const chartData = data.map(d => ({
    name: d.name.length > 15 ? d.name.substring(0, 15) + '...' : d.name,
    score: d.compliance_score,
    fill: d.compliance_score >= 86 ? '#2A9D8F' : d.compliance_score >= 60 ? '#FFC300' : '#D90429'
  }));

  return (
    <div className="space-y-6 animate-fade-in" data-testid="consultant-dashboard">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Outfit' }}>
          Dashboard Consultora
        </h1>
        <p className="text-sm text-[#475569] mt-1">Consolidado de {data.length} empresas gestionadas</p>
      </div>

      {/* Global KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-[#E2E8F0] bg-white">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-[#94A3B8] uppercase font-medium">Empresas</p>
                <p className="text-2xl font-bold mt-1" style={{ fontFamily: 'JetBrains Mono', color: '#0047AB' }}>{data.length}</p>
                <p className="text-[10px] text-[#94A3B8]">{totalWorkers} trabajadores total</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-[#0047AB]/10 flex items-center justify-center">
                <Building2 className="w-4 h-4 text-[#0047AB]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-[#E2E8F0] bg-white">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-[#94A3B8] uppercase font-medium">Cumplimiento Promedio</p>
                <p className="text-2xl font-bold mt-1" style={{ fontFamily: 'JetBrains Mono', color: avgScore >= 86 ? '#2A9D8F' : avgScore >= 60 ? '#FFC300' : '#D90429' }}>{avgScore}%</p>
                <p className="text-[10px] text-[#94A3B8]">Res. 0312/2019</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-[#2A9D8F]/10 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-[#2A9D8F]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-[#E2E8F0] bg-white">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-[#94A3B8] uppercase font-medium">Hallazgos Abiertos</p>
                <p className="text-2xl font-bold mt-1" style={{ fontFamily: 'JetBrains Mono', color: '#D90429' }}>{totalFindings}</p>
                <p className="text-[10px] text-[#94A3B8]">Pendientes de cierre</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-[#D90429]/10 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-[#D90429]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-[#E2E8F0] bg-white">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-[#94A3B8] uppercase font-medium">Auditorias</p>
                <p className="text-2xl font-bold mt-1" style={{ fontFamily: 'JetBrains Mono', color: '#0047AB' }}>{totalAudits}</p>
                <p className="text-[10px] text-[#94A3B8]">Ejecutadas en total</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-[#0047AB]/10 flex items-center justify-center">
                <Search className="w-4 h-4 text-[#0047AB]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Chart */}
      <Card className="border border-[#E2E8F0] bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold" style={{ fontFamily: 'Outfit' }}>Cumplimiento por Empresa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={120} />
                <Tooltip formatter={(v) => `${v}%`} />
                <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Companies Table */}
      <Card className="border border-[#E2E8F0] bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold" style={{ fontFamily: 'Outfit' }}>Detalle por Empresa</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs font-semibold">Empresa</TableHead>
                <TableHead className="text-xs font-semibold text-center">Trabajadores</TableHead>
                <TableHead className="text-xs font-semibold text-center">Riesgo</TableHead>
                <TableHead className="text-xs font-semibold text-center">Estandares</TableHead>
                <TableHead className="text-xs font-semibold">Cumplimiento</TableHead>
                <TableHead className="text-xs font-semibold text-center">Auditorias</TableHead>
                <TableHead className="text-xs font-semibold text-center">Hallazgos</TableHead>
                <TableHead className="text-xs font-semibold text-center">Incidentes</TableHead>
                <TableHead className="text-xs font-semibold">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map(c => (
                <TableRow key={c.company_id} className="hover:bg-[#F8F9FA]">
                  <TableCell className="text-xs font-medium">{c.name}</TableCell>
                  <TableCell className="text-center font-mono text-xs">{c.workers_count}</TableCell>
                  <TableCell className="text-center font-mono text-xs">{RISK_LABELS[c.risk_level]}</TableCell>
                  <TableCell className="text-center font-mono text-xs">{c.compliant_standards}/{c.total_standards}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={c.compliance_score} className="h-1.5 flex-1" />
                      <span className="font-mono text-xs font-bold" style={{ color: c.compliance_score >= 86 ? '#2A9D8F' : c.compliance_score >= 60 ? '#FFC300' : '#D90429' }}>
                        {c.compliance_score}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-mono text-xs">{c.total_audits}</TableCell>
                  <TableCell className="text-center font-mono text-xs text-[#D90429] font-bold">{c.open_findings}</TableCell>
                  <TableCell className="text-center font-mono text-xs">{c.total_incidents}</TableCell>
                  <TableCell>
                    <Badge className={`text-[10px] ${c.compliance_score >= 86 ? 'bg-[#2A9D8F] text-white' : c.compliance_score >= 60 ? 'bg-[#FFC300] text-[#0F172A]' : 'bg-[#D90429] text-white'}`}>
                      {c.compliance_score >= 86 ? 'Aceptable' : c.compliance_score >= 60 ? 'Moderado' : 'Critico'}
                    </Badge>
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
