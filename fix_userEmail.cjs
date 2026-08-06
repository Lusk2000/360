const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = "        const userEmail = sortedDays.length > 0 ? (sortedDays[0]['Entrada']?.usuario_email || userName) : userName;";
code = code.replace(target, "");

fs.writeFileSync('src/App.tsx', code);
console.log("Success");
