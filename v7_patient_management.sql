-- Script v7: Evolução da Gestão de Pacientes
-- Adição de campos necessários para a gestão de status e precificação individual.

ALTER TABLE public.patients 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active',
ADD COLUMN IF NOT EXISTS base_session_value numeric(10,2) DEFAULT 160.00;

-- Documentação de Campos
COMMENT ON COLUMN public.patients.status IS 'Status do paciente na clínica (active/inactive).';
COMMENT ON COLUMN public.patients.base_session_value IS 'Valor da sessão acordado individualmente com este paciente.';
