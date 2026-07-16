const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  "    if (isSystemAdmin) {\n      return (\n        <button \n          onClick={() => openEditModal(pointData)}",
  "    if (USER_PROFILES[currentUserProfile]?.role === 'administrator') {\n      return (\n        <button \n          onClick={() => openEditModal(pointData)}"
);

fs.writeFileSync('src/App.tsx', content);
