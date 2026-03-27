import type { Appointment } from '../types';

// Função para disparar webhook pro n8n
export const confirmarAgendamentoWebhook = async (agendamento: Appointment) => {
  const WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || 'https://seu-n8n.com/webhook/agendamento';
  
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(agendamento),
    });

    if (!response.ok) {
      console.warn('Falha no webhook. Ignorando para desenvolvimento.');
      // throw new Error('Falha ao acionar o webhook do n8n');
      return { success: false };
    }

    return await response.json();
  } catch (error) {
    console.warn('Erro no disparador do webhook:', error);
    // throw error; // Não quebra no dev
    return { success: false };
  }
};
