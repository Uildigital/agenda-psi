import { useState, useCallback, useEffect } from 'react';
import type { Appointment } from '../types';
import { confirmarAgendamentoWebhook } from '../api/webhook';
import { supabase } from '../services/supabaseClient';
import { addMinutes, isSameMinute, parseISO } from 'date-fns';

export function useBooking(doctorId: string | null) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Buscar agendamentos do Supabase
  useEffect(() => {
    async function fetchAppointments() {
      if (!doctorId) return;
      
      try {
        const { data, error } = await supabase
          .from('appointments')
          .select('appointment_date')
          .eq('doctor_id', doctorId)
          // Na triagem só precisamos saber quais horários não estão 'no_show'
          .neq('status', 'no_show');
        
        if (data) {
          setAppointments(data as Appointment[]);
        }
      } catch (err) {
        // Silencioso no front do paciente
      }
    }
    fetchAppointments();
  }, [doctorId]);

  // Gerar slots do dia
  const generateDailySlots = useCallback((date: Date, startTime: string, endTime: string) => {
    const slots: Date[] = [];
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    let currentSlot = new Date(date);
    currentSlot.setHours(startHour, startMin, 0, 0);
    
    const endSlot = new Date(date);
    endSlot.setHours(endHour, endMin, 0, 0);

    while (currentSlot < endSlot) {
      slots.push(new Date(currentSlot));
      currentSlot = addMinutes(currentSlot, 60);
    }
    
    return slots;
  }, []);

  const getAvailableSlots = useCallback((date: Date, startTime: string = "08:00", endTime: string = "18:00") => {
    const dailySlots = generateDailySlots(date, startTime, endTime);
    
    return dailySlots.map(slotDate => {
      const isBooked = appointments.some(
        a => isSameMinute(parseISO(a.appointment_date), slotDate)
      );
      return {
        date: slotDate,
        isAvailable: !isBooked,
      };
    });
  }, [generateDailySlots, appointments]);

  const validarDoubleBooking = (newAppt: Partial<Appointment>) => {
    return appointments.some(
      a => a.appointment_date === newAppt.appointment_date
    );
  };

  const confirmarAgendamento = useCallback(async (dados: Partial<Appointment>) => {
    if (!doctorId) {
      setError('Doutor não identificado.');
      throw new Error('Doutor não identificado.');
    }

    setLoading(true);
    setError(null);

    const novoAgendamento: Partial<Appointment> = {
        doctor_id: doctorId,
        appointment_date: dados.appointment_date,
        patient_name: dados.patient_name || '',
        whatsapp: dados.whatsapp || '',
        notes: dados.notes || '',
        status: 'pending',
        is_recurrent: false,
    };

    try {
        if (validarDoubleBooking(novoAgendamento)) {
            throw new Error('Horário Indisponível (Double Booking)');
        }

        // Salvar localmente
        setAppointments(prev => [...prev, novoAgendamento as Appointment]);

        const { error: supaError } = await supabase
          .from('appointments')
          .insert([novoAgendamento]);
        
        if (supaError) {
          throw new Error('Conflito no Servidor.');
        }
        
        // Aqui no futuro pode ser adaptado pro n8n usar a nova interface
        // await confirmarAgendamentoWebhook(novoAgendamento);
        
        return novoAgendamento;
        
    } catch (err: any) {
        setError(err.message || 'Erro ao agendar');
        throw err;
    } finally {
        setLoading(false);
    }
  }, [appointments, doctorId]);

  return { getAvailableSlots, confirmarAgendamento, loading, error };
}
