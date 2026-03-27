import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import type { Patient, MedicalRecord } from '../types';
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  FileText, 
  User,
  Activity,
  Eye,
  EyeOff,
  DollarSign,
  Smartphone,
  Clock,
  ChevronRight,
  X,
  Stethoscope,
  AlertCircle,
  ClipboardList,
  TrendingUp
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import AnamnesisModule from '../components/AnamnesisModule';

export default function PatientDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showNewRecord, setShowNewRecord] = useState(false);
  const [showAnamnesis, setShowAnamnesis] = useState(false);
  
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

    // Auto-open SOAP if coming from Agenda finalization
    const params = new URLSearchParams(window.location.search);
    if (params.get('newRecord') === 'true') {
      setShowNewRecord(true);
    }
  }, [id]);

  const togglePrivacy = () => {
    if (privacyMode) {
      // Trying to SHOW
      if (window.confirm('PRIVACIDADE: Deseja tornar os valores financeiros e dados sensíveis visíveis na tela agora?')) {
        setPrivacyMode(false);
        localStorage.setItem('psi_privacy_mode', 'false');
      }
    } else {
      // Hiding
      setPrivacyMode(true);
      localStorage.setItem('psi_privacy_mode', 'true');
    }
  };

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !id) return;

    // Fetch Patient
    const { data: pt } = await supabase.from('patients').select('*').eq('id', id).maybeSingle();
    if (pt) {
      setPatient(pt as Patient);
      setEditPatient(pt);
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
       alert('Cadastro atualizado com sucesso!');
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
### SUBJETIVO
${newSoap.subjetivo || 'Nenhum relato específico.'}

### OBJETIVO
${newSoap.objetivo || 'Sem observações técnicas específicas.'}

### AVALIAÇÃO
${newSoap.avaliacao || 'Hipóteses clínicas pendentes.'}

### PLANO
${newSoap.plano || 'Seguimento terapêutico padrão.'}
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
      alert('Evolução clínica registrada com sucesso!');
    } else {
      alert('Erro ao salvar prontuário.');
    }
    setSaving(false);
  };

  if (loading) return (
    <div className="p-32 text-center animate-pulse space-y-4">
       <div className="w-20 h-20 border-4 border-slate-100 border-t-brand-600 rounded-full animate-spin mx-auto"></div>
       <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">Acessando Arquivo Clínico Seguro...</p>
    </div>
  );

  if (!patient) return (
    <div className="p-20 text-center space-y-6">
       <AlertCircle className="w-16 h-16 text-red-100 mx-auto" />
       <h2 className="text-2xl font-black text-slate-900 uppercase">Paciente não localizado</h2>
       <button onClick={() => navigate('/admin/pacientes')} className="px-8 py-4 bg-slate-950 text-white rounded-2xl font-black text-xs uppercase tracking-widest">Voltar para a Lista</button>
    </div>
  );

  return (
    <div className="relative min-h-screen animate-in fade-in duration-1000 pb-40 space-y-12">
      
      {/* BACKGROUND DECORATIONS (DESKTOP ONLY) */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-40 select-none -z-10 hidden xl:block">
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-brand-500/10 rounded-full blur-[140px] animate-pulse"></div>
        <div className="absolute bottom-[-5%] left-[-5%] w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px]"></div>
      </div>
      
      {/* PROFESSIONAL TITLE BAR */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 pt-4">
            <div className="flex items-center gap-6">
               <button onClick={() => navigate(-1)} className="w-14 h-14 bg-white text-slate-400 rounded-2xl shadow-sm border border-slate-100 hover:text-slate-950 transition-all active:scale-90 flex items-center justify-center">
                  <ArrowLeft className="w-6 h-6" />
               </button>
                <div>
                   <div className="flex flex-wrap items-center gap-3 mb-2">
                   <h1 className="text-3xl md:text-6xl font-black text-slate-950 tracking-tighter uppercase leading-none text-gradient">{patient.full_name}</h1>
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border mt-1 ${patient.status === 'inactive' ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-brand-50 text-brand-600 border-brand-200'}`}>
                         {patient.status === 'inactive' ? 'Inativo' : 'Paciente em Acompanhamento'}
                      </span>
                   </div>
                   <div className="flex flex-wrap items-center gap-6">
                     <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest flex items-center gap-2">
                        <span className="w-2 h-2 bg-brand-500 rounded-full"></span>
                        ID: {patient.id.substring(0,8).toUpperCase()}
                     </p>
                     <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest flex items-center gap-2">
                        <Smartphone className="w-3 h-3" /> WhatsApp: {patient.whatsapp || 'Pendente'}
                     </p>
                   </div>
                </div>
             </div>

         <div className="flex flex-wrap items-center gap-3">
             <button 
               onClick={togglePrivacy}
               className={`h-14 px-6 rounded-2xl border transition-all shadow-sm flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-widest ${privacyMode ? 'bg-white text-slate-400 border-slate-200 hover:text-brand-600' : 'bg-brand-50 text-brand-600 border-brand-200'}`}
             >
               {privacyMode ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
               {privacyMode ? 'Revelar Dados' : 'Modo Privado'}
             </button>
             
             <button 
               onClick={() => setShowAnamnesis(true)}
               className="h-14 px-6 bg-white text-slate-900 border border-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition shadow-sm flex items-center justify-center gap-3 active:scale-95"
             >
               <ClipboardList className="w-4 h-4 text-brand-600" /> Anamnese Profissional
             </button>

             <button 
               onClick={() => setShowNewRecord(true)}
               className="h-14 px-8 bg-brand-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-700 transition shadow-xl shadow-brand-500/30 flex items-center justify-center gap-3 active:scale-95"
             >
               <Plus className="w-4 h-4" /> Registrar Evolução
             </button>
         </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-10">
        
        {/* SIDEBAR: PATIENT MASTER DATA */}
        <div className="xl:col-span-1 space-y-8">
           <div className="glass-card rounded-[3rem] p-8 space-y-8 relative overflow-hidden premium-shadow">
              <h3 className="text-[10px] font-black text-brand-700 uppercase tracking-[0.4em] flex items-center gap-3 border-b border-slate-100/50 pb-6">
                <User className="w-4 h-4" /> Ficha Bio-Psico-Social
              </h3>
              
              <div className="space-y-6">
                 <div>
                    <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest block mb-2 px-1">Nome de Cadastro</label>
                    <input 
                      type="text" value={editPatient.full_name} onChange={e => setEditPatient({...editPatient, full_name: e.target.value})}
                      className="w-full h-14 px-5 bg-slate-50 rounded-2xl border-none font-black text-slate-900 text-xs tracking-tighter transition-all focus:ring-4 focus:ring-brand-500/5 outline-none uppercase"
                    />
                 </div>
                 
                 <div className="space-y-4">
                    <div>
                       <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest block mb-2 px-1">WhatsApp de Contato</label>
                       <div className="relative">
                          <input 
                            type="tel" value={editPatient.whatsapp || ''} onChange={e => setEditPatient({...editPatient, whatsapp: e.target.value})}
                            className="w-full h-14 pl-5 pr-14 bg-slate-50 rounded-2xl border-none font-black text-slate-900 text-[11px]"
                          />
                          <button 
                            onClick={() => window.open(`https://wa.me/${editPatient.whatsapp?.replace(/\D/g,'')}`, '_blank')}
                            className="absolute right-2 top-2 w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all"
                          >
                             <Smartphone className="w-4 h-4" />
                          </button>
                       </div>
                    </div>
                    <div>
                       <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest block mb-2 px-1 text-xs">CPF / Identidade</label>
                       <input 
                         type={privacyMode ? "password" : "text"} value={editPatient.cpf || ''} onChange={e => setEditPatient({...editPatient, cpf: e.target.value})}
                         className="w-full h-14 px-5 bg-slate-50 rounded-2xl border-none font-black text-slate-900 text-[11px]"
                       />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest block mb-2 px-1 flex items-center gap-2">
                          <DollarSign className="w-2.5 h-2.5 text-brand-600" /> Sessão (R$)
                       </label>
                       <input 
                         type={privacyMode ? "password" : "number"} value={editPatient.base_session_value || 160} onChange={e => setEditPatient({...editPatient, base_session_value: Number(e.target.value)})}
                         className="w-full h-14 px-5 bg-slate-50 rounded-2xl border-none font-black text-brand-700 text-xs"
                       />
                    </div>
                    <div>
                       <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest block mb-2 px-1">Data de Nasc.</label>
                       <input 
                         type="date" value={editPatient.date_of_birth || ''} onChange={e => setEditPatient({...editPatient, date_of_birth: e.target.value})}
                         className="w-full h-14 px-4 bg-slate-50 rounded-2xl border-none font-black text-slate-900 text-[10px] uppercase"
                       />
                    </div>
                 </div>

                 <button 
                   onClick={handleUpdatePatient} disabled={saving}
                   className="w-full h-16 bg-slate-950 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-widest hover:bg-brand-600 transition shadow-xl shadow-slate-950/20 active:scale-95 flex items-center justify-center gap-3"
                 >
                    {saving ? <Activity className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    Salvar Ficha
                 </button>
              </div>

              {/* Decorative Background */}
              <div className="absolute bottom-[-50px] left-[-30px] w-40 h-40 bg-brand-500/5 rounded-full blur-[80px] pointer-events-none"></div>
           </div>

           {/* QUICK STATUS TOGGLE */}
           <div className={`p-8 rounded-[2.5rem] border ${patient.status === 'inactive' ? 'bg-slate-50 border-slate-100' : 'bg-emerald-50/50 border-emerald-100'}`}>
              <div className="flex items-center justify-between mb-4">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Estado Clínico</p>
                 <div className={`w-2 h-2 rounded-full ${patient.status === 'inactive' ? 'bg-slate-300' : 'bg-emerald-500 animate-pulse'}`}></div>
              </div>
              <p className="text-xs font-bold text-slate-600 mb-6 leading-relaxed">O paciente está atualmente {patient.status === 'inactive' ? 'Inativo. Records e agendamentos permanecem salvos.' : 'Ativo e apto para novos agendamentos.'}</p>
              <button 
                onClick={async () => {
                  const newStatus = patient.status === 'active' ? 'inactive' : 'active';
                  const { error } = await supabase.from('patients').update({ status: newStatus }).eq('id', patient.id);
                  if (!error) setPatient({ ...patient, status: newStatus });
                }}
                className={`w-full py-4 rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all ${patient.status === 'inactive' ? 'bg-white border border-emerald-200 text-emerald-600 shadow-sm' : 'bg-white border border-slate-200 text-slate-400'}`}
              >
                 {patient.status === 'inactive' ? 'Reativar Atendimento' : 'Desativar Temporariamente'}
              </button>
           </div>
        </div>

        {/* MAIN COLUMN: CLINICAL TIMELINE */}
        <div className="xl:col-span-3 space-y-12">
           
           {/* PC: QUICK CLINICAL KPI DASHBOARD */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 hidden md:grid">
              <div className="glass-card p-8 rounded-[2.5rem] border-white/50 premium-shadow hover-elevate group">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4 group-hover:text-brand-600 transition-colors">Aditividade</p>
                 <div className="flex items-center justify-between">
                    <h4 className="text-2xl font-black text-slate-900 text-gradient">85%</h4>
                    <div className="w-10 h-10 bg-brand-50 text-brand-600 rounded-xl flex items-center justify-center font-black">
                       <TrendingUp className="w-5 h-5" />
                    </div>
                 </div>
              </div>
              <div className="glass-card p-8 rounded-[2.5rem] border-white/50 premium-shadow hover-elevate group">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4 group-hover:text-brand-600 transition-colors">Última Sessão</p>
                 <div className="flex items-center justify-between">
                    <h4 className="text-xl font-black text-slate-900 text-gradient">{records.length > 0 ? format(parseISO(records[0].created_at), "dd/MM/yy") : '---'}</h4>
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                       <Clock className="w-5 h-5" />
                    </div>
                 </div>
              </div>
              <div className="glass-card p-8 rounded-[2.5rem] border-white/50 premium-shadow hover-elevate group">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4 group-hover:text-brand-600 transition-colors">Ticket Médio</p>
                 <div className="flex items-center justify-between">
                    <h4 className="text-2xl font-black text-slate-900 text-gradient">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(patient.base_session_value || 160)}</h4>
                    <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                       <DollarSign className="w-5 h-5" />
                    </div>
                 </div>
              </div>
           </div>

           <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 px-6 py-10 bg-white rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden group">
              <div className="relative z-10">
                <h2 className="text-2xl md:text-4xl font-black text-slate-950 tracking-tighter flex items-center gap-5 uppercase">
                   <FileText className="w-12 h-12 text-brand-600" />
                   Evolução Clínica Digital
                </h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-16 mt-2">Linha do Tempo de Atendimentos Profissionais</p>
              </div>
              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-3xl border border-slate-100 relative z-10">
                 <div className="w-12 h-12 bg-white text-brand-600 rounded-2xl flex items-center justify-center font-black shadow-sm text-xl">{records.length}</div>
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest pr-4">Sessões Totais</p>
              </div>
              
              {/* PC Decoration */}
              <div className="absolute right-0 top-0 w-64 h-64 bg-brand-500/[0.03] rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-brand-500/[0.06] transition-all"></div>
           </div>

           <div className="space-y-8 relative">
              {/* Timeline Line */}
              {records.length > 0 && <div className="absolute left-10 top-10 bottom-10 w-px bg-slate-100 hidden md:block"></div>}

              {records.length === 0 && !showNewRecord && (
                 <div className="p-24 text-center bg-white rounded-[4rem] border-2 border-dashed border-slate-100 flex flex-col items-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-8">
                       <Stethoscope className="w-8 h-8 text-slate-200" />
                    </div>
                    <h3 className="text-xl font-black text-slate-950 uppercase tracking-tighter">Prontuário Vazio</h3>
                    <p className="text-slate-400 mt-2 font-bold uppercase text-[10px] tracking-widest max-w-xs">Nenhuma evolução clínica registrada até o momento. Inicie um novo SOAP para documentar o caso.</p>
                 </div>
              )}
              
              <AnimatePresence>
              {records.map((rec) => (
                    <motion.div 
                      key={rec.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                      className="relative pl-0 md:pl-24"
                    >
                       {/* Timeline Marker */}
                       <div className="absolute left-8 top-12 w-4 h-4 bg-white border-4 border-brand-500 rounded-full z-10 hidden md:block"></div>
                       
                       <div className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-100 hover:border-brand-200 hover:shadow-2xl hover:shadow-brand-500/5 transition-all group overflow-hidden">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 pb-8 border-b border-slate-50 gap-6">
                             <div className="flex items-center gap-5">
                                <div className="w-16 h-16 bg-slate-50 text-brand-600 rounded-[1.5rem] flex flex-col items-center justify-center font-black shadow-inner">
                                   <span className="text-lg leading-none">{format(parseISO(rec.created_at), "dd")}</span>
                                   <span className="text-[7px] uppercase tracking-widest opacity-60 font-black">{format(parseISO(rec.created_at), "MMM", { locale: ptBR })}</span>
                                </div>
                                <div>
                                   <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">DATA DA SESSÃO</p>
                                   <h4 className="text-xl font-black text-slate-950 tracking-tighter uppercase">{format(parseISO(rec.created_at), "EEEE, dd 'de' MMMM", { locale: ptBR })}</h4>
                                </div>
                             </div>
                             <div className="flex items-center gap-2">
                                <span className="h-10 px-4 bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-xl flex items-center justify-center">Ψ Clínico</span>
                                <button className="w-10 h-10 bg-slate-50 text-slate-300 rounded-xl hover:text-brand-600 hover:bg-brand-50 transition-all flex items-center justify-center rotate-45"><Plus className="w-4 h-4" /></button>
                             </div>
                          </div>

                          <div className="whitespace-pre-line text-slate-700 font-medium leading-relaxed prose prose-slate max-w-none px-2 selection:bg-brand-100">
                             {rec.content}
                          </div>

                          <div className="mt-10 pt-8 border-t border-slate-50 flex items-center justify-between text-slate-300">
                             <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                                <Clock className="w-3 h-3" /> Registrado às {format(parseISO(rec.created_at), "HH:mm")}
                             </div>
                             <button className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1 hover:text-brand-600 transition-colors">
                                Ver Detalhes <ChevronRight className="w-3 h-3" />
                             </button>
                          </div>
                          
                          {/* Aesthetic Background bits */}
                          <div className="absolute top-0 right-0 w-40 h-40 bg-brand-500/[0.01] rounded-full blur-[80px] pointer-events-none"></div>
                       </div>
                    </motion.div>
                 ))
                }
                </AnimatePresence>
           </div>
        </div>
      </div>

      {/* FULL-SCREEN SOAP RECORD MODAL */}
      <AnimatePresence>
        {showNewRecord && (
          <motion.div 
            initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }} transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-0 z-[400] bg-white flex flex-col pt-safe safe-bottom"
          >
            {/* Header SOAP */}
            <div className="px-10 py-10 flex items-center justify-between border-b border-slate-50 bg-slate-50/30">
               <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-brand-600 text-white rounded-[2rem] flex items-center justify-center font-black text-xl shadow-xl shadow-brand-500/20">Ψ</div>
                  <div>
                    <h2 className="font-extrabold text-3xl text-slate-950 uppercase tracking-tighter leading-tight">Nova Evolução Clínica</h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                       <User className="w-3 h-3" /> Paciente: {patient.full_name}
                    </p>
                  </div>
               </div>
               <button onClick={() => setShowNewRecord(false)} className="w-14 h-14 bg-white border border-slate-100 text-slate-950 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all">
                  <X className="w-6 h-6" />
               </button>
            </div>

            {/* Scrollable Content (SOAP Standard) */}
            <div className="flex-1 overflow-y-auto p-10 space-y-12 pb-40">
               <div className="max-w-4xl mx-auto space-y-12">
                  <div className="space-y-4">
                     <label className="flex items-center gap-4 text-xs font-black text-brand-600 uppercase tracking-[0.3em]">
                        <div className="w-2.5 h-2.5 bg-brand-600 rounded-full animate-pulse shadow-glow shadow-brand-500/50"></div>
                         S - SUBJETIVO (QUEIXAS E RELATOS)
                     </label>
                     <textarea 
                       autoFocus
                       value={newSoap.subjetivo} onChange={e => setNewSoap({...newSoap, subjetivo: e.target.value})}
                       placeholder="O que o paciente relatou hoje sobre suas emoções, fatos da semana e percepções subjetivas?"
                       className="w-full p-8 bg-slate-50 rounded-[2.5rem] border-none outline-none font-bold text-slate-700 min-h-[150px] resize-none focus:ring-4 focus:ring-brand-500/10 transition-all placeholder:text-slate-300 text-lg leading-relaxed"
                     />
                  </div>

                  <div className="space-y-4">
                     <label className="flex items-center gap-4 text-xs font-black text-indigo-500 uppercase tracking-[0.3em]">
                        <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full"></div>
                         O - OBJETIVO (OBSERVAÇÃO TÉCNICA)
                     </label>
                     <textarea 
                       value={newSoap.objetivo} onChange={e => setNewSoap({...newSoap, objetivo: e.target.value})}
                       placeholder="Aparência, fala, humor, postura, comportamento e sinais clínicos observados durante a sessão."
                       className="w-full p-8 bg-slate-50 rounded-[2.5rem] border-none outline-none font-bold text-slate-700 min-h-[150px] resize-none focus:ring-4 focus:ring-brand-500/10 transition-all placeholder:text-slate-300 text-lg leading-relaxed"
                     />
                  </div>

                  <div className="space-y-4">
                     <label className="flex items-center gap-4 text-xs font-black text-amber-500 uppercase tracking-[0.3em]">
                        <div className="w-2.5 h-2.5 bg-amber-500 rounded-full"></div>
                         A - AVALIAÇÃO (INSIGHTS E HIPÓTESES)
                     </label>
                     <textarea 
                       value={newSoap.avaliacao} onChange={e => setNewSoap({...newSoap, avaliacao: e.target.value})}
                       placeholder="Sua análise técnica do caso, evolução comparativa, insights profissionais e hipóteses diagnósticas."
                       className="w-full p-8 bg-slate-50 rounded-[2.5rem] border-none outline-none font-bold text-slate-700 min-h-[150px] resize-none focus:ring-4 focus:ring-brand-500/10 transition-all placeholder:text-slate-300 text-lg leading-relaxed"
                     />
                  </div>

                  <div className="space-y-4">
                     <label className="flex items-center gap-4 text-xs font-black text-emerald-600 uppercase tracking-[0.3em]">
                        <div className="w-2.5 h-2.5 bg-emerald-600 rounded-full"></div>
                         P - PLANO (CONDUTA E PRÓXIMOS PASSOS)
                     </label>
                     <textarea 
                       value={newSoap.plano} onChange={e => setNewSoap({...newSoap, plano: e.target.value})}
                       placeholder="Intervenções planejadas para a próxima sessão, tarefas de casa, temas a serem abordados ou encaminhamentos."
                       className="w-full p-8 bg-slate-50 rounded-[2.5rem] border-none outline-none font-bold text-slate-700 min-h-[150px] resize-none focus:ring-4 focus:ring-brand-500/10 transition-all placeholder:text-slate-300 text-lg leading-relaxed"
                     />
                  </div>
               </div>
            </div>

            {/* STICKY BOTTOM SAVE BUTTON */}
            <div className="absolute bottom-0 left-0 right-0 p-10 bg-white/80 backdrop-blur-xl border-t border-slate-100 flex gap-6 safe-bottom">
               <button 
                 onClick={() => setShowNewRecord(false)}
                 className="flex-1 py-7 bg-slate-50 text-slate-500 font-black text-[11px] uppercase tracking-[0.2em] rounded-[2rem] hover:bg-slate-100 transition-colors active:scale-95"
               >
                 Descartar Rascunho
               </button>
               <button 
                 onClick={() => handleAddSoapRecord()} disabled={saving}
                 className="flex-[2] py-7 bg-brand-600 text-white font-black text-[11px] uppercase tracking-[0.3em] rounded-[2rem] shadow-2xl shadow-brand-500/40 active:bg-brand-700 transition-all active:scale-95 flex items-center justify-center gap-5"
               >
                 {saving ? <Activity className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
                 FINALIZAR REGISTRO CLÍNICO
               </button>
            </div>
          </motion.div>
        )}
        {showAnamnesis && (
          <AnamnesisModule 
            patient={patient} 
            onClose={() => setShowAnamnesis(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
