import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/\(doc as any\)\.autoTable\(\{/g, 'autoTable(doc, {');
content = content.replace(/\(doc as any\)\.lastAutoTable/g, '(doc as any).lastAutoTable');

fs.writeFileSync('src/App.tsx', content);
