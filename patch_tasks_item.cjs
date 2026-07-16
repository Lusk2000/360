const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  "{isSystemAdmin && (\n                                          <div className=\"flex items-center gap-1 text-[10px] uppercase font-black tracking-widest text-slate-600 bg-slate-950/50 px-2 py-0.5 rounded-md border border-slate-800\">\n                                            <User size={10} />\n                                            {responsavelName}\n                                          </div>\n                                        )}",
  "{USER_PROFILES[currentUserProfile]?.role === 'administrator' && (\n                                          <div className=\"flex items-center gap-1 text-[10px] uppercase font-black tracking-widest text-slate-600 bg-slate-950/50 px-2 py-0.5 rounded-md border border-slate-800\">\n                                            <User size={10} />\n                                            {responsavelName}\n                                          </div>\n                                        )}"
);

fs.writeFileSync('src/App.tsx', content);
