const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  "      financial: 'full', \n      agenda: 'full', \n      services: 'full',\n      can_delete: true",
  "      financial: 'full', \n      reports: 'full',\n      agenda: 'full', \n      services: 'full',\n      can_delete: true"
);

fs.writeFileSync('src/App.tsx', content);
