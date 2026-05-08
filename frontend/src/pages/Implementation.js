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
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Plus, CheckCircle, XCircle, Calendar, Trash2, Settings, RefreshCw, Building2, Filter, BarChart3, Upload, FileIcon, Download } from 'lucide-react';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

const PHVA_COLORS = { PLANEAR: '#0047AB', HACER: '#2A9D8F', VERIFICAR: '#F97316', ACTUAR: '#8B5CF6' };

export default function Implementation() {
  const [activeTab, setActiveTab] = useState('standards');
  const [standards, setStandards] = useState([]);
  const [activities, setActivities] = useState([]);
  const [summary, setSummary] = useState(null);
  const [company, setCompany] = useState(null);
  const [decreto, setDecreto] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCompanyDialog, setShowCompanyDialog] = useState(false);
  const [showActDialog, setShowActDialog] = useState(false);
  const [filterPhva, setFilterPhva] = useState('all');
  const [filterChapter, setFilterChapter] = useState('all');
  const [filterCompliance, setFilterCompliance] = useState('all');
  const [actForm, setActForm] = useState({ title: '', description: '', responsible: '', due_date: '', category: 'general', priority: 'medium' });
  const [companyForm, setCompanyForm] = useState({ name: '', workers_count: 25, risk_level: 2, nit: '', economic_activity: '', city: '', sedes: ['Sede Principal'], processes: ['Administrativo', 'Operativo'] });

  const fetchData = useCallback(async () => {
    try {
      const [stdRes, actRes, sumRes, compRes, decRes] = await Promise.all([
        API.get('/standards/compliance'),
        API.get('/activities'),
        API.get('/standards/compliance/summary'),
        API.get('/company'),
        API.get('/decreto1072/components'),
      ]);
      setStandards(stdRes.data);
      setActivities(actRes.data);
      setSummary(sumRes.data);
      setCompany(compRes.data);
      setDecreto(decRes.data);
      setCompanyForm(compRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleUpdateCompany = async () => {
    try {
      const payload = { ...companyForm };
      if (typeof payload.sedes === 'string') payload.sedes = payload.sedes.split(',').map(s => s.trim());
      if (typeof payload.processes === 'string') payload.processes = payload.processes.split(',').map(s => s.trim());
      await API.put('/company', payload);
      toast.success('Empresa actualizada');
      setShowCompanyDialog(false);
      // Reset standards for new company config
      await API.post('/standards/reset');
      toast.success('Estandares recalculados');
      fetchData();
    } catch { toast.error('Error'); }
  };

  const handleToggleCompliant = async (code, current) => {
    try {
      await API.put(`/standards/compliance/${code}`, { compliant: !current });
      fetchData();
    } catch { toast.error('Error'); }
  };

  const handleUpdateStandard = async (code, updates) => {
    try {
      await API.put(`/standards/compliance/${code}`, updates);
      fetchData();
    } catch { toast.error('Error'); }
  };

  const handleAddActivity = async () => {
    try {
      await API.post('/activities', actForm);
      toast.success('Actividad creada');
      setShowActDialog(false);
      setActForm({ title: '', description: '', responsible: '', due_date: '', category: 'general', priority: 'medium' });
      fetchData();
    } catch { toast.error('Error'); }
  };

  const handleUpdateActStatus = async (act, newStatus) => {
    try {
      await API.put(`/activities/${act.activity_id}`, { status: newStatus, completion_percentage: newStatus === 'completed' ? 100 : act.completion_percentage });
      fetchData();
    } catch { toast.error('Error'); }
  };

  const handleDeleteActivity = async (id) => {
    try { await API.delete(`/activities/${id}`); toast.success('Eliminada'); fetchData(); }
    catch { toast.error('Error'); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-[#0047AB] border-t-transparent rounded-full animate-spin" /></div>;

  const overall = summary?.overall || {};
  const phva = summary?.phva || {};
  const byChapter = summary?.by_chapter || {};
  const byResponsible = summary?.by_responsible || {};
  const bySede = summary?.by_sede || {};

  const applicableStds = standards.filter(s => s.applicable);
  const filteredStds = applicableStds.filter(s => {
    if (filterPhva !== 'all' && s.phva !== filterPhva) return false;
    if (filterChapter !== 'all' && s.standard !== filterChapter) return false;
    if (filterCompliance === 'compliant' && !s.compliant) return false;
    if (filterCompliance === 'non_compliant' && s.compliant) return false;
    return true;
  });

  const phvaData = Object.entries(phva).map(([key, val]) => ({
    name: key, value: val.percentage, total: val.total, compliant: val.compliant, fill: PHVA_COLORS[key]
  }));

  const chapterData = Object.entries(byChapter).map(([key, val]) => ({
    name: key.length > 20 ? key.substring(0, 20) + '...' : key, fullName: key, value: val.percentage, total: val.total, compliant: val.compliant
  }));

  const completedAct = activities.filter(a => a.status === 'completed').length;
  const progressPct = activities.length > 0 ? Math.round((completedAct / activities.length) * 100) : 0;

  const companyLabel = company?.workers_count <= 10 ? 'Hasta 10 trab. (Cap.1)' : company?.workers_count <= 50 ? '11-50 trab. (Cap.2)' : 'Mas de 50 trab. (Cap.3)';
  const riskLabel = `Riesgo ${['', 'I', 'II', 'III', 'IV', 'V'][company?.risk_level || 2]}`;

  return (
    <div className="space-y-6 animate-fade-in" data-testid="implementation-page">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Outfit' }}>Implementacion SG-SST</h1>
          <p className="text-sm text-[#475569] mt-1">Res. 0312/2019 y Decreto 1072/2015 - Estandares minimos completos</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs px-3 py-1">
            <Building2 className="w-3 h-3 mr-1" />{companyLabel} - {riskLabel}
          </Badge>
          <Dialog open={showCompanyDialog} onOpenChange={setShowCompanyDialog}>
            <DialogTrigger asChild>
              <Button data-testid="config-company-btn" variant="outline" size="sm" className="text-xs h-8">
                <Settings className="w-3 h-3 mr-1" /> Configurar Empresa
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle style={{ fontFamily: 'Outfit' }}>Configuracion de la Empresa</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label className="text-xs font-semibold">Nombre de la Empresa</Label><Input data-testid="company-name-input" value={companyForm.name} onChange={e => setCompanyForm({...companyForm, name: e.target.value})} className="mt-1" /></div>
                <div><Label className="text-xs font-semibold">NIT</Label><Input value={companyForm.nit || ''} onChange={e => setCompanyForm({...companyForm, nit: e.target.value})} className="mt-1" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold">Numero de Trabajadores</Label>
                    <Input data-testid="workers-input" type="number" value={companyForm.workers_count} onChange={e => setCompanyForm({...companyForm, workers_count: parseInt(e.target.value) || 1})} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">Nivel de Riesgo</Label>
                    <Select value={String(companyForm.risk_level)} onValueChange={v => setCompanyForm({...companyForm, risk_level: parseInt(v)})}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">I - Minimo</SelectItem>
                        <SelectItem value="2">II - Bajo</SelectItem>
                        <SelectItem value="3">III - Medio</SelectItem>
                        <SelectItem value="4">IV - Alto</SelectItem>
                        <SelectItem value="5">V - Maximo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div><Label className="text-xs font-semibold">Actividad Economica</Label><Input value={companyForm.economic_activity || ''} onChange={e => setCompanyForm({...companyForm, economic_activity: e.target.value})} className="mt-1" /></div>
                <div><Label className="text-xs font-semibold">Ciudad</Label><Input value={companyForm.city || ''} onChange={e => setCompanyForm({...companyForm, city: e.target.value})} className="mt-1" /></div>
                <div><Label className="text-xs font-semibold">Sedes (separadas por coma)</Label><Input value={Array.isArray(companyForm.sedes) ? companyForm.sedes.join(', ') : companyForm.sedes} onChange={e => setCompanyForm({...companyForm, sedes: e.target.value})} className="mt-1" /></div>
                <div><Label className="text-xs font-semibold">Procesos (separados por coma)</Label><Input value={Array.isArray(companyForm.processes) ? companyForm.processes.join(', ') : companyForm.processes} onChange={e => setCompanyForm({...companyForm, processes: e.target.value})} className="mt-1" /></div>
                <div className="p-3 bg-[#FFF7ED] border border-[#FFC300]/30 rounded-lg">
                  <p className="text-xs text-[#92400E]">Al cambiar la configuracion se recalcularan los estandares aplicables segun la Res. 0312/2019</p>
                </div>
                <Button data-testid="save-company-btn" onClick={handleUpdateCompany} className="w-full" style={{ backgroundColor: '#0047AB' }}>
                  <RefreshCw className="w-3 h-3 mr-1" /> Guardar y Recalcular
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-[#F1F5F9] border border-[#E2E8F0]">
          <TabsTrigger value="standards" data-testid="tab-standards">Estandares Minimos</TabsTrigger>
          <TabsTrigger value="compliance" data-testid="tab-compliance">Cumplimiento</TabsTrigger>
          <TabsTrigger value="decreto" data-testid="tab-decreto">Decreto 1072</TabsTrigger>
          <TabsTrigger value="plan" data-testid="tab-plan">Plan de Trabajo</TabsTrigger>
        </TabsList>

        {/* ===== TAB: ESTÁNDARES MÍNIMOS ===== */}
        <TabsContent value="standards" className="space-y-4 mt-4">
          {/* Score Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card className="border border-[#E2E8F0] bg-white sm:col-span-1">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-[#94A3B8] uppercase font-medium">Puntaje Global</p>
                <p className="text-3xl font-bold mt-1" style={{ fontFamily: 'JetBrains Mono', color: overall.score >= 60 ? '#2A9D8F' : '#D90429' }}>
                  {overall.score || 0}
                </p>
                <p className="text-[10px] text-[#94A3B8]">de 100 puntos</p>
                <Progress value={overall.score || 0} className="mt-2 h-1.5" />
              </CardContent>
            </Card>
            <Card className="border border-[#E2E8F0] bg-white">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-[#94A3B8] uppercase font-medium">Aplicables</p>
                <p className="text-2xl font-bold mt-1" style={{ fontFamily: 'JetBrains Mono', color: '#0047AB' }}>{overall.applicable_count || 0}</p>
                <p className="text-[10px] text-[#94A3B8]">de {overall.total_standards || 0} estandares</p>
              </CardContent>
            </Card>
            <Card className="border border-[#E2E8F0] bg-white">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-[#94A3B8] uppercase font-medium">Cumplen</p>
                <p className="text-2xl font-bold mt-1" style={{ fontFamily: 'JetBrains Mono', color: '#2A9D8F' }}>{overall.compliant_count || 0}</p>
                <p className="text-[10px] text-[#94A3B8]">{overall.compliant_weight || 0} pts de {overall.total_weight || 0}</p>
              </CardContent>
            </Card>
            <Card className="border border-[#E2E8F0] bg-white">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-[#94A3B8] uppercase font-medium">No Cumplen</p>
                <p className="text-2xl font-bold mt-1" style={{ fontFamily: 'JetBrains Mono', color: '#D90429' }}>{(overall.applicable_count || 0) - (overall.compliant_count || 0)}</p>
                <p className="text-[10px] text-[#94A3B8]">{((overall.total_weight || 0) - (overall.compliant_weight || 0)).toFixed(1)} pts pendientes</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 items-center">
            <Filter className="w-4 h-4 text-[#94A3B8]" />
            <Select value={filterPhva} onValueChange={setFilterPhva}>
              <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue placeholder="Ciclo PHVA" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los ciclos</SelectItem>
                <SelectItem value="PLANEAR">Planear</SelectItem>
                <SelectItem value="HACER">Hacer</SelectItem>
                <SelectItem value="VERIFICAR">Verificar</SelectItem>
                <SelectItem value="ACTUAR">Actuar</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterChapter} onValueChange={setFilterChapter}>
              <SelectTrigger className="w-[180px] h-8 text-xs"><SelectValue placeholder="Capitulo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los capitulos</SelectItem>
                {Object.keys(byChapter).map(ch => <SelectItem key={ch} value={ch}>{ch}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterCompliance} onValueChange={setFilterCompliance}>
              <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue placeholder="Estado" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="compliant">Cumple</SelectItem>
                <SelectItem value="non_compliant">No cumple</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-xs text-[#94A3B8] ml-2">{filteredStds.length} estandares</span>
          </div>

          {/* Standards List */}
          <div className="space-y-1">
            {filteredStds.map(std => (
              <StandardRow key={std.code} std={std} onToggle={handleToggleCompliant} onUpdate={handleUpdateStandard} company={company} />
            ))}
          </div>
        </TabsContent>

        {/* ===== TAB: CUMPLIMIENTO ===== */}
        <TabsContent value="compliance" className="space-y-4 mt-4">
          <ComplianceViews phva={phva} byChapter={byChapter} byResponsible={byResponsible} bySede={bySede} overall={overall} />
        </TabsContent>

        {/* ===== TAB: DECRETO 1072 ===== */}
        <TabsContent value="decreto" className="space-y-4 mt-4">
          <div>
            <h2 className="text-lg font-bold tracking-tight mb-1" style={{ fontFamily: 'Outfit' }}>Decreto 1072 de 2015 - Componentes SG-SST</h2>
            <p className="text-xs text-[#475569] mb-4">Mapeo de componentes obligatorios del SG-SST con estandares de la Res. 0312/2019</p>
          </div>
          <div className="space-y-2">
            {decreto.map(comp => (
              <Card key={comp.code} className="border border-[#E2E8F0] bg-white hover:border-[#0047AB]/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-[#0047AB] font-bold">{comp.article}</span>
                        <h3 className="text-sm font-semibold text-[#0F172A]">{comp.component}</h3>
                      </div>
                      <p className="text-xs text-[#475569]">{comp.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] text-[#94A3B8]">Estandares relacionados: </span>
                        {comp.related_standards.map(rs => (
                          <Badge key={rs} variant="outline" className="text-[10px]">{rs}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xl font-bold" style={{ fontFamily: 'JetBrains Mono', color: comp.compliance_percentage >= 80 ? '#2A9D8F' : comp.compliance_percentage >= 50 ? '#FFC300' : '#D90429' }}>
                        {comp.compliance_percentage}%
                      </p>
                      <p className="text-[10px] text-[#94A3B8]">{comp.compliant_count}/{comp.total_count}</p>
                      <Progress value={comp.compliance_percentage} className="mt-1 h-1 w-20" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ===== TAB: PLAN DE TRABAJO ===== */}
        <TabsContent value="plan" className="space-y-4 mt-4">
          <Card className="border border-[#E2E8F0] bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-[#94A3B8] uppercase font-medium">Avance del Plan Anual</p>
                <span className="font-mono text-sm font-bold" style={{ color: '#0047AB' }}>{progressPct}%</span>
              </div>
              <Progress value={progressPct} className="h-2" />
              <p className="text-[10px] text-[#94A3B8] mt-1">{completedAct} de {activities.length} actividades completadas</p>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Dialog open={showActDialog} onOpenChange={setShowActDialog}>
              <DialogTrigger asChild>
                <Button data-testid="add-activity-btn" className="text-xs" style={{ backgroundColor: '#0047AB' }}>
                  <Plus className="w-3 h-3 mr-1" /> Nueva Actividad
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle style={{ fontFamily: 'Outfit' }}>Nueva Actividad</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label className="text-xs font-semibold">Titulo</Label><Input data-testid="act-title-input" value={actForm.title} onChange={e => setActForm({...actForm, title: e.target.value})} className="mt-1" /></div>
                  <div><Label className="text-xs font-semibold">Descripcion</Label><Textarea value={actForm.description} onChange={e => setActForm({...actForm, description: e.target.value})} className="mt-1" /></div>
                  <div><Label className="text-xs font-semibold">Responsable</Label><Input value={actForm.responsible} onChange={e => setActForm({...actForm, responsible: e.target.value})} className="mt-1" /></div>
                  <div><Label className="text-xs font-semibold">Fecha limite</Label><Input data-testid="act-date-input" type="date" value={actForm.due_date} onChange={e => setActForm({...actForm, due_date: e.target.value})} className="mt-1" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-semibold">Categoria</Label>
                      <Select value={actForm.category} onValueChange={v => setActForm({...actForm, category: v})}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="policy">Politica</SelectItem>
                          <SelectItem value="training">Capacitacion</SelectItem>
                          <SelectItem value="inspection">Inspeccion</SelectItem>
                          <SelectItem value="emergency">Emergencia</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">Prioridad</Label>
                      <Select value={actForm.priority} onValueChange={v => setActForm({...actForm, priority: v})}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Baja</SelectItem>
                          <SelectItem value="medium">Media</SelectItem>
                          <SelectItem value="high">Alta</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button data-testid="save-activity-btn" onClick={handleAddActivity} className="w-full" style={{ backgroundColor: '#0047AB' }}>Crear Actividad</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-2">
            {activities.map(act => (
              <div key={act.activity_id} className="flex items-center gap-3 p-3 bg-white border border-[#E2E8F0] rounded-lg">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-xs font-medium text-[#0F172A] truncate">{act.title}</p>
                    <Badge variant={act.priority === 'high' ? 'destructive' : 'secondary'} className="text-[10px]">{act.priority}</Badge>
                    <Badge variant="outline" className="text-[10px]">{act.status}</Badge>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-[#94A3B8]">
                    <span>{act.responsible}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{act.due_date}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  {act.status !== 'completed' && (
                    <Button size="sm" variant="outline" className="text-[10px] h-7" onClick={() => handleUpdateActStatus(act, 'completed')}>
                      <CheckCircle className="w-3 h-3 mr-1" /> Completar
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="h-7 text-red-500" onClick={() => handleDeleteActivity(act.activity_id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ===== STANDARD ROW COMPONENT =====
function StandardRow({ std, onToggle, onUpdate, company }) {
  const { canWrite } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [evidence, setEvidence] = useState(std.evidence_uploaded || '');
  const [observations, setObservations] = useState(std.observations || '');
  const [responsible, setResponsible] = useState(std.responsible || '');
  const [sede, setSede] = useState(std.sede || '');
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState(std.evidence_files || []);

  const handleSave = () => {
    onUpdate(std.code, { evidence_uploaded: evidence, observations, responsible, sede, evidence_files: files });
    toast.success('Actualizado');
    setExpanded(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await API.post('/files/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      const newFile = { file_id: res.data.file_id, filename: res.data.original_filename, uploaded_at: new Date().toISOString() };
      const updatedFiles = [...files, newFile];
      setFiles(updatedFiles);
      onUpdate(std.code, { evidence_files: updatedFiles });
      toast.success(`Archivo "${file.name}" subido`);
    } catch (err) {
      toast.error('Error al subir archivo');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (fileId, filename) => {
    try {
      const res = await API.get(`/files/${fileId}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch { toast.error('Error al descargar'); }
  };

  return (
    <div className={`border rounded-lg bg-white transition-all ${std.compliant ? 'border-[#2A9D8F]/30' : 'border-[#E2E8F0]'}`}>
      <div className="flex items-center gap-3 p-3 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <Checkbox
          data-testid={`std-check-${std.code}`}
          checked={std.compliant}
          disabled={!canWrite}
          onCheckedChange={(e) => { e.stopPropagation?.(); onToggle(std.code, std.compliant); }}
          onClick={(e) => e.stopPropagation()}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-[#0047AB]">{std.code}</span>
            <Badge variant="outline" className="text-[10px]" style={{ borderColor: PHVA_COLORS[std.phva], color: PHVA_COLORS[std.phva] }}>{std.phva}</Badge>
            <span className="text-[10px] font-mono text-[#94A3B8]">{std.weight} pts</span>
            {files.length > 0 && <Badge className="bg-[#2A9D8F] text-white text-[10px]"><FileIcon className="w-2 h-2 mr-0.5" />{files.length}</Badge>}
          </div>
          <p className="text-xs font-medium text-[#0F172A] mt-0.5">{std.description}</p>
          <p className="text-[10px] text-[#475569] line-clamp-1">{std.detail}</p>
        </div>
        {std.compliant ? <CheckCircle className="w-4 h-4 text-[#2A9D8F] flex-shrink-0" /> : <XCircle className="w-4 h-4 text-[#D90429] flex-shrink-0" />}
      </div>
      {expanded && (
        <div className="px-3 pb-3 border-t border-[#E2E8F0] pt-3 space-y-2">
          <p className="text-[10px] text-[#475569]"><span className="font-semibold">Evidencia requerida:</span> {std.evidence}</p>
          <p className="text-[10px] text-[#475569]"><span className="font-semibold">Estandar:</span> {std.standard} &gt; {std.subestandar}</p>

          {canWrite ? (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div><Label className="text-[10px] font-semibold">Responsable</Label><Input value={responsible} onChange={e => setResponsible(e.target.value)} className="h-7 text-xs mt-0.5" /></div>
                <div>
                  <Label className="text-[10px] font-semibold">Sede</Label>
                  <Select value={sede} onValueChange={setSede}>
                    <SelectTrigger className="h-7 text-xs mt-0.5"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      {(company?.sedes || ['Sede Principal']).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label className="text-[10px] font-semibold">Evidencia cargada</Label><Input value={evidence} onChange={e => setEvidence(e.target.value)} placeholder="Describe la evidencia aportada..." className="h-7 text-xs mt-0.5" /></div>

              {/* File Upload */}
              <div>
                <Label className="text-[10px] font-semibold">Archivos de Evidencia</Label>
                <div className="flex items-center gap-2 mt-1">
                  <label className="flex items-center gap-1 px-3 py-1.5 bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg cursor-pointer hover:bg-[#E2E8F0] transition-colors">
                    <Upload className="w-3 h-3 text-[#0047AB]" />
                    <span className="text-[10px] font-medium text-[#0047AB]">{uploading ? 'Subiendo...' : 'Subir Archivo'}</span>
                    <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} data-testid={`upload-evidence-${std.code}`} />
                  </label>
                </div>
                {files.length > 0 && (
                  <div className="mt-1 space-y-1">
                    {files.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 text-[10px] p-1 bg-[#F8F9FA] rounded">
                        <FileIcon className="w-3 h-3 text-[#0047AB]" />
                        <span className="flex-1 truncate">{f.filename}</span>
                        <button onClick={() => handleDownload(f.file_id, f.filename)} className="text-[#0047AB] hover:underline">
                          <Download className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div><Label className="text-[10px] font-semibold">Observaciones</Label><Textarea value={observations} onChange={e => setObservations(e.target.value)} className="text-xs h-16 mt-0.5" /></div>
              <Button size="sm" className="text-xs h-7" style={{ backgroundColor: '#0047AB' }} onClick={handleSave}>Guardar Cambios</Button>
            </>
          ) : (
            <div className="text-xs text-[#94A3B8] p-2 bg-[#F8F9FA] rounded">
              Solo lectura - No tienes permisos para editar
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ===== COMPLIANCE VIEWS COMPONENT =====
function ComplianceViews({ phva, byChapter, byResponsible, bySede, overall }) {
  const phvaData = Object.entries(phva).map(([key, val]) => ({ name: key, percentage: val.percentage, compliant: val.compliant, total: val.total, fill: PHVA_COLORS[key] }));
  const chapterData = Object.entries(byChapter).map(([key, val]) => ({ name: key.length > 18 ? key.substring(0, 18) + '...' : key, fullName: key, percentage: val.percentage, compliant: val.compliant, total: val.total }));
  const responsibleData = Object.entries(byResponsible).map(([key, val]) => ({ name: key, percentage: val.percentage, compliant: val.compliant, total: val.total }));
  const sedeData = Object.entries(bySede).map(([key, val]) => ({ name: key, percentage: val.percentage, compliant: val.compliant, total: val.total }));

  const pieData = [
    { name: 'Cumple', value: overall.compliant_weight || 0, fill: '#2A9D8F' },
    { name: 'No cumple', value: (overall.total_weight || 0) - (overall.compliant_weight || 0), fill: '#E2E8F0' }
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* PHVA Compliance */}
        <Card className="border border-[#E2E8F0] bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold" style={{ fontFamily: 'Outfit' }}>Cumplimiento por Ciclo PHVA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={phvaData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#475569' }} width={80} />
                  <Tooltip formatter={(v) => `${v}%`} />
                  <Bar dataKey="percentage" radius={[0, 4, 4, 0]}>
                    {phvaData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {phvaData.map(p => (
                <div key={p.name} className="text-center">
                  <div className="w-3 h-3 rounded-full mx-auto mb-0.5" style={{ backgroundColor: p.fill }} />
                  <p className="text-[10px] font-medium">{p.name}</p>
                  <p className="text-[10px] text-[#94A3B8]">{p.compliant}/{p.total}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Overall Score */}
        <Card className="border border-[#E2E8F0] bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold" style={{ fontFamily: 'Outfit' }}>Puntaje Global Res. 0312</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-52 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" startAngle={90} endAngle={-270}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip formatter={(v) => `${v} pts`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center -mt-4">
              <p className="text-3xl font-bold" style={{ fontFamily: 'JetBrains Mono', color: overall.score >= 86 ? '#2A9D8F' : overall.score >= 60 ? '#FFC300' : '#D90429' }}>
                {overall.score || 0}
              </p>
              <p className="text-xs text-[#475569]">
                {overall.score >= 86 ? 'Aceptable' : overall.score >= 60 ? 'Moderadamente aceptable' : 'Critico'} - Res. 0312/2019
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* By Chapter */}
      <Card className="border border-[#E2E8F0] bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold" style={{ fontFamily: 'Outfit' }}>Cumplimiento por Capitulo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chapterData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#475569' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v) => `${v}%`} labelFormatter={(l) => chapterData.find(c => c.name === l)?.fullName || l} />
                <Bar dataKey="percentage" fill="#0047AB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* By Responsible & Sede */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border border-[#E2E8F0] bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold" style={{ fontFamily: 'Outfit' }}>Por Responsable</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {responsibleData.map(r => (
                <div key={r.name}>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-[#0F172A] font-medium truncate">{r.name}</span>
                    <span className="font-mono text-[#0047AB]">{r.percentage}% ({r.compliant}/{r.total})</span>
                  </div>
                  <Progress value={r.percentage} className="h-1.5" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="border border-[#E2E8F0] bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold" style={{ fontFamily: 'Outfit' }}>Por Sede / Proceso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sedeData.map(s => (
                <div key={s.name}>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-[#0F172A] font-medium truncate">{s.name}</span>
                    <span className="font-mono text-[#0047AB]">{s.percentage}% ({s.compliant}/{s.total})</span>
                  </div>
                  <Progress value={s.percentage} className="h-1.5" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
