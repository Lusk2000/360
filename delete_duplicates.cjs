const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

let supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (supabaseUrl && !supabaseUrl.startsWith('http')) {
    supabaseUrl = `https://${supabaseUrl}.supabase.co`;
}

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const getBRTDate = (date = new Date()) => {
  return new Date(new Date(date).toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
};

const getBRTDateString = (date = new Date()) => {
  const brtDate = getBRTDate(date);
  const yyyy = brtDate.getFullYear();
  const mm = String(brtDate.getMonth() + 1).padStart(2, '0');
  const dd = String(brtDate.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

async function run() {
  const { data, error } = await supabase.from('pontos').select('*');
  if (error) {
    console.error("Error fetching", error);
    return;
  }
  
  const toDelete = [];
  const seen = new Set();
  
  const sorted = data.sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime());
  
  for (const p of sorted) {
      if (p.tipo === 'CONFIG') continue;
      
      let dateObj = getBRTDate(p.data_hora);
      const parts = (p.tipo || '').split('::justificativa::');
      const baseTipo = parts[0];
      
      if (baseTipo !== 'Entrada' && dateObj.getHours() < 7) {
          dateObj = new Date(dateObj.getTime() - 24 * 60 * 60 * 1000);
      }
      const dateStr = getBRTDateString(dateObj);
      
      const key = `${p.usuario_email}-${dateStr}-${baseTipo}`;
      if (seen.has(key)) {
          toDelete.push(p.id);
      } else {
          seen.add(key);
      }
  }
  
  if (toDelete.length === 0) {
      console.log('Nenhuma duplicata encontrada no sistema.');
      return;
  }
  
  console.log(`Foram encontradas ${toDelete.length} duplicatas. Excluindo...`);
  
  for (let i = 0; i < toDelete.length; i += 50) {
      const chunk = toDelete.slice(i, i + 50);
      const { error: delErr } = await supabase.from('pontos').delete().in('id', chunk);
      if (delErr) {
         console.error("Erro ao deletar:", delErr);
      } else {
         console.log(`Deletado lote ${i}`);
      }
  }
  
  console.log('Duplicatas excluídas com sucesso!');
}

run();
