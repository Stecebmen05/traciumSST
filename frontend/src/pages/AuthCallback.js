import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import API from '@/lib/api';
import { Button } from '@/components/ui/button';

export default function AuthCallback() {
  const hasProcessed = useRef(false);
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [error, setError] = useState(null);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const hash = window.location.hash;
    const sessionId = new URLSearchParams(hash.substring(1)).get('session_id');

    if (!sessionId) {
      navigate('/login', { replace: true });
      return;
    }

    (async () => {
      try {
        const res = await API.post('/auth/session', { session_id: sessionId });
        setUser(res.data);
        await API.get('/auth/me'); // Verify session is established
        try { await API.post('/seed'); } catch { /* ignore if already seeded */ }
        navigate('/dashboard', { replace: true, state: { user: res.data } });
      } catch (err) {
        console.error('Auth callback error:', err?.response?.status, err?.response?.data);
        // Auto-retry once after short delay (handles race conditions)
        try {
          await new Promise(r => setTimeout(r, 1000));
          const res2 = await API.post('/auth/session', { session_id: sessionId });
          setUser(res2.data);
          try { await API.post('/seed'); } catch { /* ignore */ }
          navigate('/dashboard', { replace: true, state: { user: res2.data } });
          return;
        } catch {
          setError('La sesion de autenticacion expiro o es invalida. Por favor intenta de nuevo.');
        }
      }
    })();
  }, [navigate, setUser]);

  const handleRetry = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]" data-testid="auth-error">
        <div className="text-center max-w-md space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto">
            <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
          </div>
          <p className="text-[#475569] font-medium">{error}</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={handleRetry} style={{ backgroundColor: '#0047AB' }} data-testid="auth-retry-btn">
              Reintentar
            </Button>
            <Button variant="outline" onClick={() => navigate('/login', { replace: true })} data-testid="auth-back-btn">
              Volver
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-[#0047AB] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[#475569] font-medium">Autenticando...</p>
      </div>
    </div>
  );
}
