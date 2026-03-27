import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf-8');
const supabaseUrl = env.match(/VITE_SUPABASE_URL=(.*)/)?.[1].trim();
const supabaseKey = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1].trim(); // Service Role Key

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
  console.log('Iniciando migração de pacientes...');
  
  // 1. Pegar todos os agendamentos
  const { data: appts, error: fetchError } = await supabase.from('appointments').select('*');
  
  if (fetchError) {
    console.error('Erro ao buscar agendamentos:', fetchError);
    return;
  }

  console.log(`Encontrados ${appts.length} agendamentos. Extraindo pacientes únicos...`);

  const uniquePatients = new Map();
  appts.forEach(a => {
    const key = `${a.doctor_id}-${a.whatsapp}`;
    if (!uniquePatients.has(key)) {
      uniquePatients.set(key, {
        doctor_id: a.doctor_id,
        full_name: a.patient_name,
        whatsapp: a.whatsapp
      });
    }
  });

  console.log(`Extraídos ${uniquePatients.size} pacientes únicos.`);

  for (const [key, p] of uniquePatients.entries()) {
    console.log(`Migrando: ${p.full_name} (${p.whatsapp})...`);
    
    // Inserir ou Pegar Paciente
    const { data: patientData, error: pError } = await supabase
      .from('patients')
      .upsert(p, { onConflict: 'doctor_id,whatsapp' })
      .select()
      .single();

    if (pError) {
      console.error(`Erro ao criar paciente ${p.full_name}:`, pError.message);
      continue;
    }

    const patientId = patientData.id;

    // Atualizar agendamentos desse paciente com o ID real
    const { error: upError } = await supabase
      .from('appointments')
      .update({ patient_id: patientId })
      .eq('doctor_id', p.doctor_id)
      .eq('whatsapp', p.whatsapp);

    if (upError) {
      console.error(`Erro ao vincular agendamentos de ${p.full_name}:`, upError.message);
    }
  }

  console.log('>>> Migração concluída com sucesso! <<<');
}

migrate();
