-- 1. Cria a Tabela de Perfis Públicos dos Psicólogos (Tenants)
CREATE TABLE public.profiles (
  id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE, -- ex: 'dra-julia'
  full_name text NOT NULL,
  whatsapp_number text,
  custom_color text DEFAULT '#14b8a6', -- brand color personalizável
  created_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT pk_profiles PRIMARY KEY (id)
);

-- 2. Habilita Segurança no nível de linha (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de Acesso
-- Permitir que a Landing Page do paciente leia o slug sem estar logado
CREATE POLICY "Público pode ler perfis para acessar agenda"
ON public.profiles
FOR SELECT
USING (true);

-- Psicólogos podem atualizar e inserir as configurações da sua própria clínica
CREATE POLICY "Doutores podem gerenciar próprio perfil"
ON public.profiles
FOR ALL
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Gatilho (Trigger Opcional) para criar automaticamente um _profile_ vazio assim que o Admin se cadastrar pelo Auth pode ser feito lá no Supabase.
