-- 1. Tabela de Pacientes (Para organizar a base individualmente)
CREATE TABLE public.patients (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES auth.users(id),
  full_name text NOT NULL,
  whatsapp text,
  email text,
  cpf text,
  created_at timestamp with time zone DEFAULT now(),
  date_of_birth date,
  notes text,

  CONSTRAINT pk_patients PRIMARY KEY (id),
  CONSTRAINT unq_doctor_patient_whatsapp UNIQUE (doctor_id, whatsapp) -- Cada psicólogo gerencia seus próprios contatos
);

-- 2. Tabela de Prontuários (Clinical Records / SOAP Notes)
CREATE TABLE public.medical_records (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id uuid NOT NULL REFERENCES auth.users(id),
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  content text NOT NULL, -- O corpo do prontuário
  symptoms text,
  obs text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),

  CONSTRAINT pk_medical_records PRIMARY KEY (id)
);

-- 3. Segurança RLS
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Docs can manage their own patients"
ON public.patients FOR ALL USING (auth.uid() = doctor_id) WITH CHECK (auth.uid() = doctor_id);

CREATE POLICY "Docs can manage their own medical records"
ON public.medical_records FOR ALL USING (auth.uid() = doctor_id) WITH CHECK (auth.uid() = doctor_id);

-- 4. Índices para performance
CREATE INDEX idx_patient_doctor ON public.patients(doctor_id);
CREATE INDEX idx_medical_records_patient ON public.medical_records(patient_id);

-- 5. Vincular agendamento antigo ao paciente novo
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS patient_id uuid REFERENCES public.patients(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON public.appointments(patient_id);
