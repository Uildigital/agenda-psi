import { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { type DoctorProfile } from '../types';
import { Save, ExternalLink, RefreshCw, Palette, Phone, User, DollarSign, Smartphone } from 'lucide-react';

export default function AdminProfile() {
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (data) setProfile(data as DoctorProfile);
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setSaving(true);
    setMessage(null);

    const { error } = await supabase
      .from('profiles')
      .update({
        slug: profile.slug,
        full_name: profile.full_name,
        whatsapp_number: profile.whatsapp_number,
        custom_color: profile.custom_color,
        default_session_value: profile.default_session_value || 160
      })
      .eq('id', profile.id);

    if (error) {
      setMessage({ type: 'error', text: 'Erro ao salvar: ' + error.message });
    } else {
      setMessage({ type: 'success', text: 'Perfil e configurações atualizados!' });
    }
    setSaving(false);
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Carrregando dados do perfil...</div>;
  if (!profile) return <div className="p-8 text-center text-red-500">Erro ao carregar perfil.</div>;

  const publicUrl = `${window.location.protocol}//${window.location.host}/${profile.slug}`;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Meu Perfil Profissional</h1>
        <p className="text-slate-500 mt-1 font-medium">Configure sua identidade visual, URL e preferências financeiras.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSave} className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="font-black text-slate-900 text-lg uppercase tracking-widest flex items-center gap-2">
                <User className="w-5 h-5 text-brand-600" />
                Informações Básicas
              </h2>
              {message && (
                <div className={`text-xs px-4 py-1.5 rounded-full font-black uppercase tracking-widest ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {message.text}
                </div>
              )}
            </div>
            
            <div className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">Nome de Exibição</label>
                  <input 
                    type="text" 
                    value={profile.full_name}
                    onChange={e => setProfile({...profile, full_name: e.target.value})}
                    className="w-full p-4 rounded-2xl bg-slate-50 border-none focus:ring-4 focus:ring-brand-500/10 outline-none transition-all font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">WhatsApp de Contato</label>
                  <input 
                    type="tel" 
                    value={profile.whatsapp_number || ''}
                    onChange={e => setProfile({...profile, whatsapp_number: e.target.value})}
                    className="w-full p-4 rounded-2xl bg-slate-50 border-none focus:ring-4 focus:ring-brand-500/10 outline-none transition-all font-bold"
                    placeholder="5511999999999"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">URL da Agenda Digital</label>
                  <div className="flex bg-slate-50 rounded-2xl overflow-hidden px-4 py-1 items-center">
                    <span className="text-slate-400 text-xs font-mono select-none">/{profile.slug}</span>
                    <input 
                      type="text" 
                      value={profile.slug}
                      onChange={e => setProfile({...profile, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})}
                      className="flex-1 p-3 bg-transparent border-none outline-none font-black text-brand-600 tracking-tight"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block flex items-center gap-2">
                      <DollarSign className="w-3 h-3 text-brand-600" />
                      Valor Padrão da Sessão (R$)
                   </label>
                   <input 
                     type="number" 
                     value={profile.default_session_value || 160}
                     onChange={e => setProfile({...profile, default_session_value: Number(e.target.value)})}
                     className="w-full p-4 rounded-2xl bg-slate-50 border-none focus:ring-4 focus:ring-brand-500/10 outline-none transition-all font-black text-slate-900"
                   />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block flex items-center gap-2">
                  <Palette className="w-4 h-4 text-brand-600" />
                  Cor da Sua Marca
                </label>
                <div className="flex items-center gap-6">
                  <input 
                    type="color" 
                    value={profile.custom_color || '#14b8a6'}
                    onChange={e => setProfile({...profile, custom_color: e.target.value})}
                    className="w-16 h-16 p-2 bg-white border-2 border-slate-100 rounded-3xl cursor-pointer shadow-sm"
                  />
                  <input 
                    type="text" 
                    value={profile.custom_color || '#14b8a6'}
                    onChange={e => setProfile({...profile, custom_color: e.target.value})}
                    className="w-32 p-4 rounded-2xl bg-slate-50 border-none outline-none font-mono text-sm uppercase font-black"
                  />
                  <div className="h-10 w-px bg-slate-100 mx-2" />
                  <p className="text-xs text-slate-400 font-medium max-w-[200px]">Esta cor será usada no fundo da sua página de agendamento pública.</p>
                </div>
              </div>
            </div>

            <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex justify-end">
              <button 
                type="submit" 
                disabled={saving}
                className="bg-slate-900 hover:bg-brand-600 text-white font-black px-10 py-5 rounded-[2rem] transition-all flex items-center gap-3 shadow-xl shadow-slate-950/20 disabled:opacity-50 active:scale-95"
              >
                {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                SALVAR CONFIGURAÇÕES
              </button>
            </div>
          </form>
        </div>

        {/* Preview Card */}
        <div className="space-y-8">
          <div className="bg-white p-10 rounded-3xl shadow-sm border border-slate-200 text-center">
            <h3 className="font-black text-slate-900 uppercase text-[10px] tracking-[0.3em] mb-6">Link Público</h3>
            <div className="p-6 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 mb-8">
              <span className="text-brand-600 font-black tracking-tight text-sm block truncate break-all">{publicUrl}</span>
            </div>
            
            <a 
              href={publicUrl} 
              target="_blank" 
              rel="noreferrer"
              className="w-full inline-flex items-center justify-center gap-3 bg-brand-50 text-brand-700 font-black py-4 rounded-3xl hover:bg-brand-600 hover:text-white transition shadow-sm uppercase tracking-widest text-[10px]"
            >
              <ExternalLink className="w-4 h-4" />
              Abrir Agendamento
            </a>
            <p className="text-[10px] font-bold text-slate-400 mt-6 px-4 leading-relaxed">Envie este link para seus pacientes ou coloque na Bio do seu Instagram.</p>
          </div>

          <div className="bg-brand-600 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-brand-500/30 overflow-hidden relative">
            <div className="relative z-10">
              <h3 className="font-black uppercase tracking-[0.2em] flex items-center gap-3 mb-4 text-xs">
                <Smartphone className="w-5 h-5" />
                Dica PSi
              </h3>
              <p className="text-brand-50 text-sm leading-relaxed font-medium">
                Sua agenda é 100% responsiva (Mobile-First). Você pode gerenciar tudo pelo celular com a mesma facilidade.
              </p>
            </div>
            {/* Abstract Background bits */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12 blur-2xl"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
