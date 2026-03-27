-- Script v7: Status de Paciente e Gerenciamento
-- Adiciona controle de status (Ativo/Inativo) para pacientes

ALTER TABLE public.patients 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';

-- Comentário para clareza
COMMENT ON COLUMN public.patients.status IS 'Status do paciente na clínica: active, inactive';

-- Índices para filtro rápido de ativos
CREATE INDEX IF NOT EXISTS idx_patients_status ON public.patients(status);
