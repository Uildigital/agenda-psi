-- Script v8: Módulo de Anamnese Profissional
-- Criação de estrutura para armazenamento de anamnese clínica detalhada.

CREATE TABLE IF NOT EXISTS public.patient_anamnesis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES auth.users(id),
    
    -- Dados da Anamnese (Uso de JSONB para flexibilidade estrutural)
    content JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Metadados
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ativar RLS
ALTER TABLE public.patient_anamnesis ENABLE ROW LEVEL SECURITY;

-- Políticas de Segurança (Isolation)
CREATE POLICY "Profissionais podem ver anamneses de seus pacientes"
ON public.patient_anamnesis FOR SELECT
USING (auth.uid() = doctor_id);

CREATE POLICY "Profissionais podem criar anamneses para seus pacientes"
ON public.patient_anamnesis FOR INSERT
WITH CHECK (auth.uid() = doctor_id);

CREATE POLICY "Profissionais podem atualizar anamneses de seus pacientes"
ON public.patient_anamnesis FOR UPDATE
USING (auth.uid() = doctor_id);

CREATE POLICY "Profissionais podem deletar anamneses de seus pacientes"
ON public.patient_anamnesis FOR DELETE
USING (auth.uid() = doctor_id);

-- trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_patient_anamnesis_updated_at
BEFORE UPDATE ON public.patient_anamnesis
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

-- Documentação
COMMENT ON TABLE public.patient_anamnesis IS 'Módulo de anamnese profissional detalhada para psicólogos.';
