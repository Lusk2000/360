const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Inject helpers after imports
const helperCode = `
export const getBRTDate = (date: Date | string | number = new Date()) => {
  return new Date(new Date(date).toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
};

export const getBRTDateString = (date: Date | string | number = new Date()) => {
  const brtDate = getBRTDate(date);
  const yyyy = brtDate.getFullYear();
  const mm = String(brtDate.getMonth() + 1).padStart(2, '0');
  const dd = String(brtDate.getDate()).padStart(2, '0');
  return \`\${yyyy}-\${mm}-\${dd}\`;
};
`;

if (!code.includes('getBRTDateString')) {
    code = code.replace("import { supabase } from './lib/supabase';", "import { supabase } from './lib/supabase';\n" + helperCode);
}

// 1. Replace new Date().toISOString().split('T')[0]
code = code.replace(/new Date\(\)\.toISOString\(\)\.split\('T'\)\[0\]/g, "getBRTDateString()");

// 2. Fix the missing {timeZone: 'UTC'} for date strings
code = code.replace(/new Date\(t\.data\)\.toLocaleDateString\('pt-BR'\)/g, "new Date(t.data).toLocaleDateString('pt-BR', {timeZone: 'UTC'})");
code = code.replace(/new Date\(report\.data\)\.toLocaleDateString\('pt-BR'\)/g, "new Date(report.data).toLocaleDateString('pt-BR', {timeZone: 'UTC'})");

// 3. Ponto timestamps - ensure they use BRT for display
// In App.tsx around line 1474
code = code.replace("const dateStr = dateObj.toLocaleDateString('pt-BR');", "const dateStr = new Date(p.data_hora).toLocaleDateString('pt-BR', {timeZone: 'America/Sao_Paulo'});");
code = code.replace("const timeStr = new Date(p.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });", "const timeStr = new Date(p.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });");
code = code.replace("const dayOfWeek = dateObj.toLocaleDateString('pt-BR', { weekday: 'short' });", "const dayOfWeek = new Date(p.data_hora).toLocaleDateString('pt-BR', { weekday: 'short', timeZone: 'America/Sao_Paulo' });");

// 4. Update the current clock UI
code = code.replace("currentTime.toLocaleTimeString('pt-BR')", "currentTime.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' })");
code = code.replace("currentTime.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })", "currentTime.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'America/Sao_Paulo' })");

// 5. Fix tolerance checking (isOutsideTolerance)
code = code.replace("isOutsideTolerance(tipo, new Date())", "isOutsideTolerance(tipo, getBRTDate())");
code = code.replace("isOutsideTolerance(pendingPonto, new Date())", "isOutsideTolerance(pendingPonto, getBRTDate())");

// 6. Fix `todayStr` in calculateWorkedMinutes (line 1267) which uses timezone offset math.
// Replace it with getBRTDateString
code = code.replace(/const todayStr = new Date\(time\.getTime\(\) - \(time\.getTimezoneOffset\(\) \* 60000\)\)\.toISOString\(\)\.split\('T'\)\[0\];/g, "const todayStr = getBRTDateString(time);");

// Same for line 2733 inside effect
code = code.replace(/const todayStr = new Date\(today\.getTime\(\) - \(today\.getTimezoneOffset\(\) \* 60000\)\)\.toISOString\(\)\.split\('T'\)\[0\];/g, "const todayStr = getBRTDateString();");

// Same for line 4160
code = code.replace(/const todayStr = new Date\(new Date\(\)\.getTime\(\) - \(new Date\(\)\.getTimezoneOffset\(\) \* 60000\)\)\.toISOString\(\)\.split\('T'\)\[0\];/g, "const todayStr = getBRTDateString();");

// 7. Month parsing for dashboard clients
code = code.replace("clients.filter((c: any) => new Date(c.created_at).getMonth() === new Date().getMonth())", "clients.filter((c: any) => getBRTDate(c.created_at).getMonth() === getBRTDate().getMonth())");

// 8. Fix updated_at formatted in task modal
code = code.replace("new Date(task.updated_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })", "new Date(task.updated_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })");

// 9. Fix pdf generated report timestamps
code = code.replace(/const timestamp = new Date\(\)\.toLocaleTimeString\(\);/g, "const timestamp = new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' });");

// 10. `calculateWorkedMinutes` timezone logic
code = code.replace(/let dateObj = new Date\(p\.data_hora\);/g, "let dateObj = getBRTDate(p.data_hora);");
code = code.replace(/const saidaTime = new Date\(saidaAlmoco\.data_hora\);/g, "const saidaTime = getBRTDate(saidaAlmoco.data_hora);");

fs.writeFileSync('src/App.tsx', code);
console.log('Replacements completed.');
