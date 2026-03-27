-- Script v6: Configurações de Doutor e Privacidade
-- Adiciona o valor padrão da sessão no perfil do psicólogo

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS default_session_value numeric(10,2) DEFAULT 160.00;

COMMENT ON COLUMN public.profiles.default_session_value IS 'Valor padrão sugerido para novas sessões e pacientes sem valor definido.';
