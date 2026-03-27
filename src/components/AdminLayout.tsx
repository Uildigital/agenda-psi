import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Settings, 
  LogOut, 
  UserCircle,
  Wallet
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Início', path: '/admin' },
    { icon: Calendar, label: 'Agenda', path: '/admin/agenda' },
    { icon: Users, label: 'Pacientes', path: '/admin/pacientes' },
    { icon: Wallet, label: 'Finanças', path: '/admin/faturamento' },
  ];

  return (
    <div className="min-h-screen bg-white md:bg-slate-50 flex flex-col md:flex-row">
      
      {/* Desktop Sidebar (Left) */}
      <aside className="hidden md:flex flex-col w-72 bg-white border-r border-slate-200 fixed inset-y-0 h-full p-8 space-y-8 shadow-sm">
        <div className="flex items-center gap-4 px-2 mb-4">
          <div className="w-12 h-12 bg-brand-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-brand-500/20">
            Ψ
          </div>
          <span className="font-black text-2xl text-slate-950 tracking-tighter">PSi Professional</span>
        </div>

        <nav className="flex-1 space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-black uppercase text-[10px] tracking-widest ${isActive ? 'bg-brand-600 text-white shadow-xl shadow-brand-500/30' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'}`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
          
          <div className="h-px bg-slate-100 my-6" />
          
          <Link
            to="/admin/perfil"
            className={`flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-black uppercase text-[10px] tracking-widest ${location.pathname === '/admin/perfil' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-900'}`}
          >
            <UserCircle className="w-5 h-5" /> Perfil Profissional
          </Link>
          <Link
            to="/admin/configuracoes"
            className={`flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-black uppercase text-[10px] tracking-widest ${location.pathname === '/admin/configuracoes' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-900'}`}
          >
            <Settings className="w-5 h-5" /> Ajustes
          </Link>
        </nav>

        <button
          onClick={handleLogout}
          className="flex items-center gap-4 px-6 py-5 w-full text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all font-black uppercase text-[10px] tracking-widest absolute bottom-8 left-8 right-8"
        >
          <LogOut className="w-5 h-5" /> Encerrar Sessão
        </button>
      </aside>

      {/* Mobile Top Header (Simplified) */}
      <header className="md:hidden sticky top-0 bg-white/80 backdrop-blur-md z-[100] px-6 py-4 flex justify-between items-center border-b border-slate-100">
         <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-600 rounded-xl flex items-center justify-center text-white font-black text-lg">Ψ</div>
            <span className="font-black text-lg tracking-tighter text-slate-950 uppercase">PSi Professional</span>
         </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-72 min-h-screen">
        <div className="p-5 md:p-12 md:max-w-7xl md:mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav Bar (Access Quick Actions) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-white/95 backdrop-blur-md border-t border-slate-100 z-50 flex items-center justify-around px-2 safe-bottom">
         {[
           ...menuItems,
           { icon: UserCircle, label: 'Perfil', path: '/admin/perfil' }
         ].map(item => {
           const isActive = location.pathname === item.path;
           return (
             <Link 
               key={item.path} to={item.path} 
               className={`flex flex-col items-center gap-1 transition-all flex-1 ${isActive ? 'text-brand-600 transform scale-105' : 'text-slate-400'}`}
             >
                <item.icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-1.5'}`} />
                <span className="text-[8px] font-black uppercase tracking-widest overflow-hidden whitespace-nowrap">{item.label}</span>
             </Link>
           );
         })}
      </div>
    </div>
  );
}
