const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const replacement = `                {clientPaymentNotifications.map((notif: any) => (
                  <div key={\`client-notif-\${notif.id}\`} className={\`\${notif.type === 'contrato' ? 'bg-purple-500/10 border-purple-500 text-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.3)]' : 'bg-amber-500/10 border-amber-500 text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.3)]'} border p-5 rounded-3xl flex items-center justify-between gap-4\`}>
                    <div className="flex items-center gap-4">
                      <div className={\`w-12 h-12 rounded-full flex items-center justify-center shrink-0 \${notif.type === 'contrato' ? 'bg-purple-500' : 'bg-amber-500'}\`}>
                        {notif.type === 'contrato' ? <FileText size={24} className="text-slate-950" /> : <DollarSign size={24} className="text-slate-950" />}
                      </div>
                      <div>
                        <h4 className="font-black text-lg tracking-tight">
                          {notif.type === 'contrato' ? 'ALERTA DE CONTRATO' : 'LEMBRETE DE COBRANÇA'}: {notif.title}
                        </h4>
                        <p className={\`text-sm font-bold mt-1 uppercase tracking-widest flex items-center gap-1 \${notif.type === 'contrato' ? 'text-purple-400/80' : 'text-amber-400/80'}\`}>
                          {notif.msg} {notif.type === 'contrato' ? \`(\${notif.dia})\` : \`(Dia \${notif.dia})\`}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
`;

const startIndex = code.indexOf('{clientPaymentNotifications.map((notif: any) => (');
const endIndex = code.indexOf('              </motion.div>', startIndex);

if (startIndex === -1 || endIndex === -1) {
  console.error("Could not find bounds");
  process.exit(1);
}

const newCode = code.slice(0, startIndex) + replacement + code.slice(endIndex);
fs.writeFileSync('src/App.tsx', newCode);
console.log('App.tsx notification UI updated successfully.');
