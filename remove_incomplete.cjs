const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = "if (day.hasIncomplete) dayObs += 'Dia Incompleto. ';";

if (code.includes(target)) {
    code = code.replace(target, '');
    fs.writeFileSync('src/App.tsx', code);
    console.log("Success");
} else {
    console.log("Not found");
}
