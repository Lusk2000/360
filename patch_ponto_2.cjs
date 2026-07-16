const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  "const canExportReports = isSystemAdmin;",
  "const canExportReports = USER_PROFILES[currentUserProfile]?.role === 'administrator';"
);

content = content.replace(
  "{USER_PROFILES[currentUserProfile]?.permissions?.full_access && (\n             <button onClick={() => setShowSettings(true)}",
  "{USER_PROFILES[currentUserProfile]?.role === 'administrator' && (\n             <button onClick={() => setShowSettings(true)}"
);

content = content.replace(
  "{showSettings && isSystemAdmin && (\n        <div className=\"fixed inset-0",
  "{showSettings && USER_PROFILES[currentUserProfile]?.role === 'administrator' && (\n        <div className=\"fixed inset-0"
);

fs.writeFileSync('src/App.tsx', content);
