const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  "const openEditModal = (p: any) => {\n    if (!isSystemAdmin) return;",
  "const openEditModal = (p: any) => {\n    if (USER_PROFILES[currentUserProfile]?.role !== 'administrator') return;"
);

content = content.replace(
  "{editingPonto && isSystemAdmin && (",
  "{editingPonto && USER_PROFILES[currentUserProfile]?.role === 'administrator' && ("
);

fs.writeFileSync('src/App.tsx', content);
