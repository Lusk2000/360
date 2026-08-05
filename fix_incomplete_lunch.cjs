const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
    "addDelay(lunchDuration, 'Almoço incompleto');",
    "// addDelay(lunchDuration, 'Almoço incompleto'); // Removido para não penalizar duplamente, usando a regra padrão do sistema."
);

fs.writeFileSync('src/App.tsx', code);
console.log("Success");
