const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  "const displayPontos = (USER_PROFILES[currentUserProfile]?.permissions?.full_access ? todosPontos : meusPontos).filter((p: any) => p.tipo !== 'CONFIG');",
  "const displayPontos = (USER_PROFILES[currentUserProfile]?.role === 'administrator' ? todosPontos : meusPontos).filter((p: any) => p.tipo !== 'CONFIG');"
);

content = content.replace(
  "const titulo = USER_PROFILES[currentUserProfile]?.permissions?.full_access ? 'Folha de Ponto Geral' : 'Minha Folha de Ponto';",
  "const titulo = USER_PROFILES[currentUserProfile]?.role === 'administrator' ? 'Folha de Ponto Geral' : 'Minha Folha de Ponto';"
);

content = content.replace(
  "<h3 className=\"text-xl font-bold text-white uppercase tracking-wider\">{USER_PROFILES[currentUserProfile]?.permissions?.full_access ? 'Todos os Registros' : 'Meus Registros'}</h3>",
  "<h3 className=\"text-xl font-bold text-white uppercase tracking-wider\">{USER_PROFILES[currentUserProfile]?.role === 'administrator' ? 'Todos os Registros' : 'Meus Registros'}</h3>"
);

fs.writeFileSync('src/App.tsx', content);
