import { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import type { Appointment, Patient, DoctorProfile } from '../types';
import { 
  Download, 
  Clock, 
  Wallet,
  ArrowUpRight,
  Plus,
  Eye,
  EyeOff,
  DollarSign,
  Smartphone,
  Banknote,
  CreditCard
} from 'lucide-react';
import { format, isSameMonth, parseISO, subMonths, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';

export default function AdminFaturamento() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  
  // Privacy defaults to true (HIDDEN)
  const [privacyMode, setPrivacyMode] = useState(true);

  useEffect(() => {
    fetchData();
    const savedPrivacy = localStorage.getItem('psi_privacy_mode');
    if (savedPrivacy !== null) {
      setPrivacyMode(savedPrivacy === 'true');
    } else {
      setPrivacyMode(true);
    }
  }, []);

  const togglePrivacy = () => {
    if (privacyMode) {
      if (window.confirm('Deseja tornar os valores visíveis agora?')) {
        setPrivacyMode(false);
        localStorage.setItem('psi_privacy_mode', 'false');
      }
    } else {
      setPrivacyMode(true);
      localStorage.setItem('psi_privacy_mode', 'true');
    }
  };

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: appts } = await supabase.from('appointments').select('*').eq('doctor_id', user.id);
    const { data: pts } = await supabase.from('patients').select('*').eq('doctor_id', user.id);
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    
    if (appts) setAppointments(appts as Appointment[]);
    if (pts) setPatients(pts as Patient[]);
    if (prof) setProfile(prof as DoctorProfile);
    setLoading(false);
  };

  const getPrice = (appt: Appointment) => {
    if (appt.price) return appt.price;
    const pt = patients.find(p => p.id === appt.patient_id || p.whatsapp === appt.whatsapp);
    return pt?.base_session_value || profile?.default_session_value || 160;
  };
  
  // Filtering by selected month
  const finished = appointments.filter(a => a.status === 'finished');
  const filteredAppts = finished.filter(a => isSameMonth(parseISO(a.appointment_date), selectedMonth));
  
  const totalPaid = filteredAppts.filter(a => a.payment_status === 'paid').reduce((acc, a) => acc + getPrice(a), 0);
  const totalUnpaid = filteredAppts.filter(a => a.payment_status !== 'paid').reduce((acc, a) => acc + getPrice(a), 0);
  const totalMonth = totalPaid + totalUnpaid;
  
  const prevMonthAppts = finished.filter(a => isSameMonth(parseISO(a.appointment_date), subMonths(selectedMonth, 1)));
  const totalPaidPrevMonth = prevMonthAppts.filter(a => a.payment_status === 'paid').reduce((acc, a) => acc + getPrice(a), 0);
  
  const growth = totalPaidPrevMonth > 0 ? Math.round(((totalPaid - totalPaidPrevMonth) / totalPaidPrevMonth) * 100) : 0;

  const formatCurrency = (val: number) => {
    if (privacyMode) return 'R$ ••••••';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const paymentMethods = {
    pix: { label: 'PIX', icon: Smartphone, color: 'text-brand-600 bg-brand-50' },
    money: { label: 'Dinheiro', icon: Banknote, color: 'text-emerald-600 bg-emerald-50' },
    card: { label: 'Cartão', icon: CreditCard, color: 'text-indigo-600 bg-indigo-50' },
    other: { label: 'Outro', icon: Wallet, color: 'text-slate-600 bg-slate-50' }
  };

  return (
    <div className="space-y-10 md:space-y-12 animate-in fade-in duration-700 pb-24 px-2 sm:px-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
           <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none">Faturamento</h1>
           <div className="flex items-center gap-4 mt-4 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm w-fit">
              <button 
                onClick={() => setSelectedMonth(subMonths(selectedMonth, 1))}
                className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400"
              >
                 <Plus className="w-5 h-5 rotate-45" />
              </button>
              <span className="text-sm font-black uppercase tracking-widest text-slate-900 px-4">
                 {format(selectedMonth, 'MMMM yyyy', { locale: ptBR })}
              </span>
              <button 
                onClick={() => setSelectedMonth(addMonths(selectedMonth, 1))}
                className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400"
              >
                 <Plus className="w-5 h-5" />
              </button>
           </div>
        </div>
        <div className="flex flex-wrap items-center gap-4">
           <button 
             onClick={togglePrivacy}
             className={`px-6 py-4 border-2 rounded-2xl font-black text-[10px] uppercase tracking-widest transition shadow-sm flex items-center gap-3 ${privacyMode ? 'bg-white border-slate-100 text-slate-400' : 'bg-brand-50 border-brand-200 text-brand-700'}`}
             title={privacyMode ? "Mostrar Valores (Confirmar)" : "Ocultar Valores"}
           >
             {privacyMode ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
             {privacyMode ? 'OCULTO' : 'VISÍVEL'}
           </button>
           <Link to="/admin/agenda?new=true" className="px-8 py-4 bg-slate-950 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition shadow-xl shadow-slate-950/30 flex items-center justify-center gap-3 active:scale-95">
             <Plus className="w-5 h-5" /> Lançamento
           </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-10">
        <div className="lg:col-span-2 bg-slate-950 rounded-[3rem] md:rounded-[4rem] p-10 md:p-16 text-white shadow-2xl relative overflow-hidden group">
           <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-end gap-12">
              <div className="space-y-6">
                 <p className="text-brand-400 font-black text-[10px] uppercase tracking-[0.4em]">Faturamento Já Recebido</p>
                 <h2 className="text-5xl md:text-7xl font-black tracking-tighter">
                   {formatCurrency(totalPaid)}
                 </h2>
                 <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3 text-emerald-400 font-black text-xs uppercase tracking-widest bg-emerald-500/10 px-4 py-2 rounded-full w-fit">
                       <ArrowUpRight className="w-4 h-4" /> {growth}% cresc.
                    </div>
                    <div className="text-slate-500 font-black text-[10px] uppercase tracking-widest">
                       Total Mensal: {formatCurrency(totalMonth)}
                    </div>
                 </div>
              </div>
              <div className="p-8 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-md min-w-[200px]">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Valor Padrão (Base)</label>
                 <div className="flex items-center gap-2">
                    <span className="text-2xl font-black text-white">R$</span>
                    <span className="text-2xl font-black text-white px-2">
                       {privacyMode ? '••••' : (profile?.default_session_value || 160)}
                    </span>
                    <Link to="/admin/perfil" className="text-brand-400 hover:text-white transition">
                       <Plus className="w-4 h-4" />
                    </Link>
                 </div>
                 <p className="text-[8px] text-slate-500 uppercase font-black tracking-widest mt-2">Edite no seu Perfil</p>
              </div>
           </div>
        </div>

        <div className="bg-white rounded-[3.5rem] p-12 shadow-xl border border-slate-100 space-y-10">
           <h3 className="font-black text-slate-900 uppercase text-[10px] tracking-[0.3em] text-slate-400">Status Financeiro</h3>
           <div className="space-y-8">
              <div className="flex items-center gap-6">
                 <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center font-black">
                    <DollarSign className="w-7 h-7" />
                 </div>
                 <div>
                    <p className="font-black text-slate-900 tracking-tight leading-none text-xl uppercase">{formatCurrency(totalPaid)}</p>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1 text-emerald-600">Total Recebido</p>
                 </div>
              </div>
              <div className="flex items-center gap-6">
                 <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center font-black">
                    <Clock className="w-7 h-7" />
                 </div>
                 <div>
                    <p className="font-black text-slate-900 tracking-tight leading-none text-xl uppercase">{formatCurrency(totalUnpaid)}</p>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1 text-amber-600">A Receber</p>
                 </div>
              </div>
           </div>
        </div>
      </div>

      <div className="bg-white rounded-[3.5rem] shadow-sm border border-slate-100 overflow-hidden">
         <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
             <h3 className="font-black text-slate-900 uppercase text-[10px] tracking-[0.4em] flex items-center gap-3">
                <Wallet className="w-5 h-5 text-brand-600" /> Fluxo de Caixa: {format(selectedMonth, 'MMMM', { locale: ptBR })}
             </h3>
            <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-brand-600 transition">
               <Download className="w-4 h-4" /> Exportar Balanço
            </button>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                     <th className="px-10 py-6">Data</th>
                     <th className="px-10 py-6">Paciente</th>
                     <th className="px-10 py-6">Forma / Status</th>
                     <th className="px-10 py-6 text-right">Valor</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    <tr><td colSpan={4} className="p-20 text-center text-slate-400 font-bold">Carregando fluxo financeiro...</td></tr>
                  ) : filteredAppts.length === 0 ? (
                    <tr><td colSpan={4} className="p-20 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest">Sem movimentações em {format(selectedMonth, 'MMMM', { locale: ptBR })}.</td></tr>
                  ) : (
                    filteredAppts.map(a => {
                      const MethodIcon = a.payment_method ? paymentMethods[a.payment_method as keyof typeof paymentMethods]?.icon || Wallet : Wallet;
                      const methodInfo = a.payment_method ? paymentMethods[a.payment_method as keyof typeof paymentMethods] : { label: 'Não Definido', color: 'text-slate-300' };
                      
                      return (
                        <tr key={a.id} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-10 py-8 text-sm font-bold text-slate-400">{format(parseISO(a.appointment_date), "dd/MM")}</td>
                          <td className="px-10 py-8 font-black text-slate-900 uppercase tracking-tight">{a.patient_name}</td>
                          <td className="px-10 py-8">
                             <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${methodInfo.color}`}>
                                   <MethodIcon className="w-4 h-4" />
                                </div>
                                <div>
                                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">{methodInfo.label}</p>
                                   <p className={`text-[8px] font-black uppercase tracking-widest ${a.payment_status === 'paid' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                      {a.payment_status === 'paid' ? 'Recebido' : 'Pendente'}
                                   </p>
                                </div>
                             </div>
                          </td>
                          <td className="px-10 py-8 text-right font-black text-slate-900 text-xl tracking-tighter">
                             {formatCurrency(getPrice(a))}
                          </td>
                        </tr>
                      );
                    })
                  )}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}
