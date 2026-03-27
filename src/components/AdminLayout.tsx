import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Settings, 
  LogOut, 
  UserCircle,
  Menu,
  X,
  Wallet
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
    { icon: Calendar, label: 'Agenda Completa', path: '/admin/agenda' },
    { icon: Users, label: 'Pacientes', path: '/admin/pacientes' },
    { icon: Wallet, label: 'Faturamento', path: '/admin/faturamento' },
    { icon: UserCircle, label: 'Meu Perfil', path: '/admin/perfil' },
    { icon: Settings, label: 'Configurações', path: '/admin/configuracoes' },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 fixed inset-y-0">
        <div className="p-6">
          <div className="flex items-center gap-3 px-2 mb-8">
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
              Ψ
            </div>
            <span className="font-bold text-xl text-slate-900 tracking-tight">PSi Manager</span>
          </div>

          <nav className="space-y-1">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium
                    ${isActive 
                      ? 'bg-brand-50 text-brand-700 shadow-sm border border-brand-100/50' 
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}
                  `}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-brand-600' : ''}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all font-medium"
          >
            <LogOut className="w-5 h-5" />
            Sair do Sistema
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 w-full bg-white border-b border-slate-200 z-50 px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
            Ψ
          </div>
          <span className="font-bold text-lg text-slate-900">PSi Manager</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
        >
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-white pt-16">
          <nav className="p-6 space-y-2">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`
                    flex items-center gap-4 px-6 py-4 rounded-2xl font-semibold text-lg
                    ${isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600'}
                  `}
                >
                  <item.icon className="w-6 h-6" />
                  {item.label}
                </Link>
              );
            })}
            <button
              onClick={handleLogout}
              className="flex items-center gap-4 px-6 py-4 w-full text-red-600 font-semibold text-lg"
            >
              <LogOut className="w-6 h-6" />
              Sair
            </button>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 md:ml-64 pt-16 md:pt-0">
        <div className="p-4 sm:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
