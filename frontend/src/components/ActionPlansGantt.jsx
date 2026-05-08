import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, AlertCircle } from 'lucide-react';

const TYPE_COLORS = {
  corrective: '#D90429',
  preventive: '#F97316',
  improvement: '#2A9D8F',
};
const TYPE_LABELS = {
  corrective: 'Correctiva',
  preventive: 'Preventiva',
  improvement: 'Mejora',
};

function parseISO(d) {
  if (!d) return null;
  const dt = new Date(d.includes('T') ? d : `${d}T00:00:00`);
  return isNaN(dt.getTime()) ? null : dt;
}
const dayMs = 86400000;
const fmt = (d) => d ? d.toISOString().slice(0, 10) : 'N/A';

export default function ActionPlansGantt({ plans }) {
  const data = useMemo(() => {
    const items = (plans || [])
      .map(p => {
        const start = parseISO(p.start_date) || parseISO(p.created_at) || parseISO(p.due_date);
        const end = parseISO(p.due_date);
        if (!start || !end || end < start) return null;
        return { ...p, _start: start, _end: end };
      })
      .filter(Boolean)
      .sort((a, b) => a._start - b._start);
    if (!items.length) return null;
    const minDate = new Date(Math.min(...items.map(i => i._start.getTime())));
    const maxDate = new Date(Math.max(...items.map(i => i._end.getTime())));
    // Pad 5 days each side for breathing room
    minDate.setDate(minDate.getDate() - 3);
    maxDate.setDate(maxDate.getDate() + 3);
    const totalDays = Math.max(1, Math.round((maxDate - minDate) / dayMs));
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayPct = ((today - minDate) / dayMs) / totalDays * 100;
    // Month markers
    const months = [];
    const cur = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    while (cur <= maxDate) {
      const left = ((cur - minDate) / dayMs) / totalDays * 100;
      months.push({ label: cur.toLocaleDateString('es-CO', { month: 'short', year: '2-digit' }), left });
      cur.setMonth(cur.getMonth() + 1);
    }
    return { items, minDate, maxDate, totalDays, todayPct, months };
  }, [plans]);

  if (!data) return null;
  const { items, minDate, totalDays, todayPct, months } = data;
  const today = new Date(); today.setHours(0, 0, 0, 0);

  const overdueCount = items.filter(p => p.status !== 'closed' && p._end < today).length;
  const activeCount = items.filter(p => p.status !== 'closed').length;

  return (
    <Card className="border border-[#E2E8F0] bg-white" data-testid="action-plans-gantt">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2" style={{ fontFamily: 'Outfit', color: '#0F172A' }}>
            <CalendarDays className="w-4 h-4 text-[#0047AB]" />
            Cronograma de Planes (Gantt)
          </CardTitle>
          <div className="flex items-center gap-2 text-[10px]">
            <Badge variant="outline" className="text-[10px]">{items.length} en linea</Badge>
            <Badge className="bg-[#2A9D8F] text-white text-[10px]">{activeCount} activos</Badge>
            {overdueCount > 0 && (
              <Badge className="bg-[#D90429] text-white text-[10px]" data-testid="gantt-overdue-badge">
                <AlertCircle className="w-2.5 h-2.5 mr-0.5" /> {overdueCount} vencidos
              </Badge>
            )}
          </div>
        </div>
        {/* Legend */}
        <div className="flex items-center gap-3 text-[10px] text-[#475569] mt-1 flex-wrap">
          {Object.entries(TYPE_COLORS).map(([k, c]) => (
            <span key={k} className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded" style={{ backgroundColor: c }} />
              {TYPE_LABELS[k]}
            </span>
          ))}
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#D90429] inline-block" />
            Vencido
          </span>
          <span className="flex items-center gap-1 ml-auto">
            <span className="w-px h-3 bg-[#0047AB]" />
            Hoy
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-2 pb-3">
        {/* Month axis */}
        <div className="relative h-5 mb-1 border-b border-dashed border-[#E2E8F0]">
          {months.map((m, i) => {
            // Skip months that would overlap the left/right edges
            if (m.left < 4 || m.left > 96) return null;
            return (
              <div key={i} className="absolute top-0 text-[9px] text-[#94A3B8] uppercase font-mono tracking-wider" style={{ left: `${m.left}%` }}>
                <span className="-translate-x-1/2 inline-block">{m.label}</span>
              </div>
            );
          })}
        </div>
        {/* Gantt rows */}
        <div className="relative">
          {/* Today line */}
          {todayPct >= 0 && todayPct <= 100 && (
            <div
              className="absolute top-0 bottom-0 w-px bg-[#0047AB] z-10 pointer-events-none"
              style={{ left: `${todayPct}%` }}
              data-testid="gantt-today-line"
            />
          )}
          {items.map((p, i) => {
            const isOverdue = p.status !== 'closed' && p._end < today;
            const isClosed = p.status === 'closed';
            const left = Math.max(0, ((p._start - minDate) / dayMs) / totalDays * 100);
            const widthDays = Math.max(1, (p._end - p._start) / dayMs);
            const width = Math.max(2, widthDays / totalDays * 100);
            const color = TYPE_COLORS[p.action_type] || '#0047AB';
            return (
              <div key={p.plan_id} className="relative h-7 my-1.5 group" data-testid={`gantt-row-${p.plan_id}`}>
                {/* Track */}
                <div className="absolute inset-y-2 left-0 right-0 bg-[#F1F5F9] rounded-full" />
                {/* Bar */}
                <div
                  className="absolute inset-y-1 flex items-center px-2 rounded-full text-[10px] text-white font-medium overflow-hidden whitespace-nowrap shadow-sm group-hover:shadow-md transition-shadow cursor-default"
                  style={{
                    left: `${left}%`,
                    width: `${width}%`,
                    backgroundColor: isClosed ? '#94A3B8' : color,
                    opacity: isClosed ? 0.6 : 1,
                  }}
                  title={`${TYPE_LABELS[p.action_type] || p.action_type} | ${p.responsible || 'Sin resp.'} | ${fmt(p._start)} - ${fmt(p._end)}${isOverdue ? ' | VENCIDO' : ''}`}
                >
                  <span className="truncate">{p.responsible || 'Sin asignar'}</span>
                  {isOverdue && (
                    <span className="ml-auto pl-1.5 flex-shrink-0">
                      <span className="w-2 h-2 rounded-full bg-white block animate-pulse" />
                    </span>
                  )}
                </div>
                {/* Tooltip on hover */}
                <div className="absolute left-0 -top-1 z-20 bg-[#0F172A] text-white text-[10px] px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity" style={{ left: `min(${left}%, calc(100% - 250px))` }}>
                  <div className="font-semibold">{(p.action || '').substring(0, 80)}{(p.action || '').length > 80 ? '...' : ''}</div>
                  <div>{fmt(p._start)} → {fmt(p._end)} {isOverdue && <span className="text-[#FCA5A5]">· Vencido</span>}</div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
