import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AdminDashboard from './pages/AdminDashboard';
import AgendaCompleta from './pages/AgendaCompleta';
import AdminProfile from './pages/AdminProfile';
import ManagePatients from './pages/ManagePatients';
import PatientDetails from './pages/PatientDetails';
import AdminSettings from './pages/AdminSettings';
import AdminFaturamento from './pages/AdminFaturamento';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/AdminLayout';

function PlatformHome() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8 text-center flex-col relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-50%] left-[-20%] w-[100%] h-[100%] bg-brand-500/5 rounded-full blur-[120px] mix-blend-multiply opacity-50"></div>
      <div className="absolute bottom-[-50%] right-[-20%] w-[100%] h-[100%] bg-indigo-500/5 rounded-full blur-[120px] mix-blend-multiply opacity-50"></div>

      <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">
        <div className="w-24 h-24 bg-brand-600 rounded-3xl flex items-center justify-center text-white font-bold text-5xl mb-12 shadow-2xl shadow-brand-500/30 transform hover:rotate-6 transition-transform">
          Ψ
        </div>
        <h1 className="text-5xl font-black text-slate-900 tracking-tighter sm:text-7xl mb-8">
          Sua clínica no <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-indigo-600">próximo nível</span>.
        </h1>
        <p className="text-slate-500 text-xl max-w-2xl mb-16 font-medium leading-relaxed">
          Agendamento automatizado, gestão de pacientes e prontuários clínicos em uma plataforma projetada exclusivamente para psicólogos.
        </p>
        <div className="flex flex-col sm:flex-row gap-6">
          <Link to="/login" className="px-12 py-5 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition shadow-2xl shadow-slate-950/20 text-lg hover:-translate-y-1 transform">
            Acessar Painel Admin
          </Link>
          <Link to="/dr-admin" className="px-12 py-5 bg-white text-slate-900 border border-slate-200 rounded-2xl font-black hover:bg-slate-50 transition shadow-sm text-lg hover:-translate-y-1 transform">
            Ver Demonstração
          </Link>
        </div>
        
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 w-full border-t border-slate-200/60 pt-16">
           <div className="text-center">
              <h4 className="font-extrabold text-slate-900 text-lg mb-1">Multi-Tenant</h4>
              <p className="text-slate-500 text-sm">Cada psicólogo tem sua URL própria e isolamento total de dados.</p>
           </div>
           <div className="text-center">
              <h4 className="font-extrabold text-slate-900 text-lg mb-1">Prontuário Digital</h4>
              <p className="text-slate-500 text-sm">Registre evoluções clínicas com segurança e sigilo total.</p>
           </div>
           <div className="text-center">
              <h4 className="font-extrabold text-slate-900 text-lg mb-1">Agenda Inteligente</h4>
              <p className="text-slate-500 text-sm">Controle de horários e geração automática de recorrência.</p>
           </div>
        </div>
      </div>
    </div>
  )
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<PlatformHome />} />
        <Route path="/login" element={<Login />} />
        
        <Route 
          path="/admin/*" 
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Routes>
                  <Route path="/" element={<AdminDashboard />} />
                  <Route path="/agenda" element={<AgendaCompleta />} />
                  <Route path="/pacientes" element={<ManagePatients />} />
                  <Route path="/pacientes/:id" element={<PatientDetails />} />
                  <Route path="/faturamento" element={<AdminFaturamento />} />
                  <Route path="/perfil" element={<AdminProfile />} />
                  <Route path="/configuracoes" element={<AdminSettings />} />
                  <Route path="*" element={<Navigate to="/admin" replace />} />
                </Routes>
              </AdminLayout>
            </ProtectedRoute>
          } 
        />

        <Route path="/:slug" element={<LandingPage />} />
      </Routes>
    </Router>
  );
}

export default App;
