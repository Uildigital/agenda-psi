import { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
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
  FileText,
  Clock,
  XCircle,
  MoreVertical,
  Trash2,
  CalendarDays,
  UserCheck,
  UserMinus,
  RotateCcw
} from 'lucide-react';
import { format, parseISO, addDays, subDays, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

export default function AgendaCompleta() {
  const navigate = useNavigate();
  const location = useLocation();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [showFinishModal, setShowFinishModal] = useState<Appointment | null>(null);
  const [showEditModal, setShowEditModal] = useState<Appointment | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const [finishData, setFinishData] = useState({
    payment_status: 'paid' as 'paid' | 'unpaid',
    payment_method: 'pix' as 'pix' | 'money' | 'card' | 'other',
    price: 160
  });

  const [editData, setEditData] = useState({
    appointment_date: '',
    notes: ''
  });

  const [newData, setNewData] = useState({
    patient_name: '',
    whatsapp: '',
    appointment_date: format(new Date(), "yyyy-MM-dd'T'14:00"),
    notes: ''
  });

  useEffect(() => {
    fetchData();
    if (location.search.includes('new=true')) setShowCreateModal(true);
  }, [location.search]);

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: appts } = await supabase.from('appointments').select('*').eq('doctor_id', user.id);
    const { data: pts } = await supabase.from('patients').select('*').eq('doctor_id', user.id);
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
    
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

  const handleUpdateStatus = async (id: string, status: Appointment['status']) => {
    const { error } = await supabase.from('appointments').update({ status }).eq('id', id);
    if (!error) {
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    }
  };

  const handleOpenFinishModal = (appt: Appointment) => {
    setFinishData({
       ...finishData,
       price: getPrice(appt)
    });
    setShowFinishModal(appt);
  };

  const handleOpenEditModal = (appt: Appointment) => {
    setEditData({
      appointment_date: format(parseISO(appt.appointment_date), "yyyy-MM-dd'T'HH:mm"),
      notes: appt.notes || ''
    });
    setShowEditModal(appt);
  };

  const handleEditSave = async () => {
    if (!showEditModal) return;
    const { error } = await supabase.from('appointments').update({
       appointment_date: editData.appointment_date,
       notes: editData.notes
    }).eq('id', showEditModal.id);

    if (!error) {
       setAppointments(prev => prev.map(a => a.id === showEditModal.id ? { ...a, ...editData } : a));
       setShowEditModal(null);
    }
  };

  const handleCreateSave = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('appointments').insert([{
       ...newData,
       doctor_id: user.id,
       status: 'pending'
    }]);

    if (!error) {
       setShowCreateModal(false);
       fetchData();
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esse agendamento?')) return;
    const { error } = await supabase.from('appointments').delete().eq('id', id);
    if (!error) {
       setAppointments(prev => prev.filter(a => a.id !== id));
    }
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
      
      {/* Header Profissional */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none">Agenda Clínica</h1>
          <p className="text-slate-400 font-bold tracking-tight text-xs uppercase tracking-widest mt-2">{format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="flex bg-white p-2 rounded-2xl border border-slate-100 shadow-sm gap-2">
              <button onClick={() => setSelectedDate(subDays(selectedDate, 1))} className="p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"><ChevronLeft className="w-5 h-5 text-slate-600" /></button>
              <button onClick={() => setSelectedDate(new Date())} className="px-4 py-2 font-black text-[10px] uppercase tracking-widest flex items-center gap-2">HOJE</button>
              <button onClick={() => setSelectedDate(addDays(selectedDate, 1))} className="p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"><ChevronRight className="w-5 h-5 text-slate-600" /></button>
           </div>
           <button onClick={() => setShowCreateModal(true)} className="h-14 px-6 bg-brand-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-brand-500/20 flex items-center gap-3 active:scale-95 transition-all">
              <Plus className="w-5 h-5" /> NOVO
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
           <div className="relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text" placeholder="BUSCAR NA LISTA..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-white pl-14 pr-6 py-5 rounded-2xl border-none font-bold uppercase text-xs tracking-widest shadow-sm focus:ring-4 focus:ring-brand-500/10 transition-all outline-none"
              />
           </div>
           
           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
              <h3 className="font-black text-slate-400 text-[10px] uppercase tracking-widest mb-4">Gestão de Status</h3>
              <div className="space-y-4">
                 <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
                    <div className="w-4 h-4 rounded-full bg-amber-400"></div> Pendente
                 </div>
                 <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
                    <div className="w-4 h-4 rounded-full bg-indigo-500"></div> Confirmado
                 </div>
                 <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
                    <div className="w-4 h-4 rounded-full bg-emerald-500"></div> Finalizado
                 </div>
                 <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
                    <div className="w-4 h-4 rounded-full bg-red-400"></div> Cancelado / Falta
                 </div>
              </div>
           </div>
        </div>

        <div className="lg:col-span-3 space-y-4">
           {loading ? (
              <div className="p-20 text-center animate-pulse text-slate-300 font-bold uppercase tracking-widest text-xs">Sincronizando...</div>
           ) : filteredAppointments.length === 0 ? (
              <div className="p-24 text-center bg-white rounded-[4rem] border border-dashed border-slate-200">
                 <Calendar className="w-16 h-16 text-slate-100 mx-auto mb-6" />
                 <h3 className="text-xl font-black text-slate-950 uppercase tracking-tight">Horários Livres</h3>
                 <p className="text-slate-400 mt-2 font-black uppercase text-[10px] tracking-widest">Nenhuma atividade registrada.</p>
              </div>
           ) : (
              <div className="space-y-4">
                 {filteredAppointments.sort((a,b) => a.appointment_date.localeCompare(b.appointment_date)).map(a => (
                    <div key={a.id} className="bg-white p-6 md:p-10 rounded-[3.5rem] shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-8 group relative overflow-hidden active:scale-[0.99] transition-all">
                       
                       <div className="flex items-center gap-8 w-full md:w-auto">
                          <div className={`w-20 h-20 rounded-[2rem] flex flex-col items-center justify-center font-black transition-all ${a.status === 'confirmed' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : a.status === 'finished' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : a.status === 'cancelled' || a.status === 'no_show' ? 'bg-red-50 text-red-500' : 'bg-slate-50 text-brand-600'}`}>
                             <span className="text-xl leading-none mb-1">{format(parseISO(a.appointment_date), "HH:mm")}</span>
                             <span className="text-[7px] uppercase font-black tracking-widest opacity-60">Sessão</span>
                          </div>
                          <div>
                             <h4 className="font-black text-slate-900 text-2xl tracking-tighter uppercase leading-tight mb-2">{a.patient_name}</h4>
                             <div className="flex items-center gap-3">
                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${a.status === 'confirmed' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : a.status === 'finished' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : (a.status === 'cancelled' || a.status === 'no_show') ? 'bg-red-50 text-red-600 border-red-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                   {a.status === 'confirmed' ? 'Confirmado' : a.status === 'finished' ? 'Finalizado' : a.status === 'cancelled' ? 'Cancelado' : a.status === 'no_show' ? 'Falta (No-show)' : 'Pendente'}
                                </span>
                             </div>
                          </div>
                       </div>

                       <div className="flex items-center gap-3 w-full md:w-auto bg-slate-50/50 p-2 rounded-[2rem] border border-slate-50">
                          {a.status === 'pending' && (
                             <button onClick={() => handleUpdateStatus(a.id, 'confirmed')} className="p-4 bg-white text-indigo-600 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm" title="Confirmar">
                                <UserCheck className="w-6 h-6" />
                             </button>
                          )}
                          
                          {a.status !== 'finished' && a.status !== 'cancelled' && (
                             <button onClick={() => handleOpenFinishModal(a)} className="h-14 px-6 bg-brand-600 text-white font-black text-[9px] rounded-2xl hover:bg-brand-700 transition-all uppercase tracking-widest shadow-lg shadow-brand-500/20">
                                FINALIZAR
                             </button>
                          )}

                          <button onClick={() => handleOpenEditModal(a)} className="p-4 bg-white text-slate-400 rounded-2xl hover:bg-slate-900 hover:text-white transition-all shadow-sm" title="Reagendar">
                             <CalendarDays className="w-6 h-6" />
                          </button>

                          <button onClick={() => handleUpdateStatus(a.id, 'cancelled')} className="p-4 bg-white text-red-400 rounded-2xl hover:bg-red-600 hover:text-white transition-all shadow-sm" title="Cancelar">
                             <XCircle className="w-6 h-6" />
                          </button>
                          
                          <button onClick={() => handlePatientNavigate(a)} className="p-4 bg-slate-950 text-white rounded-2xl hover:bg-brand-600 transition-all shadow-sm" title="Prontuário">
                             <FileText className="w-6 h-6" />
                          </button>

                          <button onClick={() => handleDelete(a.id)} className="p-4 bg-white text-slate-300 rounded-2xl hover:bg-red-600 hover:text-white transition-all shadow-sm" title="Excluir Permanentemente">
                             <Trash2 className="w-5 h-5" />
                          </button>
                       </div>
                    </div>
                 ))}
              </div>
           )}
        </div>
      </div>

      {/* MODAL: FINALIZAR SESSÃO */}
      <AnimatePresence>
        {showFinishModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowFinishModal(null)} />
             <motion.div initial={{ y: 20, scale: 0.95 }} animate={{ y: 0, scale: 1 }} exit={{ y: 20, scale: 0.95 }} className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl relative z-10 overflow-hidden">
                <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                   <h3 className="font-black text-slate-950 uppercase text-[9px] tracking-widest">Finalização de Atendimento</h3>
                   <button onClick={() => setShowFinishModal(null)} className="w-10 h-10 bg-white border rounded-full flex items-center justify-center">✕</button>
                </div>
                <div className="p-10 space-y-10">
                   <div className="text-center">
                      <p className="text-[9px] font-black text-brand-600 uppercase tracking-widest mb-2">PACIENTE</p>
                      <h4 className="text-3xl font-black text-slate-950 uppercase tracking-tighter mb-8">{showFinishModal.patient_name}</h4>
                      <div className="bg-slate-50 p-6 rounded-3xl inline-flex flex-col items-center">
                         <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Valor Total (R$)</label>
                         <input type="number" value={finishData.price} onChange={e => setFinishData({...finishData, price: Number(e.target.value)})} className="bg-transparent border-none font-black text-4xl text-center text-slate-950 focus:ring-0 w-32" />
                      </div>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      {[{id:'pix',l:'PIX',i:Smartphone},{id:'money',l:'Dinheiro',i:Banknote},{id:'card',l:'Cartão',i:CreditCard},{id:'other',l:'Outro',i:Wallet}].map(m=>(
                        <button key={m.id} onClick={()=>setFinishData({...finishData,payment_method:m.id as any})} className={`p-6 rounded-[2rem] border-2 flex flex-col items-center gap-3 transition-all ${finishData.payment_method===m.id?'bg-brand-50 border-brand-500 text-brand-700 shadow-xl shadow-brand-500/10':'bg-white border-slate-100 text-slate-300'}`}>
                           <m.i className="w-6 h-6" />
                           <span className="font-black uppercase text-[9px] tracking-widest">{m.l}</span>
                        </button>
                      ))}
                   </div>
                   <div className="flex gap-4">
                      <button onClick={()=>{setFinishData({...finishData,payment_status:'unpaid'}); handleFinishSession();}} className="flex-1 py-6 bg-slate-100 text-slate-400 font-black text-[9px] uppercase rounded-[2rem] hover:bg-slate-200 transition-all">Pendente</button>
                      <button onClick={()=>{setFinishData({...finishData,payment_status:'paid'}); handleFinishSession();}} className="flex-[2] py-6 bg-emerald-600 text-white font-black text-[9px] uppercase rounded-[2rem] shadow-xl shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-3 font-black">
                         <CheckCircle2 className="w-5 h-5" /> Confirmar Pago
                      </button>
                   </div>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: REAGENDAR */}
      <AnimatePresence>
        {showEditModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowEditModal(null)} />
             <motion.div initial={{ y: 20 }} animate={{ y: 0 }} exit={{ y: 20 }} className="bg-white w-full max-w-lg rounded-[3.5rem] shadow-2xl relative z-10 p-10 space-y-8">
                <div className="flex justify-between items-center">
                   <h3 className="font-black text-slate-950 uppercase text-[9px] tracking-widest">Reagendamento Clínico</h3>
                   <button onClick={() => setShowEditModal(null)} className="w-10 h-10 flex items-center justify-center">✕</button>
                </div>
                <div className="space-y-6">
                   <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Nova Data e Hora</label>
                      <input type="datetime-local" value={editData.appointment_date} onChange={e => setEditData({...editData, appointment_date: e.target.value})} className="w-full p-5 bg-slate-50 border-none rounded-2xl font-black text-slate-900" />
                   </div>
                   <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Motivo do Reagendamento (Opcional)</label>
                      <textarea value={editData.notes} onChange={e => setEditData({...editData, notes: e.target.value})} className="w-full p-5 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 min-h-[100px]" placeholder="..." />
                   </div>
                </div>
                <button onClick={handleEditSave} className="w-full py-6 bg-brand-600 text-white font-black text-[10px] uppercase rounded-[2rem] shadow-xl shadow-brand-500/20 active:scale-95 transition-all">
                   Confirmar Mudança
                </button>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: NOVO AGENDAMENTO MANUAL */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
             <motion.div initial={{ y: 20 }} animate={{ y: 0 }} exit={{ y: 20 }} className="bg-white w-full max-w-lg rounded-[3.5rem] shadow-2xl relative z-10 p-10 space-y-8">
                <h3 className="font-black text-slate-950 uppercase text-[9px] tracking-widest">Novo Agendamento Manual</h3>
                <div className="space-y-4">
                   <input type="text" placeholder="NOME DO PACIENTE" value={newData.patient_name} onChange={e => setNewData({...newData, patient_name: e.target.value})} className="w-full p-5 bg-slate-50 border-none rounded-2xl font-black text-slate-900" />
                   <input type="tel" placeholder="WHATSAPP (DDD + NÚMERO)" value={newData.whatsapp} onChange={e => setNewData({...newData, whatsapp: e.target.value})} className="w-full p-5 bg-slate-50 border-none rounded-2xl font-black text-slate-900" />
                   <input type="datetime-local" value={newData.appointment_date} onChange={e => setNewData({...newData, appointment_date: e.target.value})} className="w-full p-5 bg-slate-50 border-none rounded-2xl font-black text-slate-900" />
                   <textarea placeholder="OBSERVAÇÕES" value={newData.notes} onChange={e => setNewData({...newData, notes: e.target.value})} className="w-full p-5 bg-slate-50 border-none rounded-2xl font-bold text-slate-700" />
                </div>
                <button onClick={handleCreateSave} className="w-full py-6 bg-brand-600 text-white font-black text-[10px] uppercase rounded-[2rem] shadow-xl shadow-brand-500/20 active:scale-95 transition-all">
                   Finalizar Agendamento
                </button>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
