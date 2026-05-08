import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileBarChart, FileSpreadsheet, Download } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function Reports() {
  const handleDownload = async (type) => {
    try {
      const url = `${BACKEND_URL}/api/reports/${type}?report_type=general`;
      const link = document.createElement('a');
      link.href = url;
      link.download = `reporte_sgsst.${type === 'excel' ? 'xlsx' : 'pdf'}`;
      // For cookie-based auth, we open in new window
      window.open(url, '_blank');
      toast.success(`Descargando reporte ${type.toUpperCase()}`);
    } catch {
      toast.error('Error al descargar');
    }
  };

  const reportTypes = [
    {
      title: 'Reporte General SG-SST',
      description: 'Resumen ejecutivo con KPIs, incidentes, peligros y auditorias',
      formats: ['pdf', 'excel'],
    },
    {
      title: 'Reporte de Incidentes',
      description: 'Detalle de incidentes y accidentes con investigaciones',
      formats: ['excel'],
    },
    {
      title: 'Matriz de Peligros',
      description: 'Matriz IPER completa con valoracion de riesgos',
      formats: ['excel'],
    },
    {
      title: 'Reporte de Auditorias',
      description: 'Auditorias realizadas y hallazgos con seguimiento',
      formats: ['excel'],
    },
    {
      title: 'Plan de Capacitaciones',
      description: 'Programa anual de formacion y registro de asistencia',
      formats: ['excel'],
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in" data-testid="reports-page">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Outfit' }}>Reportes Inteligentes</h1>
        <p className="text-sm text-[#475569] mt-1">Genera reportes descargables para la gerencia y MinTrabajo</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reportTypes.map((report, i) => (
          <Card key={i} className="border border-[#E2E8F0] bg-white hover:-translate-y-0.5 transition-all duration-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-[#0F172A] flex items-center gap-2" style={{ fontFamily: 'Outfit' }}>
                <FileBarChart className="w-4 h-4 text-[#0047AB]" />
                {report.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-[#475569] mb-4">{report.description}</p>
              <div className="flex gap-2">
                {report.formats.includes('pdf') && (
                  <Button
                    data-testid={`download-pdf-${i}`}
                    variant="outline"
                    size="sm"
                    className="text-xs h-8"
                    onClick={() => handleDownload('pdf')}
                  >
                    <Download className="w-3 h-3 mr-1" />
                    PDF
                  </Button>
                )}
                {report.formats.includes('excel') && (
                  <Button
                    data-testid={`download-excel-${i}`}
                    variant="outline"
                    size="sm"
                    className="text-xs h-8"
                    onClick={() => handleDownload('excel')}
                  >
                    <FileSpreadsheet className="w-3 h-3 mr-1" />
                    Excel
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Info card */}
      <Card className="border border-[#E2E8F0] bg-[#F1F5F9]">
        <CardContent className="p-4">
          <p className="text-xs text-[#475569]">
            Los reportes se generan con datos reales del sistema. Para reportes mas completos, asegurate de mantener actualizada la informacion en todos los modulos del SG-SST.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
