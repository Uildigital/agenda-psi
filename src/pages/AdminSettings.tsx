import { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Lock, Mail, Bell, RefreshCw, Save, LogOut, CheckCircle, Smartphone } from 'lucide-react';

export default function AdminSettings() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // States for system preferences (Local simulation)
  const [prefs, setPrefs] = useState({
    notifications: true,
    weeklyReport: false,
    whatsappSync: true
  });

  useEffect(() => {
    fetchUser();
    // Load local prefs
    const saved = localStorage.getItem('psi_prefs');
    if (saved) setPrefs(JSON.parse(saved));
  }, []);

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setEmail(user.email || '');
    }
    setLoading(false);
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    
    const { error } = await supabase.auth.updateUser({ email });
    
    if (error) {
      setMessage({ type: 'error', text: 'Erro ao atualizar e-mail: ' + error.message });
    } else {
      setMessage({ type: 'success', text: 'E-mail atualizado! Verifique sua caixa de entrada para confirmar.' });
    }
    setSaving(false);
  };

  const savePrefs = (newPrefs: typeof prefs) => {
    setPrefs(newPrefs);
    localStorage.setItem('psi_prefs', JSON.stringify(newPrefs));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  if (loading) return <div className="p-16 text-center text-slate-500 font-bold uppercase tracking-widest text-xs">Carregando configurações...</div>;

  return (
    <div className="space-y-12 animate-in fade-in duration-700 max-w-5xl pb-24">
      <div>
        <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase mb-4">Configurações do Sistema</h1>
        <p className="text-slate-500 font-bold tracking-tight text-lg">Gerencie o motor da sua clínica digital em um só lugar.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        {/* Account Info */}
        <div className="bg-white rounded-[3.5rem] shadow-xl shadow-slate-200/20 border border-slate-100 overflow-hidden relative group">
          <div className="p-10 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
            <h2 className="font-black text-slate-900 uppercase text-xs tracking-[0.3em] flex items-center gap-4">
              <Mail className="w-6 h-6 text-brand-600" />
              Segurança e Acesso
            </h2>
            {message && (
                <div className={`text-[10px] px-5 py-2 rounded-full font-black uppercase tracking-widest animate-bounce ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {message.text}
                </div>
              )}
          </div>
          
          <div className="p-10 space-y-10">
             <form onSubmit={handleUpdateEmail} className="space-y-6">
                <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-3">E-mail Administrativo</label>
                   <div className="flex flex-col sm:flex-row gap-4">
                      <input 
                        type="email" value={email} onChange={e => setEmail(e.target.value)}
                        className="flex-1 p-5 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-brand-500/10 focus:bg-white outline-none transition-all font-bold text-slate-700"
                      />
                      <button 
                        disabled={saving}
                        className="px-10 py-5 bg-slate-950 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition shadow-2xl shadow-slate-950/30 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                      >
                        {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Atualizar
                      </button>
                   </div>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-4 flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-emerald-500" /> Confirmação Obrigatória via link externo.
                   </p>
                </div>
             </form>

             <div className="pt-10 border-t border-slate-50">
                <h3 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-3 uppercase tracking-tight">
                   <Lock className="w-5 h-5 text-brand-600" /> Senha de Acesso
                </h3>
                <p className="text-sm text-slate-500 mb-8 font-medium leading-relaxed">Você receberá um link seguro de redefinição no seu e-mail cadastrado.</p>
                <button 
                  className="w-full sm:w-auto px-10 py-5 bg-white text-slate-950 border-2 border-slate-100 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-50 transition shadow-sm active:scale-95"
                >
                  Solicitar Alteração de Senha
                </button>
             </div>
          </div>
        </div>

        <div className="space-y-10">
           {/* System Preferences */}
           <div className="bg-white rounded-[3.5rem] shadow-xl shadow-slate-200/20 border border-slate-100 overflow-hidden">
              <div className="p-10 border-b border-slate-50 bg-slate-50/50">
                 <h2 className="font-black text-slate-900 uppercase text-[10px] tracking-[0.3em] flex items-center gap-4">
                    <Bell className="w-6 h-6 text-brand-600" />
                    Preferências do Motor
                 </h2>
              </div>
              <div className="p-10 space-y-10">
                 <div className="flex items-center justify-between group cursor-pointer" onClick={() => savePrefs({...prefs, notifications: !prefs.notifications})}>
                    <div>
                       <p className="font-black text-slate-900 tracking-tight uppercase text-sm">Notificações Push</p>
                       <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Sinalização de Novos Agendamentos.</p>
                    </div>
                    <div className={`w-14 h-7 rounded-full transition-all flex items-center px-1 ${prefs.notifications ? 'bg-brand-600' : 'bg-slate-200'}`}>
                       <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${prefs.notifications ? 'translate-x-7' : 'translate-x-0'}`}></div>
                    </div>
                 </div>
                 
                 <div className="flex items-center justify-between group cursor-pointer" onClick={() => savePrefs({...prefs, weeklyReport: !prefs.weeklyReport})}>
                    <div>
                       <p className="font-black text-slate-900 tracking-tight uppercase text-sm">Relatório Mensal</p>
                       <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Enviado para seu e-mail administrativo.</p>
                    </div>
                    <div className={`w-14 h-7 rounded-full transition-all flex items-center px-1 ${prefs.weeklyReport ? 'bg-brand-600' : 'bg-slate-200'}`}>
                       <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${prefs.weeklyReport ? 'translate-x-7' : 'translate-x-0'}`}></div>
                    </div>
                 </div>

                 <div className="flex items-center justify-between group cursor-pointer" onClick={() => savePrefs({...prefs, whatsappSync: !prefs.whatsappSync})}>
                    <div>
                       <p className="font-black text-slate-900 tracking-tight uppercase text-sm">Sincronização WhatsApp</p>
                       <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Avisar paciente automaticamente (Mock).</p>
                    </div>
                    <div className={`w-14 h-7 rounded-full transition-all flex items-center px-1 ${prefs.whatsappSync ? 'bg-brand-600' : 'bg-slate-200'}`}>
                       <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${prefs.whatsappSync ? 'translate-x-7' : 'translate-x-0'}`}></div>
                    </div>
                 </div>
              </div>
           </div>

           {/* Danger Zone */}
           <div className="bg-red-50/50 rounded-[3.5rem] p-12 border-2 border-red-100 flex flex-col items-center text-center">
              <button 
                onClick={handleLogout}
                className="px-12 py-6 bg-red-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] hover:bg-red-700 transition-all shadow-2xl shadow-red-600/30 flex items-center gap-4 active:scale-95 group"
              >
                 <LogOut className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                 Encerrar Sessão
              </button>
              <div className="mt-8 flex items-center gap-3 text-red-300 font-black text-[10px] uppercase tracking-widest">
                 <Smartphone className="w-4 h-4" /> PSi Digital SaaS Platform v1.1.0-RC
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
