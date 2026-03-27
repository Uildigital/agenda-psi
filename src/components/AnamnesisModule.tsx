import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Save, 
  ClipboardList, 
  Users, 
  Target, 
  Pill, 
  Sparkles, 
  Search,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Loader2
} from 'lucide-react';
import type { Patient, Anamnesis, AnamnesisContent } from '../types';

interface AnamnesisModuleProps {
  patient: Patient;
  onClose: () => void;
  onSave?: (anamnesis: Anamnesis) => void;
}

const STEPS = [
  { id: 'complaint', label: 'Queixa & Histórico', icon: ClipboardList },
  { id: 'family', label: 'Contexto Familiar', icon: Users },
  { id: 'health', label: 'Saúde & Hábitos', icon: Pill },
  { id: 'goals', label: 'Objetivos & Foco', icon: Target },
];

export default function AnamnesisModule({ patient, onClose, onSave }: AnamnesisModuleProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [anamnesis, setAnamnesis] = useState<Anamnesis | null>(null);
  
  const [formData, setFormData] = useState<AnamnesisContent>({
    main_complaint: '',
    patient_history: '',
    family_history: '',
    expectations: '',
    previous_treatments: '',
    current_medications: '',
    lifestyle: {
      sleep: '',
      diet: '',
      exercise: '',
    },
    clinical_goals: '',
  });

  useEffect(() => {
    fetchAnamnesis();
  }, [patient.id]);

  const fetchAnamnesis = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('patient_anamnesis')
      .select('*')
      .eq('patient_id', patient.id)
      .maybeSingle();

    if (error) {
       console.error("Erro ao buscar anamnese:", error);
    }
    
    if (data) {
      setAnamnesis(data as Anamnesis);
      setFormData(data.content as AnamnesisContent);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const payload = {
      patient_id: patient.id,
      doctor_id: user.id,
      content: formData,
    };

    let result;
    if (anamnesis) {
      result = await supabase
        .from('patient_anamnesis')
        .update(payload)
        .eq('id', anamnesis.id)
        .select()
        .single();
    } else {
      result = await supabase
        .from('patient_anamnesis')
        .insert(payload)
        .select()
        .single();
    }

    if (!result.error && result.data) {
      setAnamnesis(result.data as Anamnesis);
      if (onSave) onSave(result.data as Anamnesis);
      alert('Anamnese salva com sucesso!');
    } else {
      alert('Erro ao salvar anamnese. Verifique sua conexão.');
    }
    setSaving(false);
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  if (loading) {
    return (
      <div className="fixed inset-0 z-[500] bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-brand-600 animate-spin" />
          <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Carregando Prontuário Estruturado...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[500] bg-slate-950/20 backdrop-blur-md flex items-center justify-center p-4 md:p-10">
      <motion.div 
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-7xl h-full max-h-[92vh] bg-white rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row relative border border-white/20"
      >
        {/* DESKTOP SIDEBAR / MOBILE TOPBAR */}
        <div className="w-full md:w-80 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-100 flex flex-col shrink-0">
          <div className="p-8 hidden md:block">
            <div className="w-14 h-14 bg-brand-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-brand-500/20 mb-6">
              <ClipboardList className="w-7 h-7" />
            </div>
            <p className="text-[9px] font-black text-brand-600 uppercase tracking-[0.3em] mb-1">Módulo de Anamnese</p>
            <h2 className="text-xl font-black text-slate-950 uppercase tracking-tighter leading-tight">
              {patient.full_name}
            </h2>
          </div>

          <nav className="flex md:flex-col p-4 md:p-6 gap-2 overflow-x-auto md:overflow-y-auto no-scrollbar">
            {STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isActive = currentStep === idx;
              const isDone = currentStep > idx;
              
              return (
                <button
                  key={step.id}
                  onClick={() => setCurrentStep(idx)}
                  className={`flex items-center gap-4 p-4 rounded-2xl transition-all group shrink-0 md:shrink-1 text-left ${isActive ? 'bg-white shadow-xl shadow-slate-200/50 text-brand-600' : 'text-slate-400 hover:bg-white/50'}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all ${isActive ? 'border-brand-500 bg-brand-50' : isDone ? 'border-emerald-500 bg-emerald-50 text-emerald-500' : 'border-slate-100 group-hover:border-slate-300'}`}>
                    {isDone ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <div className="hidden md:block">
                    <p className={`text-[9px] font-black uppercase tracking-widest ${isActive ? 'opacity-100' : 'opacity-40'}`}>Passo 0{idx + 1}</p>
                    <span className={`text-[11px] font-black uppercase tracking-tight ${isActive ? 'text-slate-900' : ''}`}>
                      {step.label}
                    </span>
                  </div>
                </button>
              );
            })}
          </nav>

          <div className="mt-auto p-8 hidden md:block">
            <div className="p-6 bg-brand-50/50 rounded-3xl border border-brand-100">
              <p className="text-[10px] font-bold text-brand-700 leading-relaxed">Arquivamento clínico seguindo normas de proteção de dados (LGPD).</p>
            </div>
          </div>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 flex flex-col min-w-0 bg-white">
          {/* HEADER (MOBILE ONLY TITLE / DESKTOP CLOSE ONLY) */}
          <div className="px-10 py-6 border-b border-slate-50 flex items-center justify-between">
            <div className="md:hidden">
              <h2 className="text-lg font-black text-slate-950 uppercase tracking-tighter">{STEPS[currentStep].label}</h2>
            </div>
            <div className="hidden md:flex items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Editando Registro Seguro</span>
            </div>
            <button 
              onClick={onClose}
              className="w-10 h-10 bg-white border border-slate-100 text-slate-400 rounded-full flex items-center justify-center hover:text-slate-950 hover:border-slate-300 transition-all active:scale-90"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 md:p-14">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="max-w-5xl mx-auto space-y-12"
              >
                {currentStep === 0 && (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                    <div className="space-y-4 xl:col-span-2">
                      <label className="text-[10px] font-black text-brand-600 uppercase tracking-widest flex items-center gap-3">
                        <Search className="w-4 h-4" /> Queixa Principal
                      </label>
                      <textarea 
                        value={formData.main_complaint}
                        onChange={e => setFormData({...formData, main_complaint: e.target.value})}
                        placeholder="Descreva o que trouxe o paciente à terapia..."
                        className="w-full p-8 bg-slate-50 rounded-[2rem] border-none outline-none font-bold text-slate-700 min-h-[140px] text-lg focus:ring-4 focus:ring-brand-500/5 transition-all"
                      />
                    </div>
                    <div className="space-y-4 xl:col-span-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">História do Problema & Evolução dos Sintomas</label>
                      <textarea 
                        value={formData.patient_history}
                        onChange={e => setFormData({...formData, patient_history: e.target.value})}
                        placeholder="Início dos sintomas, evolução, eventos marcantes..."
                        className="w-full p-8 bg-slate-50 rounded-[2rem] border-none outline-none font-bold text-slate-700 min-h-[220px] text-lg focus:ring-4 focus:ring-brand-500/5 transition-all"
                      />
                    </div>
                  </div>
                )}

                {currentStep === 1 && (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-brand-600 uppercase tracking-widest">Dinâmica Familiar</label>
                      <textarea 
                        value={formData.family_history}
                        onChange={e => setFormData({...formData, family_history: e.target.value})}
                        placeholder="Configuração familiar, relacionamentos..."
                        className="w-full p-6 bg-slate-50 rounded-[2rem] border-none outline-none font-bold text-slate-700 min-h-[300px] text-base focus:ring-4 focus:ring-brand-500/5 transition-all"
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Expectativas & Relacionamentos</label>
                      <textarea 
                        value={formData.expectations}
                        onChange={e => setFormData({...formData, expectations: e.target.value})}
                        placeholder="Rede de apoio e expectativas com o tratamento..."
                        className="w-full p-6 bg-slate-50 rounded-[2rem] border-none outline-none font-bold text-slate-700 min-h-[300px] text-base focus:ring-4 focus:ring-brand-500/5 transition-all"
                      />
                    </div>
                  </div>
                )}

              {currentStep === 2 && (
                <div className="space-y-12">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-brand-600 uppercase tracking-widest">Sono & Energia</label>
                      <input 
                        value={formData.lifestyle.sleep}
                        onChange={e => setFormData({...formData, lifestyle: {...formData.lifestyle, sleep: e.target.value}})}
                        className="w-full h-16 px-6 bg-slate-50 rounded-2xl border-none outline-none font-bold text-slate-700"
                        placeholder="Ex: Insônia, acorda cansado..."
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-brand-600 uppercase tracking-widest">Alimentação</label>
                      <input 
                        value={formData.lifestyle.diet}
                        onChange={e => setFormData({...formData, lifestyle: {...formData.lifestyle, diet: e.target.value}})}
                        className="w-full h-16 px-6 bg-slate-50 rounded-2xl border-none outline-none font-bold text-slate-700"
                        placeholder="Ex: Padrão regular, compulsão..."
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Uso de Medicamentos & Substâncias</label>
                    <textarea 
                      value={formData.current_medications}
                      onChange={e => setFormData({...formData, current_medications: e.target.value})}
                      placeholder="Psicotrópicos, medicações contínuas, uso de álcool/drogas..."
                      className="w-full p-8 bg-slate-50 rounded-[2rem] border-none outline-none font-bold text-slate-700 min-h-[150px] text-lg focus:ring-4 focus:ring-brand-500/5 transition-all"
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tratamentos Anteriores</label>
                    <textarea 
                      value={formData.previous_treatments}
                      onChange={e => setFormData({...formData, previous_treatments: e.target.value})}
                      placeholder="Já fez terapia? Teve alta ou abandonou? Resultados..."
                      className="w-full p-8 bg-slate-50 rounded-[2rem] border-none outline-none font-bold text-slate-700 min-h-[150px] text-lg focus:ring-4 focus:ring-brand-500/5 transition-all"
                    />
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-10">
                  <div className="p-10 bg-brand-50 rounded-[2.5rem] border border-brand-100 flex items-start gap-6">
                    <Sparkles className="w-8 h-8 text-brand-600 shrink-0" />
                    <div>
                      <h4 className="text-brand-900 font-black uppercase text-xs tracking-widest mb-2">Visão Terapêutica</h4>
                      <p className="text-brand-700 text-sm font-medium leading-relaxed">Defina aqui os pilares que guiarão o tratamento deste paciente. Estes objetivos ajudarão a medir a evolução clínica ao longo do tempo.</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-brand-600 uppercase tracking-widest">Objetivos Terapêuticos & Foco Principal</label>
                    <textarea 
                      value={formData.clinical_goals}
                      onChange={e => setFormData({...formData, clinical_goals: e.target.value})}
                      placeholder="Quais são as metas para este processo psicoterapêutico?"
                      className="w-full p-8 bg-slate-50 rounded-[2rem] border-none outline-none font-bold text-slate-700 min-h-[300px] text-lg focus:ring-4 focus:ring-brand-500/5 transition-all"
                    />
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
          </div>
        </div>

        {/* FOOTER */}
        <div className="px-10 py-8 border-t border-slate-50 bg-white flex items-center justify-between">
          <button 
            onClick={prevStep}
            disabled={currentStep === 0}
            className={`flex items-center gap-2 font-black text-[10px] uppercase tracking-widest transition-all ${currentStep === 0 ? 'opacity-0' : 'text-slate-400 hover:text-slate-950 px-6'}`}
          >
            <ChevronLeft className="w-4 h-4" /> Passo Anterior
          </button>
          
          <div className="flex items-center gap-4">
            {currentStep < STEPS.length - 1 ? (
              <button 
                onClick={nextStep}
                className="px-10 h-16 bg-slate-950 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-3 hover:bg-brand-600 transition-all active:scale-95"
              >
                Continuar <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button 
                onClick={handleSave}
                disabled={saving}
                className="px-12 h-16 bg-emerald-600 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 flex items-center gap-3 hover:bg-emerald-700 transition-all active:scale-95"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Finalizar Anamnese
              </button>
            )}
          </div>
        </div>

        {/* Backdrop Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500/[0.03] rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-brand-500/[0.03] rounded-full blur-[100px] pointer-events-none"></div>
      </motion.div>
    </div>
  );
}
