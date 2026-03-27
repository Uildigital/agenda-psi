import { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import type { Appointment, Patient, DoctorProfile } from '../types';
import { 
  TrendingUp, 
  Clock, 
  CheckCircle,
  PlusCircle,
  DollarSign,
  Wallet,
  Calendar,
  Users,
  Eye,
  EyeOff,
  FileText
} from 'lucide-react';
import { format, isToday, parseISO, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link, useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
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

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: appts } = await supabase.from('appointments').select('*').eq('doctor_id', user.id);
    const { data: pts } = await supabase.from('patients').select('*').eq('doctor_id', user.id);
    const { data: prof, error: profError } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
    
    let activeProfile = prof;
    if (!prof && !profError) {
       // Cria perfil inicial caso tenha sido deletado
       const newProfile = {
          id: user.id,
          full_name: 'Novo Psicólogo',
          slug: `psi-${user.id.substring(0, 5)}`,
          default_session_value: 160
       };
       await supabase.from('profiles').insert([newProfile]);
       activeProfile = newProfile as DoctorProfile;
    } else if (prof) {
       setProfile(prof as DoctorProfile);
    }
    
    if (appts) setAppointments(appts as Appointment[]);
    if (pts) setPatients(pts as Patient[]);
    if (activeProfile) setProfile(activeProfile as DoctorProfile);
    setLoading(false);
  };

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

  const handlePatientClick = (appt: Appointment) => {
     if (appt.patient_id) {
        navigate(`/admin/pacientes/${appt.patient_id}`);
     } else {
        const pt = patients.find(p => p.whatsapp === appt.whatsapp || p.full_name === appt.patient_name);
        if (pt) navigate(`/admin/pacientes/${pt.id}`);
        else alert('Paciente não vinculado. Sincronize seus dados na aba Pacientes!');
     }
  };

  const hoje = appointments.filter(a => a.appointment_date && isToday(parseISO(a.appointment_date)));
  
  const totalFinished = appointments.filter(a => a.status === 'finished').length;
  const totalNoShow = appointments.filter(a => a.status === 'no_show').length;
  const totalRelevant = totalFinished + totalNoShow;
  const attendanceRate = totalRelevant > 0 ? Math.round((totalFinished / totalRelevant) * 100) : 0;
  
  const newsThisMonth = patients.filter(p => p.created_at && isSameMonth(parseISO(p.created_at), new Date())).length;

  const getPrice = (appt: Appointment) => {
    if (appt.price) return appt.price;
    const pt = patients.find(p => p.id === appt.patient_id || p.whatsapp === appt.whatsapp);
    return pt?.base_session_value || profile?.default_session_value || 160;
  };

  const currentMonthRevenue = appointments
    .filter(a => a.appointment_date && a.status === 'finished' && a.payment_status === 'paid' && isSameMonth(parseISO(a.appointment_date), new Date()))
    .reduce((acc, a) => acc + getPrice(a), 0);
  
  const expectedMonthlyRevenue = appointments
    .filter(a => a.appointment_date && isSameMonth(parseISO(a.appointment_date), new Date()))
    .reduce((acc, a) => acc + getPrice(a), 0);

  const revenueProgress = expectedMonthlyRevenue > 0 ? Math.round((currentMonthRevenue / expectedMonthlyRevenue) * 100) : 0;

  // Real Retention Rate (Patients with > 1 appointment)
  const patientsWithAppointments = new Set(appointments.map(a => a.whatsapp)).size;
  const returningPatients = patients.filter(p => {
    const count = appointments.filter(a => a.whatsapp === p.whatsapp).length;
    return count > 1;
  }).length;
  const retentionRate = patientsWithAppointments > 0 ? Math.round((returningPatients / patientsWithAppointments) * 100) : 0;

  const formatCurrency = (val: number) => {
    if (privacyMode) return 'R$ ••••••';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="space-y-8 md:space-y-12 animate-in fade-in duration-700 pb-32">
      
      {/* Dynamic Welcome Heading */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none">Início</h1>
          <p className="text-slate-400 font-bold tracking-tight text-xs md:text-sm mt-2 flex items-center gap-2">
             <Calendar className="w-3.5 h-3.5" /> {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={togglePrivacy}
             className={`flex-1 md:flex-none h-14 md:px-6 bg-white border-2 rounded-2xl font-black text-[10px] uppercase tracking-widest transition shadow-sm flex items-center justify-center gap-3 ${privacyMode ? 'border-slate-100 text-slate-400' : 'border-brand-200 text-brand-700 bg-brand-50'}`}
           >
             {privacyMode ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
             {privacyMode ? 'OCULTO' : 'VISÍVEL'}
           </button>
           <Link to="/admin/agenda?new=true" className="flex-1 md:flex-none h-14 md:px-6 bg-brand-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-700 transition shadow-xl shadow-brand-500/20 flex items-center justify-center gap-2">
             <PlusCircle className="w-5 h-5" /> NOVO
           </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
        {[
          { label: 'Hoje', value: hoje.length, color: 'bg-brand-600', icon: Calendar },
          { label: 'Pacientes', value: patients.length, color: 'bg-indigo-600', icon: Users },
          { label: 'Comparecimento', value: `${attendanceRate}%`, color: 'bg-emerald-600', icon: TrendingUp },
          { label: 'Novos', value: newsThisMonth, color: 'bg-amber-600', icon: Clock },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col justify-between">
            <div className={`${stat.color} w-10 h-10 md:w-14 md:h-14 rounded-2xl md:rounded-3xl flex items-center justify-center text-white mb-6`}>
               <stat.icon className="w-5 h-5 md:w-7 md:h-7" />
            </div>
            <div>
               <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">{stat.label}</p>
               <h3 className="text-2xl md:text-3xl font-black text-slate-900">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-10">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3 uppercase">
              <Clock className="w-6 h-6 text-brand-600" /> Atendimentos do Dia
            </h2>
            <Link to="/admin/agenda" className="text-brand-600 font-black text-[10px] uppercase tracking-widest hover:underline">Ver Agenda</Link>
          </div>

          <div className="space-y-4">
            {loading ? (
                <div className="p-16 text-center animate-pulse text-slate-300 font-bold uppercase text-xs tracking-widest">Aguarde...</div>
            ) : hoje.length === 0 ? (
              <div className="bg-white p-16 md:p-24 rounded-[3.5rem] border border-dashed border-slate-200 text-center">
                 <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-6 opacity-20" />
                 <p className="text-slate-400 font-black uppercase text-xs tracking-widest">Nenhuma sessão agendada para hoje.</p>
              </div>
            ) : (
              hoje.sort((a,b) => a.appointment_date.localeCompare(b.appointment_date)).map(a => (
                <div key={a.id} className="bg-white p-6 md:p-8 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 hover:border-brand-300 transition-all group active:scale-[0.98]">
                  <div className="flex items-center gap-6 w-full sm:w-auto">
                    <div className="w-16 h-16 bg-slate-50 text-brand-600 rounded-[1.5rem] flex flex-col items-center justify-center font-black group-hover:bg-brand-600 group-hover:text-white transition-colors">
                       <span className="text-[8px] uppercase tracking-widest mb-0.5">Hora</span>
                       <span className="text-lg leading-none">{format(parseISO(a.appointment_date), "HH:mm")}</span>
                    </div>
                    <div>
                       <h4 onClick={() => handlePatientClick(a)} className="font-black text-slate-950 text-xl tracking-tighter uppercase leading-none mb-2 hover:underline cursor-pointer">{a.patient_name}</h4>
                       <div className="flex items-center gap-3">
                          <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${a.status === 'confirmed' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : a.status === 'finished' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                              {a.status === 'confirmed' ? 'Confirmado' : a.status === 'finished' ? 'Finalizado' : 'Aguardando'}
                          </span>
                          {a.status === 'finished' && (
                             <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${a.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                {a.payment_status === 'paid' ? 'PAGO' : 'PENDENTE'}
                             </span>
                          )}
                       </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 w-full sm:w-auto mt-2 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-50">
                     <button onClick={() => handlePatientClick(a)} className="flex-1 sm:flex-none inline-flex items-center justify-center gap-3 bg-slate-950 text-white font-black py-4 px-8 rounded-2xl text-[10px] uppercase tracking-widest active:bg-brand-600 transition-all shadow-lg active:scale-95">
                        <FileText className="w-4 h-4" /> ABRIR PRONTUÁRIO
                     </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-8">
           <div className="bg-slate-950 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group">
              <div className="relative z-10">
                <div className="w-12 h-12 bg-brand-600 rounded-2xl flex items-center justify-center mb-8">
                   <DollarSign className="w-7 h-7" />
                </div>
                <p className="text-brand-400 font-black text-[10px] uppercase tracking-[0.4em] mb-2">FECHAMENTO MENSAL</p>
                <h3 className="text-4xl md:text-5xl font-black mb-8 tracking-tighter uppercase">
                  {formatCurrency(currentMonthRevenue)}
                </h3>
                
                <div className="space-y-6">
                   <div className="flex justify-between items-end mb-2">
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Progresso Recebido</span>
                       <span className="text-xs font-black text-brand-500">{revenueProgress}%</span>
                   </div>
                   <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-500 transition-all duration-1000" style={{ width: `${revenueProgress}%` }}></div>
                   </div>
                </div>

                <Link to="/admin/faturamento" className="w-full mt-10 inline-flex items-center justify-center gap-3 bg-white text-slate-950 py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-brand-500 hover:text-white transition-all">
                   <Wallet className="w-4 h-4" /> VER RELATÓRIO
                </Link>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-600 opacity-20 rounded-full blur-3xl -mr-16 -mt-16"></div>
           </div>

           <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
             <h3 className="font-black text-slate-400 mb-8 uppercase text-[10px] tracking-[0.3em]">Crescimento Digital</h3>
             <div className="space-y-8">
                <div className="flex items-center gap-5">
                   <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-[1.5rem] flex items-center justify-center font-black">+{newsThisMonth}</div>
                   <div>
                      <p className="text-sm font-black text-slate-900 uppercase">Novos Pacientes</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Este Mês</p>
                   </div>
                </div>
                <div className="flex items-center gap-5">
                   <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-[1.5rem] flex items-center justify-center font-black">{retentionRate}%</div>
                   <div>
                      <p className="text-sm font-black text-slate-900 uppercase">Taxa de Adesão</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Retenção Ativa</p>
                   </div>
                </div>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
