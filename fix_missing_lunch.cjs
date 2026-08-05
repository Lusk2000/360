const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
    "addExtra(lunchDuration, 'Almoço não registrado');",
    "// addExtra(lunchDuration, 'Almoço não registrado'); // Removido para assumir almoço padrão conforme config"
);

fs.writeFileSync('src/App.tsx', code);
console.log("Success");
