import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ipmtnzsdgbtibaekaldj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwbXRuenNkZ2J0aWJhZWthbGRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1NDI3ODQsImV4cCI6MjA5MDExODc4NH0.E7sSG2t4njgstz2ge9YhHgx8uxxjpDfTDy5FOc0UwPc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCols(table, cols) {
  const invalidCols = [];
  for (const col of cols) {
    const { error } = await supabase.from(table).insert({[col]: 'test'});
    if (error?.code === 'PGRST204') invalidCols.push(col);
  }
  console.log(`${table} INVALID:`, invalidCols);
}

async function run() {
  await testCols('services', ['nome', 'telefone', 'email', 'rede_social', 'servico', 'valor', 'status', 'user_id']);
  await testCols('transactions', ['type', 'data', 'categoria', 'valor', 'status', 'descricao', 'user_id', 'titulo', 'localizacao', 'hora', 'forma_pagamento']);
  await testCols('appointments', ['titulo', 'data', 'hora', 'status', 'localizacao', 'descricao', 'user_id']);
  await testCols('tasks', ['titulo', 'descricao', 'prioridade', 'status', 'data', 'atribuido_a', 'is_recurring', 'user_id']);
}
run();
