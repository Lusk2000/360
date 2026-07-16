const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  /setIsSystemAdmin\(USER_PROFILES\[email\]\.role === 'administrator'\);/g,
  "setIsSystemAdmin(USER_PROFILES[email].role === 'administrator' || USER_PROFILES[email].role === 'gestor');"
);

fs.writeFileSync('src/App.tsx', content);
