const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  "{isSystemAdmin && (\n                                  <Select \n                                    label=\"Responsável\"",
  "{USER_PROFILES[currentUserProfile]?.role === 'administrator' && (\n                                  <Select \n                                    label=\"Responsável\""
);

fs.writeFileSync('src/App.tsx', content);
