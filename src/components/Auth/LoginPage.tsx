import { useState, FormEvent } from 'react';
import { Shield, Loader2, Eye, EyeOff } from 'lucide-react';
import { loginApi } from '../../api/auth';
import { useAuthStore } from '../../store/useAuthStore';

export function LoginPage() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    setLoading(true);
    setError('');
    try {
      const data = await loginApi(username, password);
      setAuth(data.user, data.access_token);
    } catch (err) {
      setError((err as Error).message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo / branding */}
        <div className="flex flex-col items-center mb-8 gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
            <Shield size={22} className="text-blue-400" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-slate-100">QA Center</h1>
            <p className="text-xs text-slate-500 mt-0.5">Sign in to your account</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-slate-900 border border-slate-700/60 rounded-2xl p-6 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="analyst or supervisor"
                autoFocus
                className="w-full bg-slate-800 border border-slate-600/50 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-800 border border-slate-600/50 rounded-lg px-3 py-2 pr-9 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-400 bg-red-900/20 border border-red-800/40 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !username || !password}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold text-white transition-all"
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : null}
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          {/* Demo credentials hint */}
          <div className="mt-5 pt-4 border-t border-slate-800">
            <p className="text-[11px] text-slate-600 text-center mb-2">Demo accounts</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { user: 'analyst',    pass: 'analyst123',    label: 'QA Analyst'  },
                { user: 'supervisor', pass: 'supervisor123', label: 'Supervisor'   },
                { user: 'client',     pass: 'client123',     label: 'Client'       },
              ].map(({ user, pass, label }) => (
                <button
                  key={user}
                  type="button"
                  onClick={() => { setUsername(user); setPassword(pass); }}
                  className="text-left px-2.5 py-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/40 transition-all"
                >
                  <p className="text-[11px] font-medium text-slate-300">{label}</p>
                  <p className="text-[10px] text-slate-600 font-mono">{user}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
