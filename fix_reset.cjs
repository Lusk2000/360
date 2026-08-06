const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `setReportType('ponto'); setIsReportModalOpen(true);`;
const replacement = `setReportType('ponto'); setReportDateStart(''); setReportDateEnd(''); setIsReportModalOpen(true);`;

if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('src/App.tsx', code);
    console.log("Success");
} else {
    console.log("Not found");
}
