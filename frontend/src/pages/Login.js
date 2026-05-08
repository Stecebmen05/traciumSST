import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import API from '@/lib/api';
import { toast } from 'sonner';

export default function Login() {
  const navigate = useNavigate();
  const { setUser, fetchContext } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError('Email y contraseña son obligatorios'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await API.post('/auth/login-email', { email, password });
      setUser(res.data);
      await fetchContext();
      toast.success(`Bienvenido, ${res.data.name}`);
      navigate('/dashboard', { replace: true, state: { user: res.data } });
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Error de autenticacion');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex" data-testid="login-page">
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-[#0047AB] flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>TraciumSST</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight" style={{ fontFamily: 'Outfit, sans-serif', color: '#0F172A' }}>Bienvenido</h1>
            <p className="text-base text-[#475569]">Plataforma integral de gestion, implementacion y auditoria del SG-SST</p>
          </div>

          {/* Email/Password Login */}
          <form onSubmit={handleEmailLogin} className="space-y-3">
            <div>
              <Label className="text-xs font-semibold">Correo electronico</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                <Input data-testid="login-email" type="email" value={email} onChange={e => setEmail(e.target.value)} className="pl-10" placeholder="usuario@empresa.com" />
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold">Contraseña</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                <Input data-testid="login-password" type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} className="pl-10 pr-10" placeholder="••••••••" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#0F172A]">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {error && <p className="text-xs text-[#D90429] bg-[#D90429]/5 p-2 rounded" data-testid="login-error">{error}</p>}
            <Button data-testid="login-submit" type="submit" disabled={loading} className="w-full h-11 text-sm font-medium" style={{ backgroundColor: '#0047AB' }}>
              {loading ? 'Ingresando...' : 'Iniciar Sesion'}
            </Button>
          </form>

          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-[#94A3B8]">o continua con</span>
            <Separator className="flex-1" />
          </div>

          <Button data-testid="login-google-btn" onClick={handleGoogleLogin} variant="outline" className="w-full h-11 text-sm font-medium">
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Iniciar sesion con Google
          </Button>

          <div className="pt-4 border-t border-[#E2E8F0]">
            <p className="text-sm text-[#94A3B8]">Cumplimiento del Decreto 1072 de 2015</p>
            <div className="flex gap-4 mt-2 text-xs text-[#94A3B8]">
              <span>Implementacion</span><span>Seguimiento</span><span>Auditoria</span><span>Mejora</span>
            </div>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 items-center justify-center relative overflow-hidden"
        style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1561518065-297fc6fdad7d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzNTl8MHwxfHNlYXJjaHwyfHxhYnN0cmFjdCUyMGdlb21ldHJpYyUyMGFyY2hpdGVjdHVyZSUyMGxpZ2h0fGVufDB8fHx8MTc3NjIxMzczMHww&ixlib=rb-4.1.0&q=85)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="absolute inset-0 bg-[#0047AB]/70" />
        <div className="relative z-10 max-w-md text-center text-white p-8">
          <Shield className="w-16 h-16 mx-auto mb-6 opacity-90" />
          <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>TraciumSST</h2>
          <p className="text-white/80 text-lg leading-relaxed">Gestiona integralmente tu Sistema de Gestion de Seguridad y Salud en el Trabajo</p>
        </div>
      </div>
    </div>
  );
}
