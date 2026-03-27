-- Tabela Principal de Agendamentos
CREATE TABLE public.agendamentos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  id_psicologo text NOT NULL,
  data_disponivel timestamp with time zone NOT NULL,
  slots_ocupados boolean NOT NULL DEFAULT true,
  nome_paciente text,
  cpf_paciente text,
  telefone_paciente text,
  motivo_consulta text,
  status_pagamento text DEFAULT 'pendente',
  created_at timestamp with time zone DEFAULT now(),
  
  -- Define a Chave Primária
  CONSTRAINT pk_agendamentos PRIMARY KEY (id),

  -- REGRA DE PREVENÇÃO DE CONFLITOS (Double Booking)
  -- Garante que o banco de dados barre inserções concorrentes para o mesmo psicólogo no mesmo horário exato
  CONSTRAINT unq_psicologo_horario UNIQUE (id_psicologo, data_disponivel)
);

-- SEGURANÇA (RLS - Row Level Security) Opcional porém recomendado
ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;

-- Cria políticas básicas para que o formulário frontend sem senha consiga Ler os horários vazios/ocupados
CREATE POLICY "Permitir leitura de horários"
ON public.agendamentos
FOR SELECT
USING (true);

-- Cria política permitindo que qualquer paciente agende (insira dados na tabela)
CREATE POLICY "Permitir criacao de agendamentos"
ON public.agendamentos
FOR INSERT
WITH CHECK (true);
