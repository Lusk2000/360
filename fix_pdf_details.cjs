const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "const observacoes = day.extraDetails?.concat(day.delayDetails || []).map(d => d.split(':')[0]).join(', ') || '';",
  "const observacoes = (day.extraDetails || []).concat(day.delayDetails || []).join(' | ');"
);

fs.writeFileSync('src/App.tsx', code);
