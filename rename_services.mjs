import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

// Replace activeTab references
content = content.replace(/'services'/g, "'servicos'");

// Replace the permissions state to match? The permissions state has `services: 'full'`. We can leave it or change it to `servicos: 'full'`. Let's just replace all exact matches of 'services' to 'servicos'
// Wait, if we replace all 'services', it replaces permission keys too. Let's do it safely.

fs.writeFileSync('src/App.tsx', content);
