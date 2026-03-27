import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import type { Patient, MedicalRecord, Appointment } from '../types';
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  FileText, 
  History,
  User,
  Activity,
  Eye,
  EyeOff,
  DollarSign
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
    if (savedPrivacy !== null) {
      setPrivacyMode(savedPrivacy === 'true');
    } else {
      setPrivacyMode(true); 
    }
  }, [id]);

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
    if (!user || !id) return;

    // Fetch Patient
    const { data: pt } = await supabase.from('patients').select('*').eq('id', id).single();
    if (pt) {
      setPatient(pt as Patient);
      setEditPatient(pt);
      
      const { data: appts } = await supabase.from('appointments').select('*').eq('whatsapp', pt.whatsapp).order('appointment_date', { ascending: false });
      if (appts) setAppointments(appts as Appointment[]);
    }

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
       alert('Erro ao salvar: ' + error.message);
    }
    setSaving(false);
  };

  const handleAddSoapRecord = async () => {
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
      alert('Prontuário salvo com sucesso!');
    } else {
      alert('Erro ao salvar prontuário.');
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
    <div className="animate-in fade-in duration-700 pb-32">
      
      {/* Mobile-Friendly Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 mt-2">
        <div className="flex items-center gap-5">
           <button onClick={() => navigate(-1)} className="p-4 bg-white text-slate-400 rounded-2xl shadow-sm border border-slate-100 active:scale-90 transition-transform">
              <ArrowLeft className="w-6 h-6" />
           </button>
           <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-950 tracking-tighter uppercase leading-none">{patient.full_name}</h1>
              <span className="text-slate-400 font-black text-[9px] uppercase tracking-widest mt-1">Status: Ativo na Clínica</span>
           </div>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={togglePrivacy}
             className="flex-1 md:flex-none p-4 bg-white border border-slate-200 text-slate-400 rounded-2xl active:text-brand-600 transition shadow-sm flex items-center justify-center"
           >
             {privacyMode ? <Eye className="w-6 h-6" /> : <EyeOff className="w-6 h-6" />}
           </button>
           <button 
             onClick={() => setShowNewRecord(true)}
             className="flex-[3] md:flex-none px-8 py-4 bg-brand-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-brand-700 transition shadow-xl shadow-brand-500/30 flex items-center justify-center gap-3 active:scale-95"
           >
             <Plus className="w-4 h-4" /> Iniciar Evolução
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Patient Data Column */}
        <div className="space-y-10 lg:sticky lg:top-10 lg:h-fit">
           <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-slate-100 space-y-8">
              <h3 className="text-[10px] font-black text-brand-600 uppercase tracking-[0.4em] flex items-center gap-3">
                <User className="w-5 h-5" /> Ficha Cadastral
              </h3>
              
              <div className="space-y-6">
                 <div>
                    <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-1">Nome Completo</label>
                    <input 
                      type="text" value={editPatient.full_name} onChange={e => setEditPatient({...editPatient, full_name: e.target.value})}
                      className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-slate-700"
                    />
                 </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                       <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-1">WhatsApp</label>
                       <input 
                         type="tel" value={editPatient.whatsapp || ''} onChange={e => setEditPatient({...editPatient, whatsapp: e.target.value})}
                         className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold"
                       />
                    </div>
                    <div>
                       <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-1">CPF</label>
                       <input 
                         type="text" value={editPatient.cpf || ''} onChange={e => setEditPatient({...editPatient, cpf: e.target.value})}
                         className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold"
                       />
                    </div>
                 </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                       <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest block mb-1 flex items-center gap-2">
                          <DollarSign className="w-3 h-3 text-brand-600" /> Valor / Sessão
                       </label>
                       <input 
                         type={privacyMode ? "password" : "number"} value={editPatient.base_session_value || 160} onChange={e => setEditPatient({...editPatient, base_session_value: Number(e.target.value)})}
                         className="w-full p-4 bg-slate-50 rounded-2xl border-none font-black text-brand-700"
                       />
                    </div>
                    <div>
                       <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-1">Nascimento</label>
                       <input 
                         type="date" value={editPatient.date_of_birth || ''} onChange={e => setEditPatient({...editPatient, date_of_birth: e.target.value})}
                         className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold"
                       />
                    </div>
                 </div>
                 <button onClick={handleUpdatePatient} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-brand-600 transition shadow-lg">
                    Salvar Alterações
                 </button>
              </div>
           </div>

           <div className="bg-slate-950 rounded-[3rem] p-10 text-white shadow-2xl overflow-hidden relative group hidden md:block">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                 <History className="w-5 h-5 text-brand-600" /> Histórico Últimas 5
              </h3>
              <div className="space-y-6">
                 {appointments.length === 0 ? (
                    <p className="text-xs text-slate-500 font-bold uppercase italic">Sem registros.</p>
                 ) : (
                    appointments.slice(0, 5).map(a => (
                       <div key={a.id} className="flex items-center justify-between">
                          <div>
                             <p className="font-bold text-sm">{format(parseISO(a.appointment_date), "dd MMM yyyy", { locale: ptBR })}</p>
                             <span className={`text-[9px] font-black uppercase tracking-widest ${a.status === 'finished' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                {a.status === 'finished' ? 'Realizada' : 'Pendente'}
                             </span>
                          </div>
                          <p className="text-xs font-black text-slate-500">{format(parseISO(a.appointment_date), "HH:mm")}</p>
                       </div>
                    ))
                 )}
              </div>
           </div>
        </div>

        {/* Clinical Records Column */}
        <div className="lg:col-span-2 space-y-10">
           
           <div className="flex items-center justify-between px-2">
              <h2 className="text-2xl font-black text-slate-950 tracking-tight flex items-center gap-4 uppercase">
                 <FileText className="w-7 h-7 text-brand-600" />
                 Evolução Clínica
              </h2>
              <div className="h-10 w-px bg-slate-100 hidden sm:block"></div>
              <p className="hidden sm:block text-[10px] font-black text-slate-400 uppercase tracking-widest">{records.length} Atendimentos Digitais</p>
           </div>

           <div className="space-y-6">
              {records.length === 0 && !showNewRecord && (
                 <div className="p-20 text-center bg-white rounded-[3.5rem] border border-dashed border-slate-200">
                    <Activity className="w-16 h-16 text-slate-100 mx-auto mb-6" />
                    <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">Sem registros clínicos</h3>
                    <p className="text-slate-400 mt-2 font-bold uppercase text-[10px] tracking-widest">Inicie um novo SOAP para registrar o progresso.</p>
                 </div>
              )}
              
              {records.map(rec => (
                   <div key={rec.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 hover:border-brand-200 transition-colors">
                      <div className="flex items-center justify-between mb-6 pb-6 border-b border-slate-50">
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-50 text-brand-600 rounded-xl flex items-center justify-center font-black">Ψ</div>
                            <div>
                               <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">SESSÃO EM</p>
                               <h4 className="text-xl font-black text-slate-950 tracking-tighter uppercase">{format(parseISO(rec.created_at), "dd 'de' MMMM, yyyy", { locale: ptBR })}</h4>
                            </div>
                         </div>
                         <button className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:text-brand-600"><Plus className="w-4 h-4" /></button>
                      </div>
                      <div className="whitespace-pre-line text-slate-600 font-medium leading-relaxed prose prose-slate max-w-none px-2">
                         {rec.content}
                      </div>
                   </div>
                ))
               }
           </div>
        </div>
      </div>

      {/* FULL-SCREEN SOAP RECORD MODAL */}
      <AnimatePresence>
        {showNewRecord && (
          <motion.div 
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[200] bg-white flex flex-col pt-4 safe-bottom"
          >
            {/* Header SOAP */}
            <div className="px-8 py-6 flex items-center justify-between border-b border-slate-50">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center font-black">SOAP</div>
                  <div>
                    <h2 className="font-black text-xl text-slate-950 uppercase tracking-tighter">Registrar Evolução</h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Paciente: {patient.full_name}</p>
                  </div>
               </div>
               <button onClick={() => setShowNewRecord(false)} className="w-12 h-12 bg-slate-50 text-slate-900 rounded-full flex items-center justify-center text-lg font-black active:bg-slate-200 transition-colors">✕</button>
            </div>

            {/* Scrollable Content (Inputs 16px) */}
            <div className="flex-1 overflow-y-auto p-8 space-y-10 pb-32">
               <div className="space-y-4">
                  <label className="flex items-center gap-3 text-xs font-black text-brand-600 uppercase tracking-[0.2em]">
                     <div className="w-2 h-2 bg-brand-600 rounded-full animate-pulse"></div>
                     S - Subjetivo (Fala do Paciente)
                  </label>
                  <textarea 
                    value={newSoap.subjetivo} onChange={e => setNewSoap({...newSoap, subjetivo: e.target.value})}
                    placeholder="O que o paciente relatou hoje sobre queixas, sentimentos e percepções?"
                    className="w-full p-6 bg-slate-50 rounded-[2rem] border-none outline-none font-bold text-slate-700 min-h-[150px] resize-none focus:ring-4 focus:ring-brand-500/10 transition-all placeholder:text-slate-300"
                  />
               </div>

               <div className="space-y-4">
                  <label className="flex items-center gap-3 text-xs font-black text-brand-600 uppercase tracking-[0.2em]">
                     <div className="w-2 h-2 bg-slate-600 rounded-full"></div>
                     O - Objetivo (Observação Técnica)
                  </label>
                  <textarea 
                    value={newSoap.objetivo} onChange={e => setNewSoap({...newSoap, objetivo: e.target.value})}
                    placeholder="Aparência, fala, humor, postura, comportamento e sinais clínicos observados."
                    className="w-full p-6 bg-slate-50 rounded-[2rem] border-none outline-none font-bold text-slate-700 min-h-[150px] resize-none focus:ring-4 focus:ring-brand-500/10 transition-all placeholder:text-slate-300"
                  />
               </div>

               <div className="space-y-4">
                  <label className="flex items-center gap-3 text-xs font-black text-brand-600 uppercase tracking-[0.2em]">
                     <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                     A - Avaliação (Hipóteses)
                  </label>
                  <textarea 
                    value={newSoap.avaliacao} onChange={e => setNewSoap({...newSoap, avaliacao: e.target.value})}
                    placeholder="Sua análise técnica do caso, evolução comparativa e insights profissionais."
                    className="w-full p-6 bg-slate-50 rounded-[2rem] border-none outline-none font-bold text-slate-700 min-h-[150px] resize-none focus:ring-4 focus:ring-brand-500/10 transition-all placeholder:text-slate-300"
                  />
               </div>

               <div className="space-y-4">
                  <label className="flex items-center gap-3 text-xs font-black text-brand-600 uppercase tracking-[0.2em]">
                     <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
                     P - Plano (Conduta Próxima)
                  </label>
                  <textarea 
                    value={newSoap.plano} onChange={e => setNewSoap({...newSoap, plano: e.target.value})}
                    placeholder="Intervenções planejadas, encaminhamentos, tarefas de casa ou temas para a próxima sessão."
                    className="w-full p-6 bg-slate-50 rounded-[2rem] border-none outline-none font-bold text-slate-700 min-h-[150px] resize-none focus:ring-4 focus:ring-brand-500/10 transition-all placeholder:text-slate-300"
                  />
               </div>
            </div>

            {/* STICKY BOTTOM SAVE BUTTON */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t border-slate-100 flex gap-4 backdrop-blur-md safe-bottom">
               <button 
                 onClick={() => setShowNewRecord(false)}
                 className="flex-1 py-5 bg-slate-50 text-slate-400 font-black text-[10px] uppercase tracking-widest rounded-2xl active:bg-slate-200 transition-colors"
               >
                 Cancelar
               </button>
               <button 
                 onClick={() => handleAddSoapRecord()} disabled={saving}
                 className="flex-[2] py-5 bg-brand-600 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-xl shadow-brand-500/20 active:bg-brand-700 transition-all active:scale-95 flex items-center justify-center gap-3"
               >
                 <Save className="w-5 h-5" />
                 SALVAR REGISTRO
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
