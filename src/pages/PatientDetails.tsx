import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import type { Patient, MedicalRecord, Appointment } from '../types';
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  FileText, 
  Phone, 
  Mail, 
  CreditCard,
  History,
  Clock,
  User,
  Activity,
  Eye,
  EyeOff
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

export default function PatientDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showNewRecord, setShowNewRecord] = useState(false);
  
  // Privacy Mode defaults to HIDDEN (true)
  const [privacyMode, setPrivacyMode] = useState(true);
  
  // States for Editing Patient
  const [editPatient, setEditPatient] = useState<Partial<Patient>>({});
  
  // State for SOAP New Record
  const [newSoap, setNewSoap] = useState({
    subjetivo: '',
    objetivo: '',
    avaliacao: '',
    plano: ''
  });

  useEffect(() => {
    if (id) fetchData();
    const savedPrivacy = localStorage.getItem('psi_privacy_mode');
    // If we have a saved state, use it. Otherwise, default is true (hidden).
    if (savedPrivacy !== null) {
      setPrivacyMode(savedPrivacy === 'true');
    } else {
      setPrivacyMode(true); 
    }
  }, [id]);

  const togglePrivacy = () => {
    if (privacyMode) {
      // User wants to SEE values. Ask confirmation.
      if (window.confirm('Deseja tornar os valores visíveis agora?')) {
        setPrivacyMode(false);
        localStorage.setItem('psi_privacy_mode', 'false');
      }
    } else {
      // User wants to HIDE values. Just do it.
      setPrivacyMode(true);
      localStorage.setItem('psi_privacy_mode', 'true');
    }
  };

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !id) return;

    // Fetch Patient
    const { data: pt } = await supabase.from('patients').select('*').eq('id', id).single();
    if (pt) {
      setPatient(pt as Patient);
      setEditPatient(pt);
      
      // Fetch History using WhatsApp
      const { data: appts } = await supabase.from('appointments').select('*').eq('whatsapp', pt.whatsapp).order('appointment_date', { ascending: false });
      if (appts) setAppointments(appts as Appointment[]);
    }

    // Fetch Records
    const { data: recs } = await supabase.from('medical_records').select('*').eq('patient_id', id).order('created_at', { ascending: false });
    if (recs) setRecords(recs as MedicalRecord[]);

    setLoading(false);
  };

  const handleUpdatePatient = async () => {
    setSaving(true);
    const { error } = await supabase.from('patients').update(editPatient).eq('id', id);
    if (!error) {
       setPatient(prev => prev ? { ...prev, ...editPatient } : null);
       alert('Dados atualizados com sucesso!');
    } else {
       console.error('Update Patient Error:', error);
       alert('Erro ao salvar: ' + error.message);
    }
    setSaving(false);
  };

  const handleAddSoapRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !id) return;

    const content = `
SUBJETIVO: ${newSoap.subjetivo}
OBJETIVO: ${newSoap.objetivo}
AVALIAÇÃO: ${newSoap.avaliacao}
PLANO: ${newSoap.plano}
    `.trim();

    const { data, error } = await supabase
      .from('medical_records')
      .insert({
        patient_id: id,
        doctor_id: user.id,
        content: content,
        symptoms: newSoap.subjetivo.substring(0, 100),
        obs: newSoap.plano
      })
      .select()
      .single();

    if (!error && data) {
      setRecords(prev => [data as MedicalRecord, ...prev]);
      setShowNewRecord(false);
      setNewSoap({ subjetivo: '', objetivo: '', avaliacao: '', plano: '' });
    }
    setSaving(false);
  };

  if (loading) return (
    <div className="p-20 text-center animate-pulse">
       <div className="w-16 h-16 border-4 border-slate-100 border-t-brand-600 rounded-full animate-spin mx-auto mb-6"></div>
       <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Acessando Registro Clínico...</p>
    </div>
  );

  if (!patient) return <div className="p-10 text-center text-red-500 font-black">PACIENTE NÃO ENCONTRADO.</div>;

  return (
    <div className="animate-in fade-in duration-700 pb-32 space-y-10">
      
      {/* Header Sticky */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 sticky top-0 md:relative bg-slate-50/80 backdrop-blur-md py-4 z-40">
        <div className="flex items-center gap-6">
           <button onClick={() => navigate(-1)} className="p-4 bg-white text-slate-400 hover:text-brand-600 rounded-2xl shadow-sm border border-slate-100 transition-all">
              <ArrowLeft className="w-6 h-6" />
           </button>
           <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">{patient.full_name}</h1>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">ID Único: PSi-{(patient.id.substring(0,4)).toUpperCase()}</p>
           </div>
        </div>
        <div className="flex flex-wrap gap-3">
           <button 
             onClick={togglePrivacy}
             className="p-4 bg-white border-2 border-slate-100 text-slate-400 rounded-2xl hover:text-brand-600 transition shadow-sm"
             title={privacyMode ? "Mostrar Valores (Exige Confirmação)" : "Ocultar Valores"}
           >
             {privacyMode ? <Eye className="w-6 h-6" /> : <EyeOff className="w-6 h-6" />}
           </button>
           <button 
             onClick={handleUpdatePatient} disabled={saving}
             className="px-8 py-4 bg-white text-slate-900 border-2 border-slate-100 rounded-[2rem] font-black text-xs uppercase tracking-widest hover:border-brand-500 hover:text-brand-700 transition shadow-sm flex items-center gap-2"
           >
             {saving ? <Clock className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
             Salvar
           </button>
           <button 
             onClick={() => setShowNewRecord(true)}
             className="px-8 py-4 bg-brand-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-brand-700 transition shadow-xl shadow-brand-500/30 flex items-center gap-2 active:scale-95"
           >
             <Plus className="w-4 h-4" /> Nova Evolução
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Left Column: Patient Data */}
        <div className="space-y-10">
           <div className="bg-white rounded-[3rem] p-10 shadow-xl shadow-slate-200/20 border border-slate-100 space-y-8">
              <h3 className="text-[10px] font-black text-brand-600 uppercase tracking-[0.3em] flex items-center gap-3">
                <User className="w-5 h-5" /> Cadastro Geral
              </h3>
              
              <div className="space-y-6">
                 <div>
                    <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-2">Nome Completo</label>
                    <input 
                      type="text" value={editPatient.full_name} onChange={e => setEditPatient({...editPatient, full_name: e.target.value})}
                      className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-4 focus:ring-brand-500/10 transition-all font-bold text-slate-700"
                    />
                 </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                       <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-2">WhatsApp</label>
                       <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                          <input 
                            type="tel" value={editPatient.whatsapp || ''} onChange={e => setEditPatient({...editPatient, whatsapp: e.target.value})}
                            className="w-full pl-10 pr-4 py-4 bg-slate-50 rounded-2xl border-none font-bold"
                          />
                       </div>
                    </div>
                    <div>
                       <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-2">CPF</label>
                       <div className="relative">
                          <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                          <input 
                            type="text" value={editPatient.cpf || ''} onChange={e => setEditPatient({...editPatient, cpf: e.target.value})}
                            className="w-full pl-10 pr-4 py-4 bg-slate-50 rounded-2xl border-none font-bold"
                          />
                       </div>
                    </div>
                 </div>
                 <div>
                    <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-2">E-mail</label>
                    <div className="relative">
                       <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                       <input 
                         type="email" value={editPatient.email || ''} onChange={e => setEditPatient({...editPatient, email: e.target.value})}
                         className="w-full pl-10 pr-4 py-4 bg-slate-50 rounded-2xl border-none font-bold"
                       />
                    </div>
                 </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                       <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-1">Valor Sessão (R$)</label>
                       <input 
                         type={privacyMode ? "password" : "number"} value={editPatient.base_session_value || 160} onChange={e => setEditPatient({...editPatient, base_session_value: Number(e.target.value)})}
                         className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold outline-none"
                       />
                    </div>
                    <div>
                       <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-1">Data Nascimento</label>
                       <input 
                         type="date" value={editPatient.date_of_birth || ''} onChange={e => setEditPatient({...editPatient, date_of_birth: e.target.value})}
                         className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold outline-none"
                       />
                    </div>
                 </div>
                 <div>
                    <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-1">Notas Administrativas</label>
                    <textarea 
                      rows={3} value={editPatient.notes || ''} onChange={e => setEditPatient({...editPatient, notes: e.target.value})}
                      className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold resize-none outline-none"
                    />
                 </div>
              </div>
           </div>

           {/* Appointment History Quick View */}
           <div className="bg-slate-950 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                 <History className="w-5 h-5 text-brand-600" /> Histórico de Sessões
              </h3>
              <div className="space-y-6">
                 {appointments.length === 0 ? (
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest italic">Sem consultas registradas.</p>
                 ) : (
                    appointments.slice(0, 5).map(a => (
                       <div key={a.id} className="flex items-center justify-between group/item">
                          <div>
                             <p className="font-bold text-sm tracking-tight">{format(parseISO(a.appointment_date), "dd MMMM yyyy", { locale: ptBR })}</p>
                             <span className={`text-[10px] font-black uppercase tracking-widest ${a.status === 'finished' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                {a.status === 'finished' ? 'Realizada' : 'Pendente'}
                             </span>
                          </div>
                          <div className="text-right">
                             <p className="text-xs font-black text-slate-500 uppercase">{format(parseISO(a.appointment_date), "HH:mm")}</p>
                          </div>
                       </div>
                    ))
                 )}
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-600 opacity-20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform"></div>
           </div>
        </div>

        {/* Right Column: Medical Records (Evolution) */}
        <div className="lg:col-span-2 space-y-10">
           
           <div className="flex items-center justify-between px-2">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                 <FileText className="w-8 h-8 text-brand-600" />
                 Evolução Clínica (SOAP)
              </h2>
              <button 
                onClick={() => setShowNewRecord(!showNewRecord)}
                className="text-brand-600 font-black text-[10px] uppercase tracking-[0.2em] bg-brand-50 px-5 py-2.5 rounded-2xl hover:bg-brand-600 hover:text-white transition-all"
              >
                {showNewRecord ? 'Fechar' : 'Nova Entrada'}
              </button>
           </div>

           <AnimatePresence>
             {showNewRecord && (
               <motion.form 
                 initial={{ opacity: 0, scale: 0.98, y: -20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: -20 }}
                 onSubmit={handleAddSoapRecord} 
                 className="bg-white p-10 rounded-[3.5rem] shadow-2xl border-2 border-brand-50 space-y-8"
               >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div>
                        <label className="text-[10px] font-black text-brand-600 uppercase tracking-[0.3em] block mb-3">Subjetivo</label>
                        <textarea 
                           required rows={4} value={newSoap.subjetivo} onChange={e => setNewSoap({...newSoap, subjetivo: e.target.value})}
                           placeholder="Relato do paciente..."
                           className="w-full p-6 bg-slate-50 rounded-3xl border-none font-medium text-slate-700 outline-none focus:ring-4 focus:ring-brand-500/10 transition-all resize-none"
                        />
                     </div>
                     <div>
                        <label className="text-[10px] font-black text-brand-600 uppercase tracking-[0.3em] block mb-3">Objetivo</label>
                        <textarea 
                           required rows={4} value={newSoap.objetivo} onChange={e => setNewSoap({...newSoap, objetivo: e.target.value})}
                           placeholder="Observações do psicólogo..."
                           className="w-full p-6 bg-slate-50 rounded-3xl border-none font-medium text-slate-700 outline-none focus:ring-4 focus:ring-brand-500/10 transition-all resize-none"
                        />
                     </div>
                     <div>
                        <label className="text-[10px] font-black text-brand-600 uppercase tracking-[0.3em] block mb-3">Avaliação</label>
                        <textarea 
                           required rows={4} value={newSoap.avaliacao} onChange={e => setNewSoap({...newSoap, avaliacao: e.target.value})}
                           placeholder="Hipóteses e progresso..."
                           className="w-full p-6 bg-slate-50 rounded-3xl border-none font-medium text-slate-700 outline-none focus:ring-4 focus:ring-brand-500/10 transition-all resize-none"
                        />
                     </div>
                     <div>
                        <label className="text-[10px] font-black text-brand-600 uppercase tracking-[0.3em] block mb-3">Plano</label>
                        <textarea 
                           required rows={4} value={newSoap.plano} onChange={e => setNewSoap({...newSoap, plano: e.target.value})}
                           placeholder="Próximos passos..."
                           className="w-full p-6 bg-slate-50 rounded-3xl border-none font-medium text-slate-700 outline-none focus:ring-4 focus:ring-brand-500/10 transition-all resize-none"
                        />
                     </div>
                  </div>
                  <div className="flex justify-end gap-4">
                     <button type="button" onClick={() => setShowNewRecord(false)} className="px-10 py-5 bg-white text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-900 transition">Cancelar</button>
                     <button 
                       type="submit" disabled={saving}
                       className="px-12 py-5 bg-brand-600 text-white font-black text-[10px] uppercase tracking-widest rounded-3xl shadow-xl shadow-brand-500/20 hover:bg-brand-700 transition"
                     >
                       {saving ? <Clock className="w-5 h-5 animate-spin mx-auto" /> : 'Confirmar Registro'}
                     </button>
                  </div>
               </motion.form>
             )}
           </AnimatePresence>

           <div className="space-y-8">
              {records.length === 0 ? (
                 <div className="p-24 text-center bg-white rounded-[3.5rem] border border-dashed border-slate-200">
                    <Activity className="w-16 h-16 text-slate-100 mx-auto mb-6" />
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Sem evolução clínica registrada</h3>
                    <p className="text-slate-400 mt-2 max-w-sm mx-auto font-medium leading-relaxed">Clique em "Nova Entrada" para iniciar o registro clínico digital conforme as boas práticas do CRP.</p>
                 </div>
              ) : (
                records.map(rec => (
                   <motion.div 
                     layout key={rec.id} 
                     className="bg-white p-10 rounded-[3.5rem] shadow-xl border border-slate-100 relative group overflow-hidden"
                   >
                      <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-50">
                         <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-slate-50 text-brand-600 rounded-2xl flex items-center justify-center font-black text-lg">
                               Ψ
                            </div>
                            <div>
                               <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-1">DATA DA SESSÃO</p>
                               <h4 className="text-2xl font-black text-slate-900 tracking-tighter">{format(parseISO(rec.created_at), "dd 'de' MMMM", { locale: ptBR })}</h4>
                            </div>
                         </div>
                         <div className="text-right">
                             <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1">Registro Digital</p>
                             <p className="text-sm font-bold text-brand-600 uppercase tracking-tight">{format(parseISO(rec.created_at), "yyyy")}</p>
                         </div>
                      </div>

                      <div className="whitespace-pre-line text-slate-600 font-medium leading-relaxed prose prose-slate max-w-none">
                         {rec.content}
                      </div>
                      
                      <div className="absolute right-0 top-0 w-32 h-32 bg-slate-50 opacity-0 group-hover:opacity-100 rounded-full blur-3xl transition-opacity"></div>
                   </motion.div>
                ))
               )}
           </div>
        </div>
      </div>
    </div>
  );
}
