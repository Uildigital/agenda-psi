import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf-8');
const supabaseUrl = env.match(/VITE_SUPABASE_URL=(.*)/)?.[1].trim();
const supabaseKey = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1].trim(); // Usuário salvou a Service Role Key

const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdminUser() {
  const email = 'admin@admin.com.br';
  const password = 'admin123';
  
  console.log(`Tentando criar usuário ${email}...`);
  // Criar Usuário no Auth pussando verificação de e-mail (graças à service key!)
  const { data: userData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  let userId;
  
  if (authError) {
    if (authError.message.includes('already registered')) {
      console.log('O e-mail já existe no banco. Recuperando ID dele para o perfil...');
      const { data: usersList } = await supabase.auth.admin.listUsers();
      userId = usersList.users.find(u => u.email === email)?.id;
    } else {
      console.error('Falha de criação Auth:', authError.message);
      return;
    }
  } else {
    userId = userData.user.id;
    console.log('Usuário Auth criado! ID:', userId);
  }

  if (userId) {
    console.log(`Criando/Atualizando a sala (Tenant) /dr-admin...`);
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: userId,
      slug: 'dr-admin',               // A URL será /dr-admin
      full_name: 'Doutor Admin Teste', // Nome na Página
      whatsapp_number: '5511999999999',
      custom_color: '#0ea5e9',        // Slate Blue color
    });
    
    if (profileError) {
      console.log('ERRO: Não consegui inserir no perfil. Você já criou a tabela PROFILES no painel do Supabase SQL Editor?');
      console.error(profileError.message);
    } else {
      console.log('>>> SUCESSO! <<<');
      console.log('Faça o Login com: admin@admin.com.br / admin123 na rota /login');
      console.log('Veja a Landing Page p/ marcação do admin na URL /dr-admin');
    }
  }
}

createAdminUser();
