import React, { useState } from 'react';
import { useBooking } from '../hooks/useBooking';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Clock, User, CheckCircle, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export function BookingSystem({ idPsicologo }: { idPsicologo: string }) {
  const { getAvailableSlots, confirmarAgendamento, loading, error } = useBooking(idPsicologo);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
  const [form, setForm] = useState({ nome: '', cpf: '', whatsapp: '', motivo: '' });
  const [success, setSuccess] = useState(false);

  // Generate slots for the selected date
  const slots = getAvailableSlots(selectedDate, "08:00", "18:00");

  const formatWhatsApp = (value: string) => {
    const v = value.replace(/\D/g, '').substring(0, 11);
    if (v.length <= 2) return v.replace(/(\d{2})/, '($1');
    if (v.length <= 7) return v.replace(/(\d{2})(\d{1,5})/, '($1) $2');
    return v.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) return;

    try {
      await confirmarAgendamento({
        appointment_date: selectedSlot.toISOString(),
        patient_name: form.nome,
        whatsapp: form.whatsapp,
        notes: form.motivo,
      });
      setSuccess(true);
    } catch (err) {
      // Error handled by hook
    }
  };

  if (success) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-3xl shadow-xl p-8 text-center"
      >
        <CheckCircle className="w-16 h-16 text-brand-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-slate-900">Agendamento Confirmado!</h3>
        <p className="text-slate-600 mt-2">
          Sua consulta foi marcada para {selectedSlot && format(selectedSlot, "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}.
        </p>
        <button 
          onClick={() => { setSuccess(false); setSelectedSlot(null); }}
          className="mt-6 px-6 py-2 bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-lg hover:from-brand-600 hover:to-brand-700 transition-all shadow-md"
        >
          Novo Agendamento
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white/60 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-brand-500/10 overflow-hidden flex flex-col md:flex-row border border-white/60"
    >
      {/* Left Column: Date & Time Selection */}
      <div className="w-full md:w-1/2 p-6 md:p-10 bg-white/30 border-r border-white/50">
        <div className="mb-8">
          <h3 className="text-xl font-bold text-slate-900 flex items-center mb-6">
            <Calendar className="w-6 h-6 mr-3 text-brand-500" />
            Escolha o dia e horário
          </h3>
          
          <input 
            type="date" 
            value={format(selectedDate, 'yyyy-MM-dd')}
            onChange={(e) => setSelectedDate(new Date(e.target.value + 'T00:00:00'))}
            min={format(new Date(), 'yyyy-MM-dd')}
            className="w-full p-4 rounded-xl border border-white/60 focus:ring-4 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all text-slate-700 bg-white/50 focus:bg-white backdrop-blur-sm"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          {slots.map((slot, i) => (
            <button
              key={i}
              type="button"
              disabled={!slot.isAvailable}
              onClick={() => setSelectedSlot(slot.date)}
              className={`
                p-3 rounded-xl text-sm font-medium transition-all flex flex-col items-center justify-center gap-1.5
                ${slot.isAvailable 
                  ? selectedSlot === slot.date 
                    ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-500/30 transform scale-105 border-transparent' 
                    : 'bg-white/70 border border-white/60 text-slate-700 hover:border-brand-400 hover:text-brand-600 hover:shadow-md backdrop-blur-sm'
                  : 'bg-slate-100/40 text-slate-400 cursor-not-allowed opacity-60 border-transparent'}
              `}
            >
              <Clock className="w-4 h-4" />
              {format(slot.date, 'HH:mm')}
            </button>
          ))}
        </div>
      </div>

      {/* Right Column: Patient Form */}
      <div className="w-full md:w-1/2 p-6 md:p-10 bg-white/40">
        <h3 className="text-xl font-bold text-slate-900 flex items-center mb-8">
          <User className="w-6 h-6 mr-3 text-brand-500" />
          Seus Dados
        </h3>
        
        {error && (
          <motion.div initial={{opacity:0, y:-10}} animate={{opacity:1, y:0}} className="mb-6 p-4 bg-red-50/80 border border-red-100 text-red-700 rounded-xl flex items-start text-sm backdrop-blur-sm">
            <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nome Completo</label>
            <input 
              required
              type="text" 
              value={form.nome}
              onChange={e => setForm({...form, nome: e.target.value})}
              className="w-full p-3.5 rounded-xl border border-white/60 focus:ring-4 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all bg-white/50 focus:bg-white backdrop-blur-sm"
              placeholder="João da Silva"
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">CPF</label>
              <input 
                required
                type="text" 
                value={form.cpf}
                onChange={e => setForm({...form, cpf: e.target.value})}
                className="w-full p-3.5 rounded-xl border border-white/60 focus:ring-4 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all bg-white/50 focus:bg-white backdrop-blur-sm"
                placeholder="000.000.000-00"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">WhatsApp</label>
              <input 
                required
                type="tel" 
                value={form.whatsapp}
                onChange={e => setForm({...form, whatsapp: formatWhatsApp(e.target.value)})}
                className="w-full p-3.5 rounded-xl border border-white/60 focus:ring-4 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all bg-white/50 focus:bg-white backdrop-blur-sm"
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Motivo da Consulta (Breve)</label>
            <textarea 
              required
              rows={2}
              value={form.motivo}
              onChange={e => setForm({...form, motivo: e.target.value})}
              className="w-full p-3.5 rounded-xl border border-white/60 focus:ring-4 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all resize-none bg-white/50 focus:bg-white backdrop-blur-sm"
              placeholder="Como posso te ajudar?"
            />
          </div>

          <button 
            type="submit" 
            disabled={!selectedSlot || loading}
            className={`
              w-full py-4 mt-2 rounded-xl text-white font-bold text-lg hover:shadow-lg hover:shadow-brand-500/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0
              ${!selectedSlot || loading ? 'bg-slate-300 shadow-none cursor-not-allowed transform-none hover:shadow-none hover:translate-y-0' : 'bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700'}
            `}
          >
            {loading ? 'Confirmando...' : 'Confirmar Agendamento'}
          </button>
        </form>
      </div>
    </motion.div>
  );
}
