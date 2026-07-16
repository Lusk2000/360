const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  "'lucas360admin@gmail.com': { \n    role: 'administrator', \n    label: 'Lucas',\n    email: 'lucas360admin@gmail.com',\n    permissions: { \n      full_access: true, \n      financial: 'full', \n      reports: 'none',\n      agenda: 'full', \n      services: 'full',\n      can_delete: true\n    } \n  }",
  "'lucas360admin@gmail.com': { \n    role: 'administrator', \n    label: 'Lucas',\n    email: 'lucas360admin@gmail.com',\n    permissions: { \n      full_access: true, \n      financial: 'view', \n      reports: 'none',\n      agenda: 'full', \n      services: 'full',\n      can_delete: true\n    } \n  }"
);

content = content.replace(
  "'luan360@gmail.com': { \n    role: 'administrator', \n    label: 'Luan',\n    email: 'luan360@gmail.com',\n    permissions: { \n      full_access: true, \n      financial: 'full', \n      reports: 'none',\n      agenda: 'full', \n      services: 'full',\n      can_delete: true\n    } \n  }",
  "'luan360@gmail.com': { \n    role: 'administrator', \n    label: 'Luan',\n    email: 'luan360@gmail.com',\n    permissions: { \n      full_access: true, \n      financial: 'view', \n      reports: 'none',\n      agenda: 'full', \n      services: 'full',\n      can_delete: true\n    } \n  }"
);

fs.writeFileSync('src/App.tsx', content);
