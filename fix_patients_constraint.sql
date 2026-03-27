-- Script de Correção: Constraints de Pacientes
-- Resolve o erro 400 (Bad Request) ao fazer Upsert

-- 1. Identificar e remover eventuais duplicatas que impedem a criação da constraint
-- Mantém apenas o registro mais antigo (pelo ctid) para cada par (doctor_id, whatsapp)
DELETE FROM public.patients p1
USING public.patients p2
WHERE p1.ctid < p2.ctid
  AND p1.doctor_id = p2.doctor_id
  AND p1.whatsapp = p2.whatsapp;

-- 2. Garantir que a constraint UNIQUE exista
-- Se já existir, este comando falhará silenciosamente ou você pode remover a anterior
ALTER TABLE public.patients 
DROP CONSTRAINT IF EXISTS unq_doctor_patient_whatsapp;

ALTER TABLE public.patients 
ADD CONSTRAINT unq_doctor_patient_whatsapp UNIQUE (doctor_id, whatsapp);

-- 3. Índice para performance extra no upsert
CREATE INDEX IF NOT EXISTS idx_patients_upsert ON public.patients(doctor_id, whatsapp);

-- 4. Verificar se a coluna status existe (Garantia do v7)
ALTER TABLE public.patients 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';
