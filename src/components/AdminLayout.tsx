import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Settings, 
  LogOut, 
  UserCircle,
  Wallet,
  Menu
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

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

      {/* Mobile Top Header */}
      <header className="md:hidden sticky top-0 bg-white/80 backdrop-blur-md z-[100] px-6 py-5 flex justify-between items-center border-b border-slate-100">
         <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center text-white font-black text-xl">Ψ</div>
            <span className="font-black text-lg tracking-tighter text-slate-950">PSi</span>
         </div>
         <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="w-10 h-10 bg-slate-50 text-slate-900 rounded-xl flex items-center justify-center active:bg-slate-200"
            >
               <Menu className="w-5 h-5" />
            </button>
         </div>
      </header>

      {/* Mobile Overlay Menu */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[110] bg-white animate-in slide-in-from-top duration-300">
          <div className="p-8 h-full flex flex-col">
             <div className="flex justify-between items-center mb-12">
               <span className="font-black uppercase tracking-[0.3em] text-[10px] text-slate-400">Navegação Digital</span>
               <button onClick={() => setIsMenuOpen(false)} className="w-12 h-12 bg-slate-900 text-white rounded-full flex items-center justify-center text-xl font-black">✕</button>
             </div>
             
             <nav className="space-y-4 flex-1">
                {[...menuItems, { icon: UserCircle, label: 'Perfil', path: '/admin/perfil' }, { icon: Settings, label: 'Ajustes', path: '/admin/configuracoes' }].map(item => (
                   <Link 
                     key={item.path} to={item.path} onClick={() => setIsMenuOpen(false)}
                     className="flex items-center gap-6 p-6 bg-slate-50 rounded-[2.5rem] font-black text-xl text-slate-900 tracking-tighter active:bg-brand-50 active:text-brand-600 transition-colors"
                   >
                     <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm"><item.icon className="w-6 h-6" /></div>
                     {item.label}
                   </Link>
                ))}
             </nav>
             
             <button onClick={handleLogout} className="w-full p-8 mt-4 font-black text-red-600 flex items-center justify-center gap-3 uppercase text-xs tracking-widest border-t border-slate-100">
                <LogOut className="w-5 h-5" /> Sair do Painel
             </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 md:ml-72 min-h-screen">
        <div className="p-5 md:p-12 md:max-w-7xl md:mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav Bar (Access Quick Actions) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-white/95 backdrop-blur-md border-t border-slate-100 z-50 flex items-center justify-around px-2 safe-bottom">
         {menuItems.map(item => {
           const isActive = location.pathname === item.path;
           return (
             <Link 
               key={item.path} to={item.path} 
               className={`flex flex-col items-center gap-1 transition-all ${isActive ? 'text-brand-600 transform scale-110' : 'text-slate-400'}`}
             >
                <item.icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5]' : 'stroke-1.5'}`} />
                <span className="text-[10px] font-black uppercase tracking-widest overflow-hidden h-3 whitespace-nowrap">{item.label}</span>
             </Link>
           );
         })}
      </div>
    </div>
  );
}
