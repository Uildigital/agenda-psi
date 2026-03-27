import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import type { Appointment, Patient } from '../types';
import { 
  Calendar, 
  Search, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Phone,
  User,
  History,
  DollarSign,
  Wallet,
  CreditCard,
  Banknote,
  Smartphone,
  Clock
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

export default function AgendaCompleta() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showNewModal, setShowNewModal] = useState(searchParams.get('new') === 'true');
  const [showFinishModal, setShowFinishModal] = useState<Appointment | null>(null);
  
  // States for new appointment
  const [newAppt, setNewAppt] = useState({
    patient_name: '',
    whatsapp: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '09:00',
    notes: '',
    price: 160
  });

  // Finish session states
  const [finishData, setFinishData] = useState({
    payment_status: 'paid' as 'paid' | 'unpaid',
    payment_method: 'pix' as 'pix' | 'money' | 'card' | 'other'
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: pts } = await supabase.from('patients').select('*').eq('doctor_id', user.id);
    const { data: appts } = await supabase
      .from('appointments')
      .select('*')
      .eq('doctor_id', user.id)
      .order('appointment_date', { ascending: false });
    
    if (pts) setPatients(pts as Patient[]);
    if (appts) setAppointments(appts as Appointment[]);
    setLoading(false);
  };

  const handlePatientClick = (appt: Appointment) => {
     if (appt.patient_id) {
        navigate(`/admin/pacientes/${appt.patient_id}`);
     } else {
        const pt = patients.find(p => p.whatsapp === appt.whatsapp || p.full_name === appt.patient_name);
        if (pt) navigate(`/admin/pacientes/${pt.id}`);
        else alert('Paciente não vinculado. Sincronize seus dados na aba Pacientes!');
     }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from('appointments')
      .update({ status })
      .eq('id', id);
    
    if (!error) {
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: status as any } : a));
    }
  };

  const handleFinishAndPay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showFinishModal) return;
    setSaving(true);
    
    const { error } = await supabase
      .from('appointments')
      .update({ 
        status: 'finished',
        payment_status: finishData.payment_status,
        payment_method: finishData.payment_method
      })
      .eq('id', showFinishModal.id);
    
    if (!error) {
      setAppointments(prev => prev.map(a => a.id === showFinishModal.id ? { 
        ...a, 
        status: 'finished',
        payment_status: finishData.payment_status,
        payment_method: finishData.payment_method
      } : a));
      setShowFinishModal(null);
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja cancelar este agendamento permanentemente?')) return;
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id);
    
    if (!error) {
      setAppointments(prev => prev.filter(a => a.id !== id));
    }
  };

  const handleCreateManual = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const appointmentDate = new Date(`${newAppt.date}T${newAppt.time}:00`).toISOString();

    const { data, error } = await supabase
      .from('appointments')
      .insert({
        doctor_id: user.id,
        patient_name: newAppt.patient_name,
        whatsapp: newAppt.whatsapp,
        appointment_date: appointmentDate,
        notes: newAppt.notes,
        status: 'confirmed',
        price: newAppt.price
      })
      .select()
      .single();

    if (!error && data) {
      setAppointments(prev => [data as Appointment, ...prev]);
      setShowNewModal(false);
      setNewAppt({ patient_name: '', whatsapp: '', date: format(new Date(), 'yyyy-MM-dd'), time: '09:00', notes: '', price: 160 });
      
      // Auto-sync patient
      await supabase.from('patients').upsert({
        doctor_id: user.id,
        full_name: newAppt.patient_name,
        whatsapp: newAppt.whatsapp,
        base_session_value: newAppt.price
      }, { onConflict: 'doctor_id,whatsapp' });
    }
    setSaving(false);
  };

  const filtered = appointments.filter(a => {
    const matchSearch = a.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) || a.whatsapp.includes(searchTerm);
    const matchStatus = filterStatus === 'all' || a.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return { label: 'Pendente', color: 'bg-amber-50 text-amber-700 border-amber-100' };
      case 'confirmed': return { label: 'Confirmado', color: 'bg-indigo-50 text-indigo-700 border-indigo-100' };
      case 'finished': return { label: 'Finalizado', color: 'bg-green-50 text-green-700 border-green-100' };
      case 'no_show': return { label: 'Faltou', color: 'bg-red-50 text-red-700 border-red-100' };
      default: return { label: status, color: 'bg-slate-50 text-slate-700 border-slate-100' };
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
             <Calendar className="w-8 h-8 text-brand-600" />
              Agenda Completa
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Controle total de seus atendimentos e histórico clínico.</p>
        </div>
        <button 
          onClick={() => setShowNewModal(true)}
          className="bg-slate-950 text-white font-bold px-8 py-4 rounded-2xl shadow-xl shadow-slate-950/20 flex items-center gap-3 hover:bg-slate-800 transition-all hover:-translate-y-1"
        >
          <Plus className="w-5 h-5" /> Novo Agendamento Manual
        </button>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-6 items-center">
        <div className="relative flex-1 w-full">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
           <input 
             type="text" placeholder="Buscar por paciente ou celular..."
             value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
             className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-4 focus:ring-brand-500/10 transition-all font-medium text-slate-700"
           />
        </div>
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 custom-scrollbar">
           {['all', 'pending', 'confirmed', 'finished', 'no_show'].map(s => (
             <button
               key={s} onClick={() => setFilterStatus(s)}
               className={`px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${filterStatus === s ? 'bg-brand-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
             >
               {s === 'all' ? 'Todos' : getStatusLabel(s).label}
             </button>
           ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/20 border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">
                <th className="px-8 py-5">Horário & Data</th>
                <th className="px-8 py-5">Paciente</th>
                <th className="px-8 py-5">Status / Pagto</th>
                <th className="px-8 py-5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={4} className="p-20 text-center text-slate-400 font-bold">Carregando sua agenda...</td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                   <td colSpan={4} className="p-20 text-center">
                      <History className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                      <p className="text-slate-400 font-medium">Nenhum atendimento encontrado para estes filtros.</p>
                   </td>
                </tr>
              ) : (
                filtered.map(a => {
                  const sInfo = getStatusLabel(a.status);
                  return (
                    <tr key={a.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-brand-600 font-black text-xs">
                              {format(parseISO(a.appointment_date), "dd/MM")}
                           </div>
                           <div>
                              <p className="font-black text-slate-900 text-lg leading-none">{format(parseISO(a.appointment_date), "HH:mm")}</p>
                              <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">
                                {format(parseISO(a.appointment_date), "eeee", { locale: ptBR })}
                              </p>
                           </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                           <button onClick={() => handlePatientClick(a)} className="text-left font-bold text-slate-900 group-hover:text-brand-700 transition-colors uppercase tracking-tight hover:underline">
                              {a.patient_name}
                           </button>
                           <span className="text-xs text-slate-400 font-medium flex items-center gap-2 mt-1">
                              <Phone className="w-3 h-3" /> {a.whatsapp}
                           </span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                         <div className="flex flex-col gap-2">
                           <span className={`w-fit px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${sInfo.color}`}>
                              {sInfo.label}
                           </span>
                           {a.status === 'finished' && (
                             <span className={`text-[8px] font-black uppercase tracking-[0.2em] ${a.payment_status === 'paid' ? 'text-emerald-500' : 'text-slate-400'}`}>
                               {a.payment_status === 'paid' ? `Pago via ${a.payment_method}` : 'Pagamento Pendente'}
                             </span>
                           )}
                         </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                         <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                            {a.status !== 'finished' && (
                               <button 
                                 title="Finalizar & Registrar Pagamento" onClick={() => setShowFinishModal(a)}
                                 className="p-3 bg-green-50 text-green-600 rounded-xl hover:bg-green-600 hover:text-white transition-all shadow-sm"
                               >
                                  <DollarSign className="w-4 h-4" />
                               </button>
                            )}
                            {a.status === 'pending' && (
                               <button 
                                 title="Confirmar" onClick={() => handleUpdateStatus(a.id, 'confirmed')}
                                 className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                               >
                                  <CheckCircle2 className="w-4 h-4" />
                               </button>
                            )}
                            {a.status !== 'no_show' && a.status !== 'finished' && (
                               <button 
                                 title="Marcar Falta" onClick={() => handleUpdateStatus(a.id, 'no_show')}
                                 className="p-3 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-600 hover:text-white transition-all shadow-sm"
                               >
                                  <AlertCircle className="w-4 h-4" />
                               </button>
                            )}
                            <button 
                              title="Cancelar/Excluir" onClick={() => handleDelete(a.id)}
                              className="p-3 bg-red-50 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
                            >
                               <Trash2 className="w-4 h-4" />
                            </button>
                         </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Appointment Modal */}
      <AnimatePresence>
        {showNewModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-0">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowNewModal(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
             <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
               className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
             >
                <div className="bg-slate-50 p-8 border-b border-slate-100 flex justify-between items-center">
                   <h2 className="text-2xl font-black text-slate-900 tracking-tight">Novo Agendamento</h2>
                   <button onClick={() => setShowNewModal(false)} className="text-slate-400 hover:text-slate-900"><XCircle className="w-6 h-6" /></button>
                </div>
                <form onSubmit={handleCreateManual} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                   <div className="space-y-4">
                      <div>
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-1">Paciente</label>
                        <div className="relative">
                           <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                           <input 
                             required type="text" placeholder="Nome completo" value={newAppt.patient_name} onChange={e => setNewAppt({...newAppt, patient_name: e.target.value})}
                             className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl outline-none focus:ring-4 focus:ring-brand-500/10 transition-all font-bold"
                           />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-1">
                          <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-1">WhatsApp</label>
                          <input 
                            required type="tel" placeholder="(00) 00000-0000" value={newAppt.whatsapp} onChange={e => setNewAppt({...newAppt, whatsapp: e.target.value})}
                            className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-4 focus:ring-brand-500/10 transition-all font-bold"
                          />
                        </div>
                        <div className="col-span-1">
                          <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-1">Valor Sessão</label>
                          <input 
                            required type="number" value={newAppt.price} onChange={e => setNewAppt({...newAppt, price: Number(e.target.value)})}
                            className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-4 focus:ring-brand-500/10 transition-all font-bold"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-1">Data</label>
                          <input 
                            required type="date" value={newAppt.date} onChange={e => setNewAppt({...newAppt, date: e.target.value})}
                            className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-4 focus:ring-brand-500/10 transition-all font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-1">Horário</label>
                          <input 
                            required type="time" value={newAppt.time} onChange={e => setNewAppt({...newAppt, time: e.target.value})}
                            className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-4 focus:ring-brand-500/10 transition-all font-bold"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-1">Notas (Opcional)</label>
                        <textarea 
                          rows={3} placeholder="Motivo ou observações rápidas..." value={newAppt.notes} onChange={e => setNewAppt({...newAppt, notes: e.target.value})}
                          className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-4 focus:ring-brand-500/10 transition-all font-bold resize-none"
                        />
                      </div>
                   </div>
                   <button 
                     disabled={saving} type="submit"
                     className="w-full py-5 bg-brand-600 text-white font-black rounded-2xl shadow-xl shadow-brand-500/20 hover:bg-brand-700 transition-all hover:scale-[1.02] flex items-center justify-center gap-3"
                   >
                     {saving ? <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div> : <><Plus className="w-5 h-5" /> Criar Agendamento</>}
                   </button>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Finish & Pay Modal */}
      <AnimatePresence>
        {showFinishModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-0">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowFinishModal(null)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
             <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
               className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
             >
                <div className="bg-emerald-50 p-8 border-b border-emerald-100 flex justify-between items-center text-emerald-900">
                   <div>
                      <h2 className="text-2xl font-black tracking-tight">Finalizar Sessão</h2>
                      <p className="text-[10px] font-black uppercase tracking-widest mt-1 opacity-60">{showFinishModal.patient_name}</p>
                   </div>
                   <XCircle className="w-6 h-6 opacity-30 cursor-pointer" onClick={() => setShowFinishModal(null)} />
                </div>
                <form onSubmit={handleFinishAndPay} className="p-10 space-y-8">
                   <div className="space-y-6">
                      <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100">
                         <div className="flex items-center gap-4">
                           <DollarSign className="w-6 h-6 text-emerald-600" />
                           <span className="font-extrabold text-slate-700">Valor da Sessão</span>
                         </div>
                         <span className="text-xl font-black text-slate-950">R$ {showFinishModal.price || 160}</span>
                      </div>

                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-2">Status do Recebimento</label>
                        <div className="grid grid-cols-2 gap-3">
                           {[
                             { id: 'paid', label: 'Já Recebido', icon: CheckCircle2 },
                             { id: 'unpaid', label: 'Pendente', icon: Clock }
                           ].map(p => (
                             <button
                               key={p.id} type="button" onClick={() => setFinishData({...finishData, payment_status: p.id as any})}
                               className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${finishData.payment_status === p.id ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}
                             >
                               <p.icon className="w-5 h-5" />
                               <span className="text-[10px] font-black uppercase tracking-widest">{p.label}</span>
                             </button>
                           ))}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-2">Forma de Pagamento</label>
                        <div className="grid grid-cols-2 gap-3">
                           {[
                             { id: 'pix', label: 'PIX', icon: Smartphone },
                             { id: 'money', label: 'Dinheiro', icon: Banknote },
                             { id: 'card', label: 'Cartão', icon: CreditCard },
                             { id: 'other', label: 'Outro', icon: Wallet }
                           ].map(m => (
                             <button
                               key={m.id} type="button" onClick={() => setFinishData({...finishData, payment_method: m.id as any})}
                               className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${finishData.payment_method === m.id ? 'bg-brand-50 border-brand-500 text-brand-700' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}
                             >
                               <m.icon className="w-5 h-5" />
                               <span className="text-[10px] font-black uppercase tracking-widest">{m.label}</span>
                             </button>
                           ))}
                        </div>
                      </div>
                   </div>

                   <button 
                     disabled={saving} type="submit"
                     className="w-full py-6 bg-slate-900 text-white font-black rounded-3xl shadow-2xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
                   >
                     {saving ? <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div> : 'Confirmar e Finalizar'}
                   </button>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
