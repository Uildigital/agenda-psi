import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import type { DoctorProfile } from '../types';
import { useBooking } from '../hooks/useBooking';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  CheckCircle, 
  AlertCircle, 
  MessageCircle,
  Activity,
  Heart,
  Link,
  ChevronRight,
  Shield,
  Star,
  Award,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LandingPage() {
  const { slug } = useParams<{ slug: string }>();
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    async function fetchDoctor() {
      if (!slug) return;
      const { data } = await supabase.from('profiles').select('*').eq('slug', slug).single();
      if (data) setProfile(data as DoctorProfile);
      setLoadingProfile(false);
    }
    fetchDoctor();
  }, [slug]);

  const { getAvailableSlots, confirmarAgendamento, loading, error } = useBooking(profile?.id || null);
  
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
  const [form, setForm] = useState({ nome: '', whatsapp: '', motivo: '' });
  const [success, setSuccess] = useState(false);

  const formatWhatsApp = (value: string) => {
    const v = value.replace(/\D/g, '').substring(0, 11);
    if (v.length <= 2) return v.replace(/(\d{2})/, '($1');
    if (v.length <= 7) return v.replace(/(\d{2})(\d{1,5})/, '($1) $2');
    return v.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  if (loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-12 h-12 border-4 border-slate-100 border-t-brand-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-center flex-col p-8">
        <AlertCircle className="w-16 h-16 text-slate-300 mb-6" />
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Página não encontrada</h2>
        <p className="text-slate-500 mt-2 max-w-sm">Verifique o link ou agende diretamente no painel.</p>
      </div>
    );
  }

  const brandColor = profile.custom_color || '#0ea5e9';
  const slots = getAvailableSlots(selectedDate, "08:00", "18:00");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot || step !== 3) return;

    try {
      await confirmarAgendamento({
        appointment_date: selectedSlot.toISOString(),
        patient_name: form.nome,
        whatsapp: form.whatsapp,
        notes: form.motivo,
      });
      setSuccess(true);
    } catch (err) {}
  };

  const nextDisabled = () => {
    if (step === 1) return form.nome.length < 3;
    if (step === 2) return !selectedSlot;
    if (step === 3) return form.whatsapp.length < 14 || form.motivo.length < 3;
    return false;
  };

  const testimonials = [
    { name: "Mariana S.", text: "O acolhimento foi fundamental para eu lidar com a ansiedade. Sinto-me ouvida e respeitada a cada sessão.", stars: 5 },
    { name: "Ricardo F.", text: "Processo terapêutico incrível. O profissionalismo e a empatia do profissional são ímpares.", stars: 5 },
    { name: "Juliana T.", text: "A primeira sessão de alinhamento me deu a segurança que eu precisava para começar minha jornada.", stars: 5 }
  ];

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-brand-100 selection:text-brand-900 overflow-x-hidden" style={{ '--brand-color': brandColor } as any}>
      
      {/* Floating Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
         <div className="absolute top-[-10%] left-[-5%] w-[60vw] h-[60vw] rounded-full blur-[150px] opacity-[0.08] animate-pulse" style={{ backgroundColor: brandColor }}></div>
         <div className="absolute bottom-[20%] right-[-10%] w-[40vw] h-[40vw] rounded-full blur-[120px] opacity-[0.05]" style={{ backgroundColor: brandColor }}></div>
      </div>

      {/* Navbar Section */}
      <header className="relative z-50 px-6 py-6 max-w-7xl mx-auto flex justify-between items-center bg-white/30 backdrop-blur-md rounded-2xl mt-4 border border-white/50 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg transform hover:rotate-6 transition-transform" style={{ backgroundColor: brandColor }}>
            Ψ
          </div>
          <span className="font-extrabold text-2xl tracking-tighter text-slate-900">PSi Admin</span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-500 tracking-tight">
           <a href="#sobre" className="hover:text-brand-color transition-colors">Sobre</a>
           <a href="#especialidades" className="hover:text-brand-color transition-colors">Atuação</a>
           <a 
             href={`https://wa.me/${profile.whatsapp_number?.replace(/\D/g,'') || ''}?text=Ol%C3%A1%2C%20queria%20saber%20mais%20sobre%20o%20atendimento%20da%20cl%C3%ADnica.`}
             target="_blank" rel="noreferrer"
             className="px-6 py-3 rounded-xl text-white shadow-xl shadow-brand-500/10 hover:shadow-brand-500/30 transition-all hover:-translate-y-1" style={{ backgroundColor: brandColor }}
           >
             Falar com Atendimento
           </a>
        </nav>
      </header>

      <main className="relative z-10 w-full pt-16">
        
        {/* HERO SECTION - Landing / Sales Focus */}
        <section className="px-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
           <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase mb-8 border border-slate-100 bg-white/50 text-slate-400">
                <Star className="w-3 h-3 text-amber-500 fill-amber-500" /> Atendimento Personalizado
              </div>
              <h1 className="text-6xl md:text-8xl font-black text-slate-900 tracking-tighter leading-[0.9] mb-8">
                Cuide da sua <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-color to-slate-900" style={{ backgroundImage: `linear-gradient(to right, ${brandColor}, #0f172a)` }}>saúde mental</span>.
              </h1>
              <p className="text-xl md:text-2xl text-slate-500 max-w-lg font-medium leading-relaxed mb-12">
                Descubra como a psicoterapia pode transformar sua relação consigo mesmo e com o mundo através de um acolhimento ético e especializado.
              </p>
              <div className="flex flex-col sm:flex-row gap-5 items-center">
                  <a 
                    href={`https://wa.me/${profile.whatsapp_number?.replace(/\D/g,'') || ''}?text=Ol%C3%A1%2C%20vim%20pelo%20site%20e%20gostaria%20de%20agendar%20um%20alinhamento%20estrat%C3%A9gico.`}
                    target="_blank" rel="noreferrer"
                    className="w-full sm:w-auto px-10 py-5 text-white rounded-2xl font-black text-lg shadow-2xl transition-all hover:scale-105 active:scale-95 text-center flex items-center justify-center gap-3" 
                    style={{ backgroundColor: brandColor, shadowColor: `${brandColor}40` } as any}
                  >
                    <MessageCircle className="w-6 h-6" /> Falar com Atendimento
                  </a>
                 <p className="text-sm font-bold text-slate-400 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-green-500" /> Sigilo Profissional Ético
                 </p>
              </div>
           </motion.div>

           <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1 }} className="relative">
              <div className="aspect-[4/5] rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white group relative">
                 <img 
                    src="/psicologo.png" 
                    alt={profile.full_name} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                 />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
              {/* Floating Badge */}
              <div className="absolute bottom-10 -left-10 bg-white p-6 rounded-3xl shadow-2xl shadow-black/10 flex items-center gap-4 animate-bounce duration-[3000ms]">
                 <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: brandColor }}>
                    Ψ
                 </div>
                 <div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Psicologia Clínica</p>
                    <p className="text-lg font-black text-slate-900 tracking-tight leading-none uppercase">Especialista</p>
                 </div>
              </div>
           </motion.div>
        </section>

        {/* SECTION: SOBRE / ACTING */}
        <section id="sobre" className="px-6 py-32 bg-slate-50/50 relative overflow-hidden">
           <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
              <div className="order-2 lg:order-1 space-y-8">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:border-brand-color/30 transition-all group">
                       <Activity className="w-10 h-10 mb-6 group-hover:scale-110 transition-transform" style={{ color: brandColor }} />
                       <h4 className="font-black text-slate-900 mb-2">Ansiedade & Estresse</h4>
                       <p className="text-sm text-slate-500 leading-relaxed">Ferramentas aplicadas para controle e gerenciamento emocional no cotidiano.</p>
                    </div>
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:border-brand-color/30 transition-all group mt-8">
                       <Heart className="w-10 h-10 mb-6 group-hover:scale-110 transition-transform" style={{ color: brandColor }} />
                       <h4 className="font-black text-slate-900 mb-2">Relacionamentos</h4>
                       <p className="text-sm text-slate-500 leading-relaxed">Aprimoramento da comunicação e resolução de conflitos interpessoais.</p>
                    </div>
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:border-brand-color/30 transition-all group">
                       <Award className="w-10 h-10 mb-6 group-hover:scale-110 transition-transform" style={{ color: brandColor }} />
                       <h4 className="font-black text-slate-900 mb-2">Autoconhecimento</h4>
                       <p className="text-sm text-slate-500 leading-relaxed">Jornada profunda de descoberta das suas motivações e valores fundamentais.</p>
                    </div>
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:border-brand-color/30 transition-all group mt-8">
                       <Link className="w-10 h-10 mb-6 group-hover:scale-110 transition-transform" style={{ color: brandColor }} />
                       <h4 className="font-black text-slate-900 mb-2">Metas & Carreira</h4>
                       <p className="text-sm text-slate-500 leading-relaxed">Planejamento e superação de bloqueios profissionais.</p>
                    </div>
                 </div>
              </div>

              <div className="order-1 lg:order-2 space-y-8">
                 <h2 className="text-5xl font-black text-slate-900 tracking-tighter leading-tight">
                    Minha missão é o seu <br/> <span style={{ color: brandColor }}>Equilíbrio Emocional</span>.
                 </h2>
                 <p className="text-lg text-slate-500 leading-relaxed font-medium">
                    Olá, eu sou <strong>{profile.full_name}</strong>. Através de uma abordagem científica e empática, auxilio meus pacientes a encontrarem novos significados e vivenciarem vidas mais leves e autênticas. 
                    <br/><br/>
                    Acredito que a terapia não é apenas para resolver problemas, mas sim para expandir quem você é.
                 </p>
                 <div className="pt-6 flex flex-col gap-4">
                    <div className="flex items-center gap-4 text-slate-700 font-bold">
                       <CheckCircle className="w-5 h-5 text-green-500" /> Atendimento Online (Todo o Brasil)
                    </div>
                    <div className="flex items-center gap-4 text-slate-700 font-bold">
                       <CheckCircle className="w-5 h-5 text-green-500" /> Presencial em Consultório Moderno
                    </div>
                    <div className="flex items-center gap-4 text-slate-700 font-bold">
                       <CheckCircle className="w-5 h-5 text-green-500" /> Formação Especializada & Ética 
                    </div>
                 </div>
              </div>
           </div>
        </section>

        {/* SOCIAL PROOF / TESTIMONIALS */}
        <section className="px-6 py-24 max-w-7xl mx-auto">
           <div className="text-center mb-16">
              <h2 className="text-4xl font-black text-slate-900 tracking-tight">O que dizem os pacientes</h2>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((t, i) => (
                <div key={i} className="bg-white p-10 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden group">
                   <div className="flex gap-1 mb-6">
                      {[1,2,3,4,5].map(s => <Star key={s} className="w-4 h-4 text-amber-500 fill-amber-400" />)}
                   </div>
                   <p className="text-slate-600 font-medium leading-relaxed italic mb-8">"{t.text}"</p>
                   <p className="font-black text-slate-900 border-t border-slate-100 pt-6 uppercase text-xs tracking-widest">{t.name}</p>
                   {/* Background icon decoration */}
                   <MessageCircle className="absolute -bottom-6 -right-6 w-24 h-24 text-slate-50 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
           </div>
        </section>

        {/* BOOKING SECTION - The Sales CTA */}
        <section id="agendar" className="px-6 py-32 bg-slate-900 relative rounded-[4rem] mx-4 my-12 overflow-hidden">
           {/* Background Decor */}
           <div className="absolute top-0 right-0 w-[50vw] h-[50vw] rounded-full blur-[150px] opacity-20 transition-all duration-1000" style={{ backgroundColor: brandColor }}></div>
           
           <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center relative z-10">
              <div className="text-white space-y-8">
                 <div className="inline-block px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-xs font-black tracking-[0.2em] uppercase text-brand-color" style={{ color: brandColor }}>
                    Elite Digital
                 </div>
                 <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.9]">
                    Agendamento <br/> <span className="text-slate-400">Direto Opcional</span>.
                 </h2>
                 <p className="text-xl text-slate-400 font-medium leading-relaxed max-w-md">
                    Sua primeira Sessão de Alinhamento serve para compreendermos suas demandas e estruturarmos o melhor plano terapêutico para seu caso.
                 </p>
                 <div className="space-y-6">
                    <div className="flex items-center gap-6 group">
                       <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-brand-color/20 transition-all font-bold text-lg" style={{ color: brandColor }}>1</div>
                       <div>
                          <p className="font-bold text-white">Agende seu Horário</p>
                          <p className="text-sm text-slate-500">Escolha o melhor momento ao lado.</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-6 group">
                       <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-brand-color/20 transition-all font-bold text-lg" style={{ color: brandColor }}>2</div>
                       <div>
                          <p className="font-bold text-white">Confirme Seus Dados</p>
                          <p className="text-sm text-slate-500">Enviaremos os detalhes via WhatsApp.</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-6 group">
                       <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-brand-color/20 transition-all font-bold text-lg" style={{ color: brandColor }}>3</div>
                       <div>
                          <p className="font-bold text-white">Sessão de Alinhamento</p>
                          <p className="text-sm text-slate-500">O primeiro passo estruturado para sua evolução.</p>
                       </div>
                    </div>
                 </div>
              </div>

              {/* The Interactive Form Card */}
              <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-2xl relative">
                 <div className="absolute -top-6 -right-6 bg-brand-color text-white px-8 py-3 rounded-2xl font-black text-sm shadow-xl z-20 animate-pulse" style={{ backgroundColor: brandColor }}>
                    ABERTO PARA AGENDAMENTOS
                 </div>

                 {success ? (
                   <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-20">
                      <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center text-green-500 mx-auto mb-8 shadow-inner shadow-green-100">
                         <CheckCircle className="w-12 h-12" />
                      </div>
                      <h3 className="text-3xl font-black text-slate-900 mb-2">Agendamento Realizado!</h3>
                      <p className="text-slate-500 font-medium mb-10">
                        {form.nome}, sua vaga está reservada para <br/><strong>{selectedSlot && format(selectedSlot, "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}</strong>.
                      </p>
                      <a
                        href={`https://wa.me/${profile.whatsapp_number?.replace(/\D/g,'') || ''}?text=Ol%C3%A1%20${encodeURIComponent(profile.full_name)}.%20Sou%20${encodeURIComponent(form.nome)}%20e%20acabei%20de%20reservar%20meu%20hor%C3%A1rio%20para%20alinhamento.`}
                        target="_blank" rel="noreferrer"
                        className="flex items-center justify-center gap-3 w-full px-8 py-5 bg-green-500 text-white font-black rounded-2xl hover:bg-green-600 transition-all shadow-xl shadow-green-500/20"
                      >
                        <MessageCircle className="w-5 h-5" /> Iniciar no WhatsApp
                      </a>
                   </motion.div>
                 ) : (
                   <div className="space-y-8">
                      {error && (
                        <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl flex items-center gap-3 text-sm animate-shake">
                           <AlertCircle className="w-5 h-5 flex-shrink-0" />
                           {error}
                        </div>
                      )}
                      <div className="flex justify-center gap-3 mb-12">
                         {[1,2,3].map(i => (
                           <div key={i} className={`h-1.5 rounded-full transition-all duration-700 ${step === i ? 'w-16' : 'w-4'}`} style={{ backgroundColor: step >= i ? brandColor : '#f1f5f9' }}></div>
                         ))}
                      </div>

                      <AnimatePresence mode="wait">
                         {step === 1 && (
                            <motion.div key="s1" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}>
                               <h3 className="text-3xl font-black text-slate-900 mb-6 tracking-tight">Qual seu nome?</h3>
                               <p className="text-slate-500 mb-8 font-medium italic">"Toda jornada começa com o primeiro passo."</p>
                               <input 
                                 type="text" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} autoFocus placeholder="Nome completo"
                                 className="w-full p-6 text-xl rounded-2xl border-2 border-slate-100 bg-slate-50 focus:bg-white outline-none focus:border-brand-color transition-all"
                                 style={{ '--tw-border-color': brandColor } as any}
                               />
                            </motion.div>
                         )}

                         {step === 2 && (
                            <motion.div key="s2" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="space-y-8">
                               <h3 className="text-3xl font-black text-slate-900 tracking-tight">Escolha o Horário</h3>
                               <div className="space-y-4">
                                  <input 
                                    type="date" value={format(selectedDate, 'yyyy-MM-dd')} onChange={(e) => setSelectedDate(new Date(e.target.value + 'T00:00:00'))} min={format(new Date(), 'yyyy-MM-dd')}
                                    className="w-full p-5 rounded-2xl border-2 border-slate-100 bg-white font-bold"
                                  />
                                  <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                     {slots.map((slot, i) => {
                                       const isSelected = selectedSlot?.getTime() === slot.date.getTime();
                                       return (
                                         <button
                                           key={i} disabled={!slot.isAvailable} onClick={() => setSelectedSlot(slot.date)}
                                           className={`p-4 rounded-xl font-black transition-all border-2 flex items-center justify-between group ${slot.isAvailable ? (isSelected ? 'text-white border-transparent' : 'bg-white border-slate-50 text-slate-400 hover:border-slate-200 shadow-sm') : 'bg-slate-50 text-slate-200 border-transparent cursor-not-allowed opacity-50'}`}
                                           style={isSelected ? { backgroundColor: brandColor, borderColor: brandColor } : {}}
                                         >
                                           {format(slot.date, 'HH:mm')}
                                           {slot.isAvailable && <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'rotate-90' : 'group-hover:translate-x-1'}`} />}
                                         </button>
                                       );
                                     })}
                                  </div>
                               </div>
                            </motion.div>
                         )}

                         {step === 3 && (
                            <motion.div key="s3" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="space-y-8">
                               <h3 className="text-3xl font-black text-slate-900 tracking-tight">Quase pronto...</h3>
                               <p className="text-slate-500 font-medium">Precisamos do seu WhatsApp para o link da videochamada ou endereço.</p>
                               <div className="space-y-4">
                                  <input type="tel" value={form.whatsapp} onChange={e => setForm({...form, whatsapp: formatWhatsApp(e.target.value)})} required placeholder="Celular/WhatsApp" className="w-full p-5 text-xl rounded-2xl border-2 border-slate-100 outline-none focus:border-brand-color transition-all" />
                                  <textarea rows={3} value={form.motivo} onChange={e => setForm({...form, motivo: e.target.value})} required placeholder="O que te trouxe até aqui hoje?" className="w-full p-5 text-lg rounded-2xl border-2 border-slate-100 outline-none focus:border-brand-color transition-all resize-none" />
                               </div>
                            </motion.div>
                         )}
                      </AnimatePresence>

                      <div className="pt-8 flex justify-between items-center border-t border-slate-100">
                         {step > 1 ? (
                           <button onClick={() => setStep(s => s - 1)} className="text-slate-400 font-extrabold hover:text-slate-900 transition-colors uppercase text-xs tracking-widest">
                              Voltar
                           </button>
                         ) : <div/>}

                         <button 
                           onClick={step < 3 ? () => setStep(s => s + 1) : handleSubmit}
                           disabled={nextDisabled() || loading}
                           className="px-12 py-5 text-white font-black rounded-2xl shadow-2xl transition-all transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:transform-none"
                           style={{ backgroundColor: brandColor } as any}
                         >
                            {step < 3 ? 'Continuar' : (loading ? 'Agendando...' : 'Finalizar Agendamento')}
                         </button>
                      </div>
                   </div>
                 )}
              </div>
           </div>
        </section>

        {/* FAQ SECTION */}
        <section className="px-6 py-24 max-w-4xl mx-auto">
           <div className="text-center mb-16">
              <h2 className="text-4xl font-black text-slate-900">Perguntas Frequentes</h2>
           </div>
           <div className="space-y-4">
              {[
                { q: "Como funciona a primeira Sessão de Alinhamento?", a: "É um atendimento inicial focado em entender sua queixa principal, tirar dúvidas sobre a metodologia e alinhar as próximas etapas do seu processo terapêutico." },
                { q: "Qual a duração da sessão?", a: "As sessões regulares duram em média 50 minutos." },
                { q: "Vocês atendem planos de saúde?", a: "Trabalhamos apenas com atendimento particular, porém fornecemos recibo para reembolso." },
                { q: "A terapia online é eficaz?", a: "Sim, diversos estudos comprovam que a eficácia da terapia online é idêntica à presencial para a maioria dos casos." }
              ].map((faq, i) => (
                <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                   <h4 className="font-bold text-slate-900 mb-2 flex items-center justify-between">
                     {faq.q}
                     <ChevronDown className="w-4 h-4 text-slate-300" />
                   </h4>
                   <p className="text-sm text-slate-500 font-medium">{faq.a}</p>
                </div>
              ))}
           </div>
        </section>
      </main>

      <footer className="px-6 py-12 border-t border-slate-200 bg-slate-50 flex flex-col items-center gap-8">
         <div className="flex items-center gap-3 grayscale opacity-50">
            <div className="w-8 h-8 bg-slate-400 rounded-lg flex items-center justify-center text-white font-bold text-md">Ψ</div>
            <span className="font-bold text-slate-600">PSi Manager SaaS</span>
         </div>
         <p className="text-xs text-slate-400 font-medium uppercase tracking-[0.2em]">© 2026 {profile.full_name} • Todos os direitos reservados</p>
      </footer>

      {/* FLOATING WHATSAPP CONCIERGE BUTTON */}
      <a 
        href={`https://wa.me/${profile.whatsapp_number?.replace(/\D/g,'') || ''}?text=Ol%C3%A1%2C%20queria%20saber%20mais%20sobre%20o%20atendimento%20da%20cl%C3%ADnica.`}
        target="_blank" rel="noreferrer"
        className="fixed bottom-8 right-8 z-[100] w-20 h-20 bg-green-500 text-white rounded-full shadow-2xl shadow-green-500/40 hover:scale-110 active:scale-90 transition-all flex items-center justify-center animate-bounce group"
      >
        <MessageCircle className="w-10 h-10 group-hover:animate-pulse" />
        <div className="absolute right-24 bg-white px-4 py-3 rounded-2xl shadow-xl border border-slate-100 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
           <p className="text-slate-900 font-black text-xs uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
              Atendimento Online agora
           </p>
        </div>
      </a>

    </div>
  );
}
