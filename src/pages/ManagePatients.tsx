import { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import type { Patient } from '../types';
import { 
  Users, 
  Search, 
  Plus, 
  UserPlus,
  CheckCircle2, 
  Download,
  FileText,
  Trash2,
  X,
  Smartphone,
  Mail,
  CreditCard,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

export default function ManagePatients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState<'create' | 'edit' | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [formData, setFormData] = useState<Partial<Patient>>({
    full_name: '',
    whatsapp: '',
    email: '',
    cpf: '',
    date_of_birth: '',
    notes: '',
    base_session_value: 160,
    status: 'active'
  });

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // ----- [AUTO-SYNC] -----
    // Sincroniza agendamentos "soltos" (sem vínculo formal) com a base de pacientes
    try {
      const { data: orphans } = await supabase
        .from('appointments')
        .select('whatsapp, patient_name')
        .eq('doctor_id', user.id)
        .is('patient_id', null);

      if (orphans && orphans.length > 0) {
        const patientMap = new Map();
        orphans.forEach(a => {
          if (!a.whatsapp) return;
          if (!patientMap.has(a.whatsapp)) {
            patientMap.set(a.whatsapp, a.patient_name);
          }
        });

        for (const [whatsapp, name] of patientMap) {
          const { data: ptData } = await supabase
            .from('patients')
            .upsert({
              doctor_id: user.id,
              full_name: name,
              whatsapp: whatsapp,
              status: 'active'
            }, { onConflict: 'doctor_id,whatsapp' })
            .select()
            .maybeSingle();

          if (ptData) {
            await supabase
              .from('appointments')
              .update({ patient_id: ptData.id })
              .eq('doctor_id', user.id)
              .eq('whatsapp', whatsapp);
          }
        }
      }
    } catch (err) {
      console.warn('Silent sync error');
    }

    const { data } = await supabase
      .from('patients')
      .select('*')
      .eq('doctor_id', user.id)
      .order('full_name');
    
    if (data) setPatients(data as Patient[]);
    setLoading(false);
  };

  const handleSavePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setLoading(true);
    if (showModal === 'create') {
      const { error } = await supabase
        .from('patients')
        .insert([{ ...formData, doctor_id: user.id }]);
      
      if (!error) {
        setShowModal(null);
        fetchPatients();
      } else {
        alert('Erro ao cadastrar: ' + error.message);
      }
    } else if (showModal === 'edit' && selectedPatient) {
      const { error } = await supabase
        .from('patients')
        .update(formData)
        .eq('id', selectedPatient.id);
      
      if (!error) {
        setShowModal(null);
        fetchPatients();
      } else {
        alert('Erro ao atualizar: ' + error.message);
      }
    }
    setLoading(false);
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const { error } = await supabase.from('patients').update({ status: newStatus }).eq('id', id);
    if (!error) {
      setPatients(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
    }
  };

  const handleDeletePatient = async (id: string) => {
    if (!window.confirm('CUIDADO CRÍTICO: Você está prestes a excluir permanentemente este paciente e TODO o histórico clínico dele. Esta ação não pode ser desfeita. Deseja prosseguir?')) return;
    
    const { error } = await supabase.from('patients').delete().eq('id', id);
    if (!error) {
      setPatients(prev => prev.filter(p => p.id !== id));
    }
  };

  const openEditModal = (p: Patient) => {
    setSelectedPatient(p);
    setFormData(p);
    setShowModal('edit');
  };

  const openCreateModal = () => {
    setSelectedPatient(null);
    setFormData({
      full_name: '',
      whatsapp: '',
      email: '',
      cpf: '',
      date_of_birth: '',
      notes: '',
      base_session_value: 160,
      status: 'active'
    });
    setShowModal('create');
  };

  const handleExportCSV = () => {
    const headers = ['Nome Completo', 'WhatsApp', 'Email', 'CPF', 'Data de Nascimento', 'Valor Base', 'Status'];
    const rows = patients.map(p => [
      p.full_name,
      p.whatsapp || '',
      p.email || '',
      p.cpf || '',
      p.date_of_birth || '',
      p.base_session_value || 160,
      p.status === 'active' ? 'Ativo' : 'Inativo'
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `pacientes-psi-${format(new Date(), 'dd-MM-yyyy')}.csv`);
    link.click();
  };

  const filtered = patients.filter(p => 
    p.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.whatsapp && p.whatsapp.includes(searchTerm))
  );

  return (
    <div className="space-y-12 animate-in fade-in duration-800 pb-32">
      
      {/* PROFESSIONAL HEADER SECTION */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 pt-4">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-50 text-brand-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-brand-100">
             <div className="w-1.5 h-1.5 bg-brand-600 rounded-full animate-pulse"></div>
             Célula de Atendimento v4.0
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-slate-950 tracking-tighter uppercase leading-none">
             Gestão de Pacientes
          </h1>
          <p className="text-slate-400 font-bold max-w-xl uppercase text-[10px] tracking-widest leading-relaxed">
             Acompanhamento de fluxo clínico, registros de prontuário e gerenciamento de status ativo/inativo para otimização de agenda.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
           <button 
             onClick={handleExportCSV}
             className="h-14 px-6 bg-white text-slate-900 border border-slate-200 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition shadow-sm flex items-center gap-3 active:scale-95"
           >
             <Download className="w-4 h-4" /> Exportar Dados
           </button>
           <button 
             onClick={openCreateModal}
             className="h-14 px-8 bg-brand-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-brand-500/30 flex items-center gap-3 hover:bg-brand-700 active:scale-95 transition-all"
           >
             <UserPlus className="w-5 h-5" /> Novo Cadastro
           </button>
        </div>
      </div>

      {/* SEARCH AND KPI BAR */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
           <div className="relative group h-full">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5 group-focus-within:text-brand-600 transition-colors" />
              <input 
                type="text" placeholder="PESQUISAR POR NOME OU WHATSAPP..."
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                className="w-full h-20 pl-16 pr-8 bg-white rounded-[2.5rem] border-none shadow-sm focus:shadow-xl focus:shadow-brand-500/5 focus:ring-4 focus:ring-brand-500/10 transition-all font-black text-slate-900 uppercase tracking-widest text-xs outline-none"
              />
           </div>
        </div>
        <div className="bg-slate-950 rounded-[2.5rem] p-6 flex flex-col justify-center border border-slate-800 shadow-2xl relative overflow-hidden">
           <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest relative z-10">Total de Pacientes</p>
           <h4 className="text-3xl font-black text-white leading-none mt-1 relative z-10">{patients.length}</h4>
           <div className="absolute right-[-10px] bottom-[-10px] text-brand-600/10"><Users className="w-24 h-24" /></div>
        </div>
      </div>

      {/* PATIENTS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        <AnimatePresence mode='popLayout'>
        {loading ? (
             Array.from({length: 6}).map((_, i) => (
                <div key={i} className="h-80 bg-slate-50 rounded-[3rem] animate-pulse border border-slate-100"></div>
             ))
        ) : filtered.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="col-span-full h-96 flex flex-col items-center justify-center text-center bg-white rounded-[4rem] border-2 border-dashed border-slate-100 p-10"
          >
             <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-8">
                <Users className="w-10 h-10 text-slate-200" />
             </div>
             <h3 className="text-2xl font-black text-slate-950 uppercase tracking-tighter">Base Vazia</h3>
             <p className="text-slate-400 mt-2 font-bold uppercase text-[10px] tracking-widest max-w-xs">Nenhum paciente encontrado para os critérios de busca ou cadastro.</p>
          </motion.div>
        ) : (
          filtered.map(p => (
            <motion.div 
              layout key={p.id}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              className={`bg-white rounded-[3.5rem] p-10 shadow-sm border border-slate-100 hover:shadow-2xl hover:shadow-slate-200/40 transition-all group relative overflow-hidden flex flex-col justify-between ${p.status === 'inactive' ? 'opacity-70 grayscale-[0.4]' : ''}`}
            >
               {/* CARD HEADER */}
               <div className="flex items-start justify-between mb-8">
                  <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center font-black text-2xl shadow-inner transition-transform group-hover:scale-110 active:scale-95 duration-500 ${p.status === 'inactive' ? 'bg-slate-50 text-slate-300' : 'bg-brand-50 text-brand-600'}`}>
                     {p.full_name.charAt(0)}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                     <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${p.status === 'inactive' ? 'bg-slate-50 text-slate-400 border-slate-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                        {p.status === 'inactive' ? 'Inativo' : 'Ativo'}
                     </span>
                     {p.base_session_value && (
                        <div className="text-[10px] font-black text-slate-900 bg-slate-50 px-3 py-1 rounded-lg">R$ {p.base_session_value}</div>
                     )}
                  </div>
               </div>
               
               {/* PATIENT INFO */}
               <div className="space-y-2 mb-10">
                  <h3 className="text-2xl font-black text-slate-950 group-hover:text-brand-700 transition-colors uppercase tracking-tighter truncate">{p.full_name}</h3>
                  <div className="flex flex-col gap-1.5 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                     <div className="flex items-center gap-2"><Smartphone className="w-3 h-3" /> {p.whatsapp || 'Não informado'}</div>
                     <div className="flex items-center gap-2"><Mail className="w-3 h-3" /> {p.email || 'Não informado'}</div>
                  </div>
               </div>

               {/* ACTIONS GRID */}
               <div className="grid grid-cols-4 gap-3 bg-slate-50/50 p-3 rounded-[2.5rem] border border-slate-100/50">
                  <Link 
                    to={`/admin/pacientes/${p.id}`} title="Prontuário Completo"
                    className="col-span-2 h-16 bg-slate-950 text-white rounded-2xl flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-widest hover:bg-brand-600 transition-all shadow-lg active:scale-95"
                  >
                     <FileText className="w-4 h-4" /> PRONTUÁRIO
                  </Link>
                  <button 
                    onClick={() => openEditModal(p)} title="Editar Ficha"
                    className="h-16 bg-white text-slate-400 rounded-2xl border border-slate-100 flex items-center justify-center hover:text-brand-600 hover:border-brand-200 transition-all active:scale-95"
                  >
                     <Plus className="w-5 h-5 rotate-45" />
                  </button>
                  <button 
                    onClick={() => handleToggleStatus(p.id, p.status || 'active')}
                    title={p.status === 'inactive' ? 'Ativar' : 'Desativar'}
                    className={`h-16 rounded-2xl border transition-all flex items-center justify-center active:scale-95 ${p.status === 'inactive' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-white text-slate-300 border-slate-100 hover:text-amber-500 hover:bg-amber-50'}`}
                  >
                     <CheckCircle2 className="w-5 h-5" />
                  </button>
               </div>

               {/* DELETE BUTTON (SUBTLE) */}
               <button 
                 onClick={() => handleDeletePatient(p.id)}
                 className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 p-3 text-slate-200 hover:text-red-500 transition-all"
               >
                  <Trash2 className="w-5 h-5" />
               </button>
               
               {/* Decorative Gradient Overlay */}
               <div className="absolute inset-0 bg-gradient-to-tr from-brand-600/[0.02] to-transparent pointer-events-none"></div>
            </motion.div>
          ))
        )}
        </AnimatePresence>
      </div>

      {/* MODAL: CREATE / EDIT PATIENT */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center px-4 overflow-y-auto pt-20 pb-10">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" onClick={() => setShowModal(null)} />
             
             <motion.div 
               initial={{ y: 50, scale: 0.9, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }} exit={{ y: 50, scale: 0.9, opacity: 0 }}
               className="bg-white w-full max-w-2xl rounded-[3.5rem] shadow-2xl relative z-10 overflow-hidden flex flex-col"
             >
                <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                    <div>
                       <h3 className="font-black text-slate-950 uppercase text-[10px] tracking-[0.4em] mb-1">
                          {showModal === 'create' ? 'Novo Cadastro Profissional' : 'Edição Cadastral'}
                       </h3>
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Preencha todos os campos para uma ficha clínica completa.</p>
                    </div>
                    <button onClick={() => setShowModal(null)} className="w-12 h-12 bg-white border border-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-950 transition-colors shadow-sm">
                       <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSavePatient} className="p-10 space-y-8 overflow-y-auto max-h-[70vh]">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3">
                            <Users className="w-3 h-3" /> Nome Completo
                         </label>
                         <input 
                           required type="text" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})}
                           className="w-full h-16 px-6 bg-slate-50 rounded-2xl border-none outline-none font-black text-slate-900 focus:ring-4 focus:ring-brand-500/10 transition-all uppercase text-[11px]"
                         />
                      </div>
                      <div className="space-y-4">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3">
                            <Smartphone className="w-3 h-3" /> WhatsApp / Celular
                         </label>
                         <input 
                           type="tel" value={formData.whatsapp || ''} onChange={e => setFormData({...formData, whatsapp: e.target.value})}
                           placeholder="55XXXXXXXXXXX"
                           className="w-full h-16 px-6 bg-slate-50 rounded-2xl border-none outline-none font-black text-slate-900 focus:ring-4 focus:ring-brand-500/10 transition-all text-sm"
                         />
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3">
                            <Mail className="w-3 h-3" /> E-mail (Opcional)
                         </label>
                         <input 
                           type="email" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})}
                           className="w-full h-16 px-6 bg-slate-50 rounded-2xl border-none outline-none font-black text-slate-900 focus:ring-4 focus:ring-brand-500/10 transition-all text-sm"
                         />
                      </div>
                      <div className="space-y-4">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3">
                            <CreditCard className="w-3 h-3" /> CPF / Documento
                         </label>
                         <input 
                           type="text" value={formData.cpf || ''} onChange={e => setFormData({...formData, cpf: e.target.value})}
                           className="w-full h-16 px-6 bg-slate-50 rounded-2xl border-none outline-none font-black text-slate-900 focus:ring-4 focus:ring-brand-500/10 transition-all text-sm"
                          />
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3">
                            <Calendar className="w-3 h-3" /> Data de Nascimento
                         </label>
                         <input 
                           type="date" value={formData.date_of_birth || ''} onChange={e => setFormData({...formData, date_of_birth: e.target.value})}
                           className="w-full h-16 px-6 bg-slate-50 rounded-2xl border-none outline-none font-black text-slate-900 focus:ring-4 focus:ring-brand-500/10 transition-all"
                         />
                      </div>
                      <div className="space-y-4">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3">
                            <CreditCard className="w-3 h-3" /> Valor por Sessão (R$)
                         </label>
                         <input 
                           type="number" value={formData.base_session_value || ''} onChange={e => setFormData({...formData, base_session_value: Number(e.target.value)})}
                           className="w-full h-16 px-6 bg-slate-50 rounded-2xl border-none outline-none font-black text-brand-600 focus:ring-4 focus:ring-brand-500/10 transition-all text-sm"
                         />
                      </div>
                   </div>

                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3">
                         Observações Gerais
                      </label>
                      <textarea 
                        value={formData.notes || ''} onChange={e => setFormData({...formData, notes: e.target.value})}
                        className="w-full p-6 bg-slate-50 rounded-3xl border-none outline-none font-bold text-slate-700 min-h-[120px] focus:ring-4 focus:ring-brand-500/10 transition-all"
                        placeholder="..."
                      />
                   </div>

                   <button 
                     type="submit" disabled={loading}
                     className="w-full py-6 bg-brand-600 text-white font-black text-[10px] uppercase tracking-[0.3em] rounded-[2rem] shadow-xl shadow-brand-500/20 active:scale-95 transition-all flex items-center justify-center gap-4"
                   >
                     {loading ? 'Processando...' : showModal === 'create' ? 'Cadastrar Novo Paciente' : 'Atualizar Dados Clínicos'}
                   </button>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FOOTER SYNC ALERT */}
      {!patients.some(p => p.whatsapp) && patients.length > 0 && (
        <div className="p-8 bg-amber-50 rounded-[2.5rem] border border-amber-100 flex items-start gap-6 shadow-sm">
           <AlertCircle className="w-8 h-8 text-amber-500 flex-shrink-0" />
           <div>
              <p className="text-amber-800 font-black uppercase text-xs tracking-widest mb-1">Inconsistência de Dados Cadastrais</p>
              <p className="text-amber-700 font-medium text-sm leading-relaxed">
                 Identificamos registros provenientes do agendamento sem dados completos (CPF/Email). Recomendamos atualizar a ficha desses pacientes para uma gestão financeira e clínica completa.
              </p>
           </div>
        </div>
      )}
    </div>
  );
}
