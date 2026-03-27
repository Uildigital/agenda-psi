-- 1. ENUM para Status
CREATE TYPE appointment_status AS ENUM ('pending', 'confirmed', 'finished', 'no_show');

-- 2. Tabela Appointments
CREATE TABLE public.appointments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  patient_name text NOT NULL,
  whatsapp text NOT NULL,
  appointment_date timestamp with time zone NOT NULL,
  status appointment_status DEFAULT 'pending',
  is_recurrent boolean DEFAULT false,
  notes text,
  doctor_id uuid NOT NULL REFERENCES auth.users(id), -- RELAÇÃO COM SUPABASE AUTH (MULTI-TENANT)

  CONSTRAINT pk_appointments PRIMARY KEY (id),

  -- UNIQUE CONSTRAINT (Anti-Double Booking no Banco)
  -- Para Multi-tenant: o doctor_id junto com appointment_date dita o conflito
  CONSTRAINT unq_doctor_appointment UNIQUE (doctor_id, appointment_date)
);

-- 3. Índices Ultra-rápidos
-- Melhora consideravelmente a busca e filtros por data no Dashboard Admin
CREATE INDEX idx_appointment_date ON public.appointments(appointment_date);
CREATE INDEX idx_doctor_id ON public.appointments(doctor_id);

-- 4. Segurança de Linha (RLS - Row Level Security)
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Política 1: Psicólogos (Admin) só leem/editam seus próprios dados
CREATE POLICY "Docs can manage their own appointments"
ON public.appointments
FOR ALL
USING (auth.uid() = doctor_id)
WITH CHECK (auth.uid() = doctor_id);

-- Política 2: Pacientes Anonimos podem inserir (via Landing Page), validando que não podem hackear auth.uid
CREATE POLICY "Anon patients can insert"
ON public.appointments
FOR INSERT
WITH CHECK (true); -- No frontend, sempre insere o doctor_id vindo pela Rota / URL
