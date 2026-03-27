import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import type { Appointment, Patient, DoctorProfile } from '../types';
import { 
  Calendar, 
  Search, 
  Plus, 
  CheckCircle2, 
  Wallet,
  CreditCard,
  Banknote,
  Smartphone,
  ChevronRight,
  ChevronLeft,
  FileText
} from 'lucide-react';
import { format, parseISO, addDays, subDays, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

export default function AgendaCompleta() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [showFinishModal, setShowFinishModal] = useState<Appointment | null>(null);
  const [finishData, setFinishData] = useState({
    payment_status: 'paid' as 'paid' | 'unpaid',
    payment_method: 'pix' as 'pix' | 'money' | 'card' | 'other',
    price: 160
  });

  useEffect(() => {
    fetchData();
  }, []);

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

  const handleOpenFinishModal = (appt: Appointment) => {
    setFinishData({
       ...finishData,
       price: getPrice(appt)
    });
    setShowFinishModal(appt);
  };

  const filteredAppointments = appointments.filter(a => {
    const isDay = isSameDay(parseISO(a.appointment_date), selectedDate);
    const matchesSearch = a.patient_name.toLowerCase().includes(searchTerm.toLowerCase());
    return isDay && matchesSearch;
  });

  const handleFinishSession = async () => {
    if (!showFinishModal) return;
    
    const { error } = await supabase
      .from('appointments')
      .update({
        status: 'finished',
        payment_status: finishData.payment_status,
        payment_method: finishData.payment_method,
        price: finishData.price
      })
      .eq('id', showFinishModal.id);

    if (!error) {
       setAppointments(prev => prev.map(a => a.id === showFinishModal.id ? { ...a, status: 'finished', ...finishData } : a));
       
       const pt = patients.find(p => p.id === showFinishModal.patient_id || p.whatsapp === showFinishModal.whatsapp);
       
       if (window.confirm('Sessão finalizada! Deseja registrar a evolução clínica (SOAP) agora?')) {
          if (pt) {
             navigate(`/admin/pacientes/${pt.id}?newRecord=true`);
          } else {
             alert('Paciente não vinculado. Acesse o prontuário via aba Pacientes.');
          }
       }
       setShowFinishModal(null);
    }
  };

  const handlePatientNavigate = (appt: Appointment) => {
     if (appt.patient_id) {
        navigate(`/admin/pacientes/${appt.patient_id}`);
     } else {
        const pt = patients.find(p => p.whatsapp === appt.whatsapp || p.full_name === appt.patient_name);
        if (pt) navigate(`/admin/pacientes/${pt.id}`);
        else alert('Paciente não vinculado. Acesse o prontuário via aba Pacientes.');
     }
  };

  return (
    <div className="space-y-8 md:space-y-12 animate-in fade-in duration-700 pb-32">
      
      {/* Dynamic Navigation Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none">Agenda</h1>
          <p className="text-slate-400 font-bold tracking-tight text-xs uppercase tracking-widest mt-2">{format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}</p>
        </div>
        <div className="flex bg-white p-2 rounded-2xl border border-slate-100 shadow-sm gap-2">
           <button onClick={() => setSelectedDate(subDays(selectedDate, 1))} className="p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"><ChevronLeft className="w-5 h-5 text-slate-600" /></button>
           <button onClick={() => setSelectedDate(new Date())} className="px-4 py-2 font-black text-[10px] uppercase tracking-widest flex items-center gap-2">HOJE</button>
           <button onClick={() => setSelectedDate(addDays(selectedDate, 1))} className="p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"><ChevronRight className="w-5 h-5 text-slate-600" /></button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Calendar / Search Column */}
        <div className="lg:col-span-1 space-y-6">
           <div className="relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text" placeholder="BUSCAR PACIENTE..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-white pl-14 pr-6 py-5 rounded-2xl border-none font-bold uppercase text-xs tracking-widest shadow-sm focus:ring-4 focus:ring-brand-500/10 transition-all outline-none"
              />
           </div>
           
           <div className="bg-slate-950 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
              <div className="relative z-10">
                <p className="text-brand-400 font-black text-[9px] uppercase tracking-widest mb-4">Novo Atendimento</p>
                <h3 className="text-xl font-black mb-6 leading-tight uppercase">Sincronize sua agenda online</h3>
                <Link to="/admin/agenda?new=true" className="w-full bg-white text-slate-900 p-4 rounded-xl flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-[0.2em] active:scale-95 transition-transform">
                   <Plus className="w-4 h-4" /> Criar Horário
                </Link>
              </div>
           </div>
        </div>

        {/* List of Appointments (Cards on Mobile) */}
        <div className="lg:col-span-3 space-y-6">
           {loading ? (
              <div className="p-20 text-center animate-pulse text-slate-300 font-bold uppercase tracking-widest text-xs">Acessando grade clínica...</div>
           ) : filteredAppointments.length === 0 ? (
              <div className="p-24 text-center bg-white rounded-[3.5rem] border border-dashed border-slate-200">
                 <Calendar className="w-16 h-16 text-slate-100 mx-auto mb-6" />
                 <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">Agenda Livre</h3>
                 <p className="text-slate-400 mt-2 font-black uppercase text-[10px] tracking-widest">Nenhuma consulta registrada para esta data.</p>
              </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                {filteredAppointments.sort((a,b) => a.appointment_date.localeCompare(b.appointment_date)).map(a => (
                   <div key={a.id} className="bg-white p-6 md:p-8 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-6 hover:border-brand-300 transition-all group overflow-hidden relative">
                      
                      <div className="flex items-center gap-6 w-full sm:w-auto z-10">
                         <div className="w-16 h-16 bg-slate-50 text-brand-600 rounded-2xl flex flex-col items-center justify-center font-black transition-colors group-hover:bg-brand-600 group-hover:text-white">
                            <span className="text-[10px] leading-none mb-1">{format(parseISO(a.appointment_date), "HH:mm")}</span>
                            <span className="text-[7px] uppercase tracking-widest">Sessão</span>
                         </div>
                         <div className="flex-1">
                            <h4 className="font-black text-slate-950 text-xl tracking-tighter uppercase leading-tight mb-2 truncate max-w-[200px]">{a.patient_name}</h4>
                            <div className="flex flex-wrap gap-2">
                               <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${a.status === 'confirmed' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : a.status === 'finished' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                  {a.status === 'confirmed' ? 'Confirmado' : a.status === 'finished' ? 'Finalizado' : 'Pendente'}
                               </span>
                               {a.status === 'finished' && (
                                 <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${a.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                    {a.payment_status === 'paid' ? 'PAGO' : 'PENDENTE'}
                                 </span>
                               )}
                            </div>
                         </div>
                      </div>

                      <div className="flex items-center gap-3 w-full sm:w-auto relative z-10 pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-50">
                         {a.status !== 'finished' && (
                            <button 
                              onClick={() => handleOpenFinishModal(a)}
                              className="flex-1 sm:flex-none h-14 px-6 bg-brand-50 text-brand-700 font-black text-[10px] rounded-2xl hover:bg-brand-600 hover:text-white transition-all uppercase tracking-widest shadow-sm active:scale-95"
                            >
                               FINALIZAR
                            </button>
                         )}
                         <button 
                           onClick={() => handlePatientNavigate(a)}
                           className="flex-1 sm:flex-none h-14 px-6 bg-slate-950 text-white font-black text-[10px] rounded-2xl hover:bg-brand-600 transition-all uppercase tracking-widest shadow-xl shadow-slate-950/20 active:scale-95 flex items-center justify-center gap-3"
                         >
                            <FileText className="w-4 h-4" /> PRONTUÁRIO
                         </button>
                      </div>
                   </div>
                ))}
             </div>
           )}
        </div>
      </div>

      {/* FINISH SESSION MODAL (Payment Picker) */}
      <AnimatePresence>
        {showFinishModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowFinishModal(null)} 
             />
             <motion.div 
               initial={{ y: 20, scale: 0.95 }} animate={{ y: 0, scale: 1 }} exit={{ y: 20, scale: 0.95 }}
               className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden"
             >
                <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                   <h3 className="font-black text-slate-950 uppercase text-[10px] tracking-[0.3em]">Finalizar Sessão</h3>
                   <button onClick={() => setShowFinishModal(null)} className="w-10 h-10 bg-white border rounded-full flex items-center justify-center">✕</button>
                </div>

                <div className="p-8 space-y-8">
                   <div className="text-center">
                      <p className="text-xs font-black text-brand-600 uppercase tracking-widest mb-2">PACIENTE</p>
                      <h4 className="text-3xl font-black text-slate-950 uppercase tracking-tighter mb-4">{showFinishModal.patient_name}</h4>
                      
                      <div className="flex flex-col items-center gap-1">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor Cobrado (R$)</label>
                         <input 
                           type="number" 
                           value={finishData.price} 
                           onChange={e => setFinishData({...finishData, price: Number(e.target.value)})}
                           className="bg-slate-50 border-none font-black text-3xl text-center text-slate-900 focus:ring-0 w-32 rounded-xl"
                         />
                      </div>
                   </div>

                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block text-center">Forma de Pagamento</label>
                      <div className="grid grid-cols-2 gap-3">
                         {[
                           { id: 'pix', label: 'PIX', icon: Smartphone },
                           { id: 'money', label: 'Dinheiro', icon: Banknote },
                           { id: 'card', label: 'Cartão', icon: CreditCard },
                           { id: 'other', label: 'Outro', icon: Wallet }
                         ].map(m => (
                           <button 
                             key={m.id} onClick={() => setFinishData({...finishData, payment_method: m.id as any})}
                             className={`p-5 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${finishData.payment_method === m.id ? 'bg-brand-50 border-brand-500 text-brand-700 shadow-lg' : 'bg-white border-slate-100 text-slate-300'}`}
                           >
                             <m.icon className="w-5 h-5" />
                             <span className="font-black uppercase text-[10px] tracking-widest">{m.label}</span>
                           </button>
                         ))}
                      </div>
                   </div>

                   <div className="flex gap-3">
                      <button 
                        onClick={() => { setFinishData({...finishData, payment_status: 'unpaid'}); handleFinishSession(); }}
                        className="flex-1 py-5 bg-slate-50 text-slate-400 font-black text-[10px] uppercase rounded-2xl active:bg-slate-200 transition-all hover:text-slate-900 border border-slate-100"
                      >
                         Pendente
                      </button>
                      <button 
                        onClick={() => { setFinishData({...finishData, payment_status: 'paid'}); handleFinishSession(); }}
                        className="flex-[2] py-5 bg-emerald-600 text-white font-black text-[10px] uppercase rounded-2xl shadow-xl shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                      >
                         <CheckCircle2 className="w-5 h-5" /> Confirmar Pago
                      </button>
                   </div>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
