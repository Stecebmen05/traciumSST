import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import API from '@/lib/api';
import {
  Plus, X, MessageCircle, Search, AlertTriangle, FileText, ClipboardList,
  Bell, Send, Sparkles, Bot, Trash2, Loader2, Database
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

const ALL_ACTIONS = [
  { id: 'audit', label: 'Nueva Auditoria', icon: Search, path: '/audits', color: '#0047AB', requires: 'canAuditWrite' },
  { id: 'incident', label: 'Reportar Incidente', icon: AlertTriangle, path: '/incidents', color: '#D90429', requires: null },
  { id: 'document', label: 'Subir Documento', icon: FileText, path: '/documents', color: '#2A9D8F', requires: 'canViewDocuments' },
  { id: 'plan', label: 'Plan de Accion', icon: ClipboardList, path: '/audits', color: '#F97316', requires: 'canAuditWrite' },
  { id: 'alerts', label: 'Ver Alertas', icon: Bell, path: '/alerts', color: '#8B5CF6', requires: 'canManageCompanies' },
];

const SUGGESTED_QUESTIONS = [
  'Cuales son los 60 estandares minimos de la Res. 0312?',
  'Que es el ciclo PHVA en el SG-SST?',
  'Que debe contener un PESV nivel basico?',
  'Como se clasifica el nivel de riesgo de una empresa?',
];

function ChatbotPanel({ open, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [includeContext, setIncludeContext] = useState(false);
  const [sessionId] = useState(() => {
    const existing = localStorage.getItem('tracium_chat_session');
    if (existing) return existing;
    const newId = `chat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem('tracium_chat_session', newId);
    return newId;
  });
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    // Load history on open
    API.get('/ai/chat/history', { params: { session_id: sessionId } })
      .then(r => setMessages(r.data.messages || []))
      .catch(() => setMessages([]));
  }, [open, sessionId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const content = (text || input).trim();
    if (!content || loading) return;
    setInput('');
    const userMsg = { role: 'user', content, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    try {
      const res = await API.post('/ai/chat', { message: content, session_id: sessionId, include_context: includeContext });
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.message, created_at: new Date().toISOString() }]);
    } catch (err) {
      const errMsg = err.response?.data?.detail || 'Error al consultar el asistente';
      setMessages(prev => [...prev, { role: 'assistant', content: `[Error] ${errMsg}`, created_at: new Date().toISOString() }]);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async () => {
    if (!window.confirm('Borrar el historial de esta conversacion?')) return;
    await API.delete('/ai/chat/history', { params: { session_id: sessionId } }).catch(() => {});
    setMessages([]);
  };

  if (!open) return null;

  return (
    <div
      data-testid="chatbot-panel"
      className="fixed bottom-24 right-4 md:right-6 w-[calc(100vw-2rem)] sm:w-96 h-[32rem] max-h-[80vh] bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] flex flex-col z-50 animate-fade-in overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#0047AB] to-[#1F3C5E] text-white flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ fontFamily: 'Outfit, sans-serif' }}>TraciumBot</p>
            <p className="text-[10px] opacity-80">Experto SG-SST y PESV</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            data-testid="chatbot-context-toggle"
            onClick={() => setIncludeContext(v => !v)}
            className={`px-2 py-1 rounded-md text-[10px] font-semibold flex items-center gap-1 transition-colors ${includeContext ? 'bg-[#2A9D8F] text-white' : 'bg-white/15 hover:bg-white/25 text-white'}`}
            title={includeContext ? 'Usando datos de tu empresa' : 'Activar datos en vivo'}
          >
            <Database className="w-3 h-3" />
            {includeContext ? 'En vivo' : 'Normativa'}
          </button>
          <button
            data-testid="chatbot-clear-btn"
            onClick={clearHistory}
            className="p-1.5 rounded-lg hover:bg-white/15 transition-colors"
            title="Borrar conversacion"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            data-testid="chatbot-close-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/15 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F8F9FA]">
        {messages.length === 0 && (
          <div className="space-y-3">
            <div className="bg-white rounded-xl p-3 border border-[#E2E8F0]">
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-[#0047AB] mt-0.5 flex-shrink-0" />
                <p className="text-xs text-[#475569] leading-relaxed">
                  Hola! Soy tu experto en normativa SG-SST y PESV. Preguntame sobre el Decreto 1072, la Resolucion 0312 o el PESV Res. 40595.
                </p>
              </div>
            </div>
            <p className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wide px-1">Sugerencias</p>
            {SUGGESTED_QUESTIONS.map((q, i) => (
              <button
                key={i}
                data-testid={`chatbot-suggestion-${i}`}
                onClick={() => sendMessage(q)}
                className="w-full text-left text-xs p-2.5 rounded-lg bg-white border border-[#E2E8F0] hover:border-[#0047AB] hover:bg-[#0047AB]/5 transition-all text-[#0F172A]"
              >
                {q}
              </button>
            ))}
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              data-testid={`chatbot-message-${m.role}`}
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-[#0047AB] text-white rounded-br-sm'
                  : 'bg-white text-[#0F172A] border border-[#E2E8F0] rounded-bl-sm'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-[#E2E8F0] rounded-2xl rounded-bl-sm px-3 py-2 flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin text-[#0047AB]" />
              <span className="text-xs text-[#94A3B8]">Pensando...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-[#E2E8F0] bg-white flex-shrink-0">
        <div className="flex gap-2 items-end">
          <Textarea
            data-testid="chatbot-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Preguntame sobre normativa SG-SST..."
            className="text-xs min-h-[36px] max-h-20 resize-none border-[#E2E8F0] flex-1"
            rows={1}
          />
          <Button
            data-testid="chatbot-send-btn"
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            size="sm"
            className="h-9 w-9 p-0 flex-shrink-0"
            style={{ backgroundColor: '#0047AB' }}
          >
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>
        <p className="text-[9px] text-[#94A3B8] mt-1.5 text-center">
          Basado en Decreto 1072/2015, Res. 0312/2019 y Res. 40595/2022
        </p>
      </div>
    </div>
  );
}

export default function FloatingActions() {
  const [fabOpen, setFabOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const navigate = useNavigate();
  const perms = useAuth();

  const QUICK_ACTIONS = ALL_ACTIONS.filter(a => !a.requires || perms[a.requires]);

  const handleAction = (path) => {
    setFabOpen(false);
    navigate(path);
  };

  return (
    <>
      {/* Backdrop */}
      {fabOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 animate-fade-in"
          onClick={() => setFabOpen(false)}
        />
      )}

      {/* Quick Actions Menu */}
      {fabOpen && (
        <div
          data-testid="fab-menu"
          className="fixed bottom-44 right-4 md:right-6 flex flex-col items-end gap-2 z-50"
        >
          {QUICK_ACTIONS.map((action, i) => (
            <button
              key={action.id}
              data-testid={`fab-action-${action.id}`}
              onClick={() => handleAction(action.path)}
              className="flex items-center gap-2 bg-white rounded-full shadow-lg pl-3 pr-1 py-1 border border-[#E2E8F0] hover:-translate-x-1 transition-all animate-fade-in"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <span className="text-xs font-medium text-[#0F172A] whitespace-nowrap">{action.label}</span>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white flex-shrink-0"
                style={{ backgroundColor: action.color }}
              >
                <action.icon className="w-4 h-4" />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Chatbot Panel */}
      <ChatbotPanel open={chatOpen} onClose={() => setChatOpen(false)} />

      {/* Chatbot Button */}
      <button
        data-testid="chatbot-toggle-btn"
        onClick={() => { setChatOpen(!chatOpen); setFabOpen(false); }}
        className="fixed bottom-24 right-4 md:right-6 w-12 h-12 rounded-full shadow-lg flex items-center justify-center z-50 transition-all hover:scale-105"
        style={{
          background: chatOpen
            ? 'linear-gradient(135deg, #1F3C5E, #0F172A)'
            : 'linear-gradient(135deg, #0047AB, #1F3C5E)',
          color: 'white'
        }}
        title="Asistente TraciumBot"
      >
        {chatOpen ? <X className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
        {!chatOpen && (
          <span className="absolute top-0 right-0 w-3 h-3 rounded-full bg-[#2A9D8F] border-2 border-white animate-pulse" />
        )}
      </button>

      {/* FAB Main Button */}
      <button
        data-testid="fab-toggle-btn"
        onClick={() => { setFabOpen(!fabOpen); setChatOpen(false); }}
        className="fixed bottom-6 right-4 md:right-6 w-14 h-14 rounded-full shadow-xl flex items-center justify-center z-50 transition-all hover:scale-105"
        style={{
          background: fabOpen
            ? 'linear-gradient(135deg, #D90429, #9d091d)'
            : 'linear-gradient(135deg, #F97316, #D90429)',
          color: 'white'
        }}
        title="Acciones Rapidas"
      >
        <Plus className={`w-6 h-6 transition-transform duration-200 ${fabOpen ? 'rotate-45' : ''}`} />
      </button>
    </>
  );
}
