import { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      navigate('/admin');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full p-8 bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white">
        <h2 className="text-3xl font-extrabold text-center text-slate-900 mb-6">Portal do Doutor</h2>
        {error && <div className="text-red-500 mb-4 text-center">{error}</div>}
        <form onSubmit={handleLogin} className="space-y-6">
          <input 
            type="email" placeholder="Email do Admin" value={email} onChange={e => setEmail(e.target.value)} required
            className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500"
          />
          <input 
            type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} required
            className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500"
          />
          <button type="submit" disabled={loading} className="w-full bg-brand-600 text-white p-3 rounded-lg font-bold hover:bg-brand-700 transition">
            {loading ? 'Entrando...' : 'Acessar Consultório'}
          </button>
        </form>
      </div>
    </div>
  );
}
