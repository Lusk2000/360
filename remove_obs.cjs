const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `              const observacoes = (day.extraDetails || []).concat(day.delayDetails || []).join(' | ');
              if (observacoes) {
                  dayObs += \` (\${observacoes})\`;
              }`;

if (code.includes(target)) {
    code = code.replace(target, '');
    fs.writeFileSync('src/App.tsx', code);
    console.log("Success");
} else {
    console.log("Not found");
}
