import { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import type { Patient } from '../types';
import { 
  Users, 
  Search, 
  Plus, 
  UserPlus, 
  ArrowRight, 
  Download,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';

export default function ManagePatients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('patients')
      .select('*')
      .eq('doctor_id', user.id)
      .order('full_name');
    
    if (data) setPatients(data as Patient[]);
    setLoading(false);
  };

  const handleSyncLegacy = async () => {
    setSyncing(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. Pegar todos os agendamentos para extrair pacientes únicos
    const { data: appts } = await supabase
      .from('appointments')
      .select('id, patient_name, whatsapp')
      .eq('doctor_id', user.id);
    
    if (appts) {
      // Usar Map para garantir unicidade por WhatsApp
      const patientMap = new Map();
      appts.forEach(a => {
        if (!a.whatsapp) return;
        if (!patientMap.has(a.whatsapp)) {
          patientMap.set(a.whatsapp, a.patient_name);
        }
      });

      for (const [whatsapp, name] of patientMap) {
        // Inserir ou Pegar Paciente
        const { data: ptData } = await supabase
          .from('patients')
          .upsert({
            doctor_id: user.id,
            full_name: name,
            whatsapp: whatsapp
          }, { onConflict: 'doctor_id,whatsapp' })
          .select()
          .single();

        if (ptData) {
          // VINCULAR: Atualizar appointments para apontar p/ o novo ID de paciente
          await supabase
            .from('appointments')
            .update({ patient_id: ptData.id })
            .eq('doctor_id', user.id)
            .eq('whatsapp', whatsapp);
        }
      }
    }
    
    await fetchPatients();
    setSyncing(false);
    alert('Sincronização Concluída! Todos os agendamentos foram vinculados aos prontuários.');
  };

  const handleExportCSV = () => {
    const headers = ['Nome Completo', 'WhatsApp', 'Email', 'CPF', 'Data de Nascimento', 'Data de Cadastro'];
    const rows = patients.map(p => [
      p.full_name,
      p.whatsapp || '',
      p.email || '',
      p.cpf || '',
      p.date_of_birth || '',
      p.created_at ? format(parseISO(p.created_at), 'dd/MM/yyyy') : ''
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `pacientes_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.click();
  };

  const filtered = patients.filter(p => 
    p.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.whatsapp && p.whatsapp.includes(searchTerm))
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight flex items-center gap-4">
             <Users className="w-10 h-10 text-brand-600" />
             Meus Pacientes
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Gestão centralizada de registros e prontuários clínicos.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
           <button 
             onClick={handleSyncLegacy} disabled={syncing}
             className="px-6 py-3 bg-white text-brand-600 border border-brand-100 rounded-xl font-bold text-sm hover:bg-brand-50 transition flex items-center gap-2 shadow-sm"
           >
             <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} /> {syncing ? 'Sincronizando...' : 'Sincronizar Dados'}
           </button>
           <button 
             onClick={handleExportCSV}
             className="px-6 py-3 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold text-sm hover:bg-slate-50 transition flex items-center gap-2 shadow-sm"
           >
             <Download className="w-4 h-4" /> Exportar Lista
           </button>
           <button className="px-6 py-3 bg-brand-600 text-white rounded-xl font-bold text-sm hover:bg-brand-700 transition shadow-lg shadow-brand-500/20 flex items-center gap-2">
             <Plus className="w-4 h-4" /> Novo Cadastro
           </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="relative max-w-2xl">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
           <input 
             type="text" placeholder="Pesquisar por nome ou celular..."
             value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
             className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-4 focus:ring-brand-500/10 transition-all font-medium text-slate-700"
           />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full p-20 text-center">
             <div className="w-12 h-12 border-4 border-slate-100 border-t-brand-600 rounded-full animate-spin mx-auto mb-4"></div>
             <p className="text-slate-500 font-bold">Carregando pacientes...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full p-20 text-center bg-white rounded-3xl border border-dashed border-slate-200">
             <UserPlus className="w-16 h-16 text-slate-200 mx-auto mb-6" />
             <h3 className="text-xl font-black text-slate-900">Nenhum paciente encontrado</h3>
             <p className="text-slate-500 mt-2 max-w-sm mx-auto">Você ainda não tem pacientes cadastrados ou a sincronização ainda não foi feita.</p>
          </div>
        ) : (
          filtered.map(p => (
            <div key={p.id} className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-slate-200/40 transition-all group overflow-hidden relative">
               <div className="flex items-start justify-between mb-6">
                  <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center text-slate-400 group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors">
                     <Users className="w-8 h-8" />
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                     <CheckCircle2 className="w-3 h-3" /> Ativo
                  </div>
               </div>
               
               <div className="space-y-1">
                  <h3 className="text-xl font-black text-slate-900 group-hover:text-brand-700 transition-colors uppercase tracking-tight truncate">{p.full_name}</h3>
                  <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">{p.whatsapp || 'Sem celular'}</p>
               </div>

               <div className="mt-8 pt-8 border-t border-slate-50 flex items-center gap-2">
                  <Link 
                    to={`/admin/pacientes/${p.id}`}
                    className="flex-1 flex items-center justify-center gap-3 py-4 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-brand-600 transition-all shadow-lg"
                  >
                     <FileText className="w-4 h-4" /> Ver Prontuário
                  </Link>
                  <button className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:text-brand-600 hover:bg-brand-50 transition shadow-sm">
                     <ArrowRight className="w-5 h-5" />
                  </button>
               </div>
               
               {/* Aesthetic Touch */}
               <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-brand-500/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
          ))
        )}
      </div>

      {!patients.some(p => p.whatsapp) && patients.length > 0 && (
        <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-4">
           <AlertCircle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
           <div>
              <p className="text-amber-800 font-bold">Base de Dados Desatualizada</p>
              <p className="text-amber-700 text-sm mt-1">Identificamos registros sem dados completos. Clique no botão de sincronização no topo para consolidar os agendamentos antigos nos perfis dos pacientes.</p>
           </div>
        </div>
      )}
    </div>
  );
}
