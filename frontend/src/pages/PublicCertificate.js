import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle2, Shield, Award, ExternalLink, Mail, Phone, Sparkles, Loader2, AlertCircle, X, Send } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function PublicCertificate() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', company: '', whatsapp: '', email: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const submitLead = async () => {
    setSubmitError('');
    if (!form.name.trim() || (!form.whatsapp.trim() && !form.email.trim())) {
      setSubmitError('Nombre y (WhatsApp o Email) son obligatorios');
      return;
    }
    setSubmitting(true);
    try {
      await axios.post(`${BACKEND_URL}/api/public/certificate/${token}/lead`, form);
      setSubmitted(true);
    } catch (e) {
      setSubmitError(e.response?.data?.detail || 'Error al enviar');
    }
    setSubmitting(false);
  };

  const closeForm = () => {
    setShowForm(false);
    setTimeout(() => {
      setSubmitted(false);
      setForm({ name: '', company: '', whatsapp: '', email: '', message: '' });
      setSubmitError('');
    }, 300);
  };

  useEffect(() => {
    axios.get(`${BACKEND_URL}/api/public/certificate/${token}`)
      .then(r => setData(r.data))
      .catch(e => setError(e.response?.data?.detail || 'Certificado no disponible'))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
      <Loader2 className="w-8 h-8 text-[#0047AB] animate-spin" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-6">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center border border-[#FCA5A5]">
        <AlertCircle className="w-12 h-12 text-[#D90429] mx-auto mb-3" />
        <h2 className="text-lg font-bold text-[#0F172A]" style={{ fontFamily: 'Outfit' }}>Certificado no disponible</h2>
        <p className="text-sm text-[#64748B] mt-1">{error}</p>
      </div>
    </div>
  );

  const pct = data.compliance_pct;
  const level = pct >= 85 ? { label: 'EXCELENTE', color: '#2A9D8F', bg: '#DCFCE7' } : pct >= 65 ? { label: 'SATISFACTORIO', color: '#0047AB', bg: '#DBEAFE' } : { label: 'EN MEJORA', color: '#F97316', bg: '#FED7AA' };
  const riskLabel = ['', 'I', 'II', 'III', 'IV', 'V'][data.risk_level] || 'II';
  const portfolioUrl = data.consultant?.portfolio_url || 'https://portal-estrategico.preview.emergentagent.com/';

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] via-[#EFF6FF] to-[#F5F3FF] py-8 px-4" data-testid="public-certificate">
      <div className="max-w-3xl mx-auto">
        {/* Certificate Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-[#E2E8F0]">
          {/* Header with brand */}
          <div className="bg-gradient-to-r from-[#1F3C5E] via-[#0047AB] to-[#7C3AED] p-6 text-white relative">
            <div className="absolute top-3 right-3 bg-white/15 backdrop-blur rounded-full px-3 py-1 text-[10px] font-semibold tracking-wide">TraciumSST - Verificable</div>
            <div className="flex items-center gap-3 mb-2">
              <Award className="w-8 h-8" />
              <div>
                <p className="text-[10px] uppercase tracking-widest opacity-80">Certificado de Conformidad</p>
                <h1 className="text-2xl font-bold" style={{ fontFamily: 'Outfit' }}>Inspeccion General SG-SST</h1>
              </div>
            </div>
            <p className="text-[11px] opacity-80 mt-1">Anexo Tecnico MinTrabajo V1.0 - Resolucion 0312/2019 - Decreto 1072/2015</p>
          </div>

          {/* Company block */}
          <div className="p-8 border-b border-[#E2E8F0]">
            <div className="flex items-center gap-4 mb-6">
              {data.company_logo ? (
                <img src={data.company_logo.startsWith('data:') ? data.company_logo : `data:image/png;base64,${data.company_logo}`} alt="logo" className="w-16 h-16 object-contain rounded-lg border border-[#E2E8F0] bg-white" />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-[#F1F5F9] flex items-center justify-center border border-[#E2E8F0]">
                  <Shield className="w-8 h-8 text-[#94A3B8]" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-[#94A3B8] uppercase tracking-wide">Emitido a</p>
                <h2 className="text-xl font-bold text-[#0F172A]" style={{ fontFamily: 'Outfit' }}>{data.company_name || 'Empresa Verificada'}</h2>
                <p className="text-xs text-[#64748B] mt-0.5">Nivel de riesgo laboral: <span className="font-semibold text-[#0F172A]">{riskLabel}</span> - {data.tier_label}</p>
              </div>
            </div>

            {/* Big compliance number */}
            <div className="rounded-xl p-6 flex items-center justify-between" style={{ backgroundColor: level.bg }}>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: level.color }}>Nivel de Cumplimiento</p>
                <p className="text-6xl font-black leading-none mt-1" style={{ fontFamily: 'Outfit', color: level.color }}>{pct}%</p>
                <p className="text-sm font-bold mt-1" style={{ color: level.color }}>{level.label}</p>
              </div>
              <div className="text-right">
                <div className="text-[11px] text-[#0F172A]">
                  <p><span className="font-semibold">{data.items_cumple}</span> estandares cumplidos</p>
                  <p><span className="font-semibold">{data.items_no_cumple}</span> en mejora</p>
                  <p><span className="font-semibold">{data.items_total}</span> estandares evaluados</p>
                </div>
              </div>
            </div>
          </div>

          {/* Category breakdown */}
          <div className="p-8 bg-[#F8FAFC]">
            <h3 className="text-sm font-bold text-[#1F3C5E] mb-4 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Desglose por categoria</h3>
            <div className="space-y-3">
              {data.categories.map((c, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-[#0F172A]">{c.name}</span>
                    <span className="font-bold" style={{ color: c.compliance_pct >= 85 ? '#2A9D8F' : c.compliance_pct >= 65 ? '#0047AB' : '#F97316' }}>{c.compliance_pct}%</span>
                  </div>
                  <div className="w-full h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
                    <div className="h-full transition-all" style={{ width: `${c.compliance_pct}%`, backgroundColor: c.compliance_pct >= 85 ? '#2A9D8F' : c.compliance_pct >= 65 ? '#0047AB' : '#F97316' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Consultant / CTA */}
          <div className="p-8 border-t border-[#E2E8F0] bg-white">
            <p className="text-[10px] uppercase tracking-widest text-[#94A3B8] font-semibold mb-2">Verificacion realizada por</p>
            <h3 className="text-lg font-bold text-[#1F3C5E]" style={{ fontFamily: 'Outfit' }}>{data.consultant.name}</h3>
            <p className="text-xs text-[#64748B] leading-relaxed">{data.consultant.title}</p>
            <div className="flex gap-3 mt-3 flex-wrap text-[11px] text-[#475569]">
              <a href={`tel:${data.consultant.phone}`} className="flex items-center gap-1 hover:text-[#0047AB]"><Phone className="w-3 h-3" /> {data.consultant.phone}</a>
              <a href={`mailto:${data.consultant.email}`} className="flex items-center gap-1 hover:text-[#0047AB]"><Mail className="w-3 h-3" /> {data.consultant.email}</a>
            </div>

            <button onClick={() => setShowForm(true)} className="mt-5 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#0047AB] to-[#7C3AED] text-white text-sm font-bold hover:scale-105 transition-transform shadow-lg cursor-pointer" data-testid="cta-portfolio">
              <Sparkles className="w-4 h-4" /> Solicita tu propia auditoria SG-SST
              <Send className="w-4 h-4" />
            </button>
            <p className="text-[10px] text-[#94A3B8] mt-3 italic">Grow human. Lead better.</p>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-[#E2E8F0] bg-[#F1F5F9] text-center">
            <p className="text-[9px] text-[#94A3B8]">
              Certificado emitido el {(data.issued_at || '').slice(0, 10)} - Valido hasta {(data.expires_at || '').slice(0, 10)}
            </p>
            <p className="text-[9px] text-[#94A3B8] mt-0.5">
              Documento generado por TraciumSST. Este certificado refleja el resultado de una autoevaluacion asistida y no constituye acreditacion oficial MinTrabajo.
            </p>
          </div>
        </div>
      </div>

      {/* Lead form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={closeForm} data-testid="lead-form-modal">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            {!submitted ? (
              <>
                <div className="bg-gradient-to-r from-[#0047AB] to-[#7C3AED] p-5 text-white flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest opacity-80">Contactame</p>
                    <h3 className="text-lg font-bold" style={{ fontFamily: 'Outfit' }}>Solicita tu auditoria SG-SST</h3>
                  </div>
                  <button onClick={closeForm} className="p-1 rounded-full hover:bg-white/15" data-testid="close-lead-form">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-5 space-y-3">
                  <p className="text-xs text-[#64748B] leading-relaxed">
                    Dejame tus datos y me pongo en contacto contigo en menos de 24 horas. <b>Stephania Ceballos</b> - Psicologa, Especialista SST, Auditora HSEQ.
                  </p>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#0F172A] mb-1">Nombre completo *</label>
                    <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 text-sm border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0047AB]/30" placeholder="Tu nombre" data-testid="lead-name" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#0F172A] mb-1">Empresa</label>
                    <input type="text" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} className="w-full px-3 py-2 text-sm border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0047AB]/30" placeholder="Nombre de tu empresa" data-testid="lead-company" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#0F172A] mb-1">WhatsApp *</label>
                      <input type="tel" value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} className="w-full px-3 py-2 text-sm border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0047AB]/30" placeholder="+57 300 000 0000" data-testid="lead-whatsapp" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#0F172A] mb-1">Email</label>
                      <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 text-sm border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0047AB]/30" placeholder="tu@email.com" data-testid="lead-email" />
                    </div>
                  </div>
                  <p className="text-[10px] text-[#94A3B8]">* WhatsApp o Email son obligatorios (al menos uno).</p>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#0F172A] mb-1">Cuentame brevemente</label>
                    <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} rows="3" className="w-full px-3 py-2 text-sm border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0047AB]/30" placeholder="Ej: Somos 25 trabajadores en construccion, necesitamos preparar auditoria SG-SST..." data-testid="lead-message" />
                  </div>
                  {submitError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-2 rounded flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" /> {submitError}
                    </div>
                  )}
                  <button onClick={submitLead} disabled={submitting} className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-[#0047AB] to-[#7C3AED] text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-60" data-testid="lead-submit">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {submitting ? 'Enviando...' : 'Contactar a Stephania'}
                  </button>
                  <p className="text-[10px] text-[#94A3B8] text-center">Tus datos se usan solo para responderte. No comparto informacion con terceros.</p>
                </div>
              </>
            ) : (
              <div className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-[#DCFCE7] flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-8 h-8 text-[#2A9D8F]" />
                </div>
                <h3 className="text-lg font-bold text-[#0F172A]" style={{ fontFamily: 'Outfit' }}>Gracias!</h3>
                <p className="text-sm text-[#64748B] mt-2 leading-relaxed">
                  He recibido tu mensaje y me pondre en contacto contigo en menos de 24 horas.
                </p>
                <p className="text-xs text-[#94A3B8] mt-3 italic">- Stephania Ceballos</p>
                <div className="flex gap-2 justify-center mt-5 flex-wrap">
                  <a href={portfolioUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#7C3AED] text-[#7C3AED] text-xs font-semibold hover:bg-[#7C3AED] hover:text-white transition-colors" data-testid="lead-visit-portfolio">
                    <ExternalLink className="w-3.5 h-3.5" /> Ver portafolio
                  </a>
                  <button onClick={closeForm} className="px-4 py-2 rounded-lg bg-[#F1F5F9] text-[#64748B] text-xs font-semibold hover:bg-[#E2E8F0]" data-testid="lead-close">
                    Cerrar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
