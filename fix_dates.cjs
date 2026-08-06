const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target1 = `      const dateObj = new Date(editingPonto.fullDate);
      const [hours, minutes] = editTime.split(':');
      dateObj.setHours(parseInt(hours, 10));
      dateObj.setMinutes(parseInt(minutes, 10));
      const newDateStr = dateObj.toISOString();`;

const replacement1 = `      const brtDateStr = getBRTDateString(editingPonto.fullDate);
      const newDateStr = new Date(\`\${brtDateStr}T\${editTime}:00-03:00\`).toISOString();`;

const target2 = `const dateObj = new Date(\`\${manualAddData.data}T\${manualAddData.hora}:00\`);`;
const replacement2 = `const dateObj = new Date(\`\${manualAddData.data}T\${manualAddData.hora}:00-03:00\`);`;

if (code.includes(target1) && code.includes(target2)) {
    code = code.replace(target1, replacement1);
    code = code.replace(target2, replacement2);
    fs.writeFileSync('src/App.tsx', code);
    console.log("Success");
} else {
    console.log("Not found", code.includes(target1), code.includes(target2));
}
