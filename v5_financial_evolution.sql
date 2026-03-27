-- Script v5: Gestão Financeira Completa
-- Rode este script no Editor SQL do Supabase para ativar os novos campos

-- 1. Garantir campos na tabela de PACIENTES
ALTER TABLE public.patients 
ADD COLUMN IF NOT EXISTS base_session_value numeric(10,2) DEFAULT 160.00,
ADD COLUMN IF NOT EXISTS notes text;

-- 2. Garantir campos na tabela de AGENDAMENTOS
-- Estes campos permitem controlar se o paciente pagou e como pagou
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS price numeric(10,2),
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'unpaid', -- paid, unpaid, partial
ADD COLUMN IF NOT EXISTS payment_method text; -- pix, money, card, other

-- 3. Adicionar uma nova constraint de unicidade para evitar duplicação no Sync
-- (Isso garante que um doutor não cadastre o mesmo WhatsApp duas vezes)
ALTER TABLE public.patients 
ADD CONSTRAINT patients_doctor_id_whatsapp_key UNIQUE (doctor_id, whatsapp);

-- 4. Índices para performance financeira
CREATE INDEX IF NOT EXISTS idx_appointments_payment_status ON public.appointments(payment_status);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date ON public.appointments(doctor_id, appointment_date);

COMMENT ON COLUMN public.appointments.payment_status IS 'Status do pagamento da sessão: paid, unpaid, partial';
COMMENT ON COLUMN public.appointments.payment_method IS 'Forma de pagamento utilizada: pix, money, card, other';
