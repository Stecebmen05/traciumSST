import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '@/lib/api';
import { Bell, Check, X, ClipboardList, ExternalLink, Loader2 } from 'lucide-react';

const TYPE_ICON = {
  action_plan_created: ClipboardList,
  action_plan_updated: ClipboardList,
  action_plan_follow_up: ClipboardList,
  action_plan_closed: ClipboardList,
};
const TYPE_COLOR = {
  action_plan_created: '#0047AB',
  action_plan_updated: '#F97316',
  action_plan_follow_up: '#8B5CF6',
  action_plan_closed: '#2A9D8F',
};

const formatRelative = (iso) => {
  if (!iso) return '';
  const dt = new Date(iso);
  const diff = (Date.now() - dt.getTime()) / 1000;
  if (diff < 60) return 'hace segundos';
  if (diff < 3600) return `hace ${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `hace ${Math.floor(diff / 86400)}d`;
  return dt.toLocaleDateString('es-CO');
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const ref = useRef(null);
  const lastUnreadRef = useRef(0);

  const fetchItems = useCallback(async (showToast = false) => {
    try {
      const res = await API.get('/notifications', { params: { limit: 20 } });
      setItems(res.data.items || []);
      const newUnread = res.data.unread_count || 0;
      if (showToast && newUnread > lastUnreadRef.current) {
        // Subtle browser title flash
        document.title = `(${newUnread}) TraciumSST`;
      } else if (newUnread === 0) {
        document.title = 'TraciumSST';
      }
      lastUnreadRef.current = newUnread;
      setUnread(newUnread);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchItems();
    const id = setInterval(() => fetchItems(true), 30000);
    return () => clearInterval(id);
  }, [fetchItems]);

  // Close on outside click
  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const markRead = async (id) => {
    try { await API.put(`/notifications/${id}/read`); fetchItems(); } catch { /* ignore */ }
  };

  const markAllRead = async () => {
    setLoading(true);
    try { await API.post('/notifications/mark-all-read'); fetchItems(); } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const goTo = async (item) => {
    if (!item.read) await markRead(item.notification_id);
    setOpen(false);
    if (item.link) navigate(item.link);
  };

  const removeOne = async (id, e) => {
    e.stopPropagation();
    try { await API.delete(`/notifications/${id}`); fetchItems(); } catch { /* ignore */ }
  };

  return (
    <div ref={ref} className="relative">
      <button
        data-testid="notif-bell-btn"
        onClick={() => setOpen(o => !o)}
        className="p-2 rounded-lg hover:bg-[#F1F5F9] transition-colors relative"
        aria-label="Notificaciones"
      >
        <Bell className="w-5 h-5 text-[#475569]" />
        {unread > 0 && (
          <span data-testid="notif-bell-badge" className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-[#D90429] text-white text-[9px] font-bold flex items-center justify-center">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div data-testid="notif-panel" className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-[#E2E8F0] z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#0047AB] to-[#1F3C5E] text-white">
            <div>
              <p className="text-sm font-semibold" style={{ fontFamily: 'Outfit, sans-serif' }}>Notificaciones</p>
              <p className="text-[10px] opacity-80">{unread > 0 ? `${unread} sin leer` : 'Todo al dia'}</p>
            </div>
            {unread > 0 && (
              <button
                data-testid="notif-mark-all-read"
                onClick={markAllRead}
                disabled={loading}
                className="text-[10px] hover:underline flex items-center gap-1"
              >
                {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                Marcar leidas
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[24rem] overflow-y-auto">
            {items.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <Bell className="w-10 h-10 text-[#CBD5E1] mx-auto mb-2" />
                <p className="text-xs text-[#94A3B8]">Sin notificaciones</p>
              </div>
            ) : items.map(it => {
              const Icon = TYPE_ICON[it.type] || Bell;
              const color = TYPE_COLOR[it.type] || '#94A3B8';
              return (
                <div
                  key={it.notification_id}
                  data-testid={`notif-item-${it.notification_id}`}
                  onClick={() => goTo(it)}
                  className={`px-4 py-3 border-b border-[#F1F5F9] last:border-0 cursor-pointer hover:bg-[#F8F9FA] transition-colors ${!it.read ? 'bg-[#0047AB]/5' : ''}`}
                >
                  <div className="flex items-start gap-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: `${color}15`, color }}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <p className="text-xs font-semibold text-[#0F172A] truncate">{it.title}</p>
                        {!it.read && <span className="w-1.5 h-1.5 rounded-full bg-[#D90429] flex-shrink-0" />}
                      </div>
                      <p className="text-[11px] text-[#475569] line-clamp-2">{it.message}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[9px] text-[#94A3B8] uppercase font-mono">{formatRelative(it.created_at)}</span>
                        {it.link && <ExternalLink className="w-3 h-3 text-[#94A3B8]" />}
                      </div>
                    </div>
                    <button
                      onClick={(e) => removeOne(it.notification_id, e)}
                      className="p-1 rounded hover:bg-[#F1F5F9] text-[#94A3B8] flex-shrink-0"
                      aria-label="Eliminar"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {items.length > 0 && (
            <div className="px-4 py-2 border-t border-[#E2E8F0] bg-[#F8F9FA] text-center">
              <p className="text-[10px] text-[#94A3B8]">Auto-actualiza cada 30s</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
