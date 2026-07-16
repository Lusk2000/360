const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  "{isSystemAdmin && (\n                           <select \n                              value={reportFilterUser}",
  "{USER_PROFILES[currentUserProfile]?.role === 'administrator' && (\n                           <select \n                              value={reportFilterUser}"
);

content = content.replace(
  "downloadDailyReports(isSystemAdmin ? reportFilterUser : currentUserProfile, reportFilterDate)",
  "downloadDailyReports(USER_PROFILES[currentUserProfile]?.role === 'administrator' ? reportFilterUser : currentUserProfile, reportFilterDate)"
);

fs.writeFileSync('src/App.tsx', content);
