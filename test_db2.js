import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://ipmtnzsdgbtibaekaldj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwbXRuenNkZ2J0aWJhZWthbGRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1NDI3ODQsImV4cCI6MjA5MDExODc4NH0.E7sSG2t4njgstz2ge9YhHgx8uxxjpDfTDy5FOc0UwPc';
const supabase = createClient(supabaseUrl, supabaseKey);
async function run() {
  const { data: authData } = await supabase.auth.signInWithPassword({ email: 'caetanomentor360@gmail.com', password: '360mentoria' }); 
  const { data, error, status } = await supabase.from('services').select('*');
  console.log('services fetch:', data?.length, error, status);
}
run();
