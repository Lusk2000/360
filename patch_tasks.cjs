const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  "{isSystemAdmin && (\n                    <div className=\"flex gap-2 border-b border-slate-800 pb-4 overflow-x-auto scrollbar-hide\">\n                      {RESPONSAVEIS.map((r: any) => (\n                        <button key={r.value} onClick={() => setTaskFilterPerson(r.value)}",
  "{USER_PROFILES[currentUserProfile]?.role === 'administrator' && (\n                    <div className=\"flex gap-2 border-b border-slate-800 pb-4 overflow-x-auto scrollbar-hide\">\n                      <button onClick={() => setTaskFilterPerson('all')} className={`whitespace-nowrap pb-2 px-4 text-sm font-black uppercase tracking-widest transition-all ${taskFilterPerson === 'all' ? 'text-emerald-500 border-b-2 border-emerald-500' : 'text-slate-500 hover:text-slate-300'}`}>Todos</button>\n                      {RESPONSAVEIS.map((r: any) => (\n                        <button key={r.value} onClick={() => setTaskFilterPerson(r.value)}"
);

fs.writeFileSync('src/App.tsx', content);
