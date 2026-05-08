import React, { useState, useEffect, useCallback } from 'react';
import API from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, Send, Calendar, AlertTriangle, CheckCircle, Clock, Mail } from 'lucide-react';
import { toast } from 'sonner';

export default function AlertsConfig() {
  const [config, setConfig] = useState(null);
  const [logs, setLogs] = useState([]);
  const [sending, setSending] = useState(false);
  const [sendingSummary, setSendingSummary] = useState(false);
  const [daysConfig, setDaysConfig] = useState('5,3,1,0');

  const fetchConfig = useCallback(async () => {
    try {
      const res = await API.get('/alerts/config');
      setConfig(res.data.config);
      setLogs(res.data.recent_logs || []);
      setDaysConfig((res.data.config?.days_before || [5, 3, 1, 0]).join(','));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  const handleSendAlerts = async () => {
    setSending(true);
    try {
      const days = daysConfig.split(',').map(d => parseInt(d.trim())).filter(d => !isNaN(d));
      const res = await API.post('/alerts/send-plan-alerts', { days_before: days });
      toast.success(res.data.message);
      fetchConfig();
    } catch (err) { toast.error(err.response?.data?.detail || 'Error al enviar alertas'); }
    finally { setSending(false); }
  };

  const handleSendSummary = async () => {
    setSendingSummary(true);
    try {
      const res = await API.post('/alerts/send-weekly-summary', {});
      toast.success(res.data.message);
      fetchConfig();
    } catch (err) { toast.error(err.response?.data?.detail || 'Error'); }
    finally { setSendingSummary(false); }
  };

  const handleSaveConfig = async () => {
    try {
      const days = daysConfig.split(',').map(d => parseInt(d.trim())).filter(d => !isNaN(d));
      await API.put('/alerts/config', { days_before: days, enabled: true });
      toast.success('Configuracion guardada');
      fetchConfig();
    } catch (err) { toast.error(err.response?.data?.detail || 'Error'); }
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="alerts-page">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Outfit' }}>Alertas por Email</h1>
        <p className="text-sm text-[#475569] mt-1">Configura y envia alertas de planes de accion proximos a vencer</p>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-2 border-[#F97316]/20 bg-[#F97316]/5">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-[#F97316] flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold">Enviar Alertas de Planes</h3>
                <p className="text-[10px] text-[#475569]">Envia email a responsables SST con planes vencidos y proximos a vencer</p>
              </div>
            </div>
            <Button data-testid="send-alerts-btn" onClick={handleSendAlerts} disabled={sending} className="w-full" style={{ backgroundColor: '#F97316' }}>
              <Send className="w-4 h-4 mr-2" />{sending ? 'Enviando...' : 'Enviar Alertas Ahora'}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-2 border-[#1F3C5E]/20 bg-[#1F3C5E]/5">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-[#1F3C5E] flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold">Resumen Semanal</h3>
                <p className="text-[10px] text-[#475569]">Envia resumen consolidado de todas las empresas a admin/owner</p>
              </div>
            </div>
            <Button data-testid="send-summary-btn" onClick={handleSendSummary} disabled={sendingSummary} className="w-full" style={{ backgroundColor: '#1F3C5E' }}>
              <Mail className="w-4 h-4 mr-2" />{sendingSummary ? 'Enviando...' : 'Enviar Resumen Semanal'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Configuration */}
      <Card className="border border-[#E2E8F0] bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold" style={{ fontFamily: 'Outfit' }}>
            <Bell className="w-4 h-4 inline mr-1" /> Configuracion de Alertas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs font-semibold">Dias antes del vencimiento para alertar</Label>
            <p className="text-[10px] text-[#94A3B8] mb-1">Separe con comas los dias. Ej: 5,3,1,0 (5 dias antes, 3 dias, 1 dia, el mismo dia)</p>
            <div className="flex gap-2">
              <input
                type="text" value={daysConfig}
                onChange={e => setDaysConfig(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                placeholder="5,3,1,0"
                data-testid="days-config"
              />
              <Button onClick={handleSaveConfig} style={{ backgroundColor: '#0047AB' }}>Guardar</Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {daysConfig.split(',').map((d, i) => {
              const num = parseInt(d.trim());
              if (isNaN(num)) return null;
              return <Badge key={i} className="bg-[#F97316]/10 text-[#F97316] text-xs">{num === 0 ? 'El mismo dia' : `${num} dias antes`}</Badge>;
            })}
          </div>
          <div className="p-3 bg-[#F8F9FA] rounded text-xs text-[#475569] space-y-1">
            <p><b>Destinatarios alertas:</b> Responsables SST (owner, admin, sgsst_manager)</p>
            <p><b>Destinatarios resumen:</b> Owner y Admins</p>
            <p><b>Contenido:</b> Planes vencidos (rojo), vencen hoy (naranja), proximos a vencer (amarillo)</p>
          </div>
        </CardContent>
      </Card>

      {/* Alert History */}
      <Card className="border border-[#E2E8F0] bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold" style={{ fontFamily: 'Outfit' }}>
            <Clock className="w-4 h-4 inline mr-1" /> Historial de Envios
          </CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-xs text-[#94A3B8] text-center py-4">No hay envios registrados</p>
          ) : (
            <div className="space-y-2">
              {logs.map((log, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-[#F8F9FA] rounded text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-[#2A9D8F]" />
                    <span className="font-medium">{log.type === 'weekly_summary' ? 'Resumen Semanal' : 'Alertas de Planes'}</span>
                    <span className="text-[#94A3B8]">por {log.triggered_by}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[#94A3B8]">{log.sent} emails</span>
                    {log.overdue > 0 && <Badge className="bg-[#D90429] text-white text-[9px]">{log.overdue} vencidos</Badge>}
                    {log.upcoming > 0 && <Badge className="bg-[#FFC300] text-[#0F172A] text-[9px]">{log.upcoming} proximos</Badge>}
                    <span className="text-[10px] text-[#94A3B8]">{log.created_at?.split('T')[0]}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
