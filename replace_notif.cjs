const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const replacement = `  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const notifs: any[] = [];
    clients.forEach((c: any) => {
      if (c.status === 'Cliente Ativo') {
        if (c.dia_pagamento) {
          const diaPagamento = parseInt(c.dia_pagamento, 10);
          if (!isNaN(diaPagamento)) {
            const todayRaw = new Date();
            const prevMonth = new Date(todayRaw.getFullYear(), todayRaw.getMonth() - 1, diaPagamento);
            const currentMonth = new Date(todayRaw.getFullYear(), todayRaw.getMonth(), diaPagamento);
            const nextMonth = new Date(todayRaw.getFullYear(), todayRaw.getMonth() + 1, diaPagamento);
            
            const distPrev = (todayRaw.getTime() - prevMonth.getTime()) / (1000 * 3600 * 24);
            const distCurr = (todayRaw.getTime() - currentMonth.getTime()) / (1000 * 3600 * 24);
            const distNext = (todayRaw.getTime() - nextMonth.getTime()) / (1000 * 3600 * 24);
            
            let closestDist = distCurr;
            
            if (Math.abs(distPrev) < Math.abs(closestDist)) { closestDist = distPrev; }
            if (Math.abs(distNext) < Math.abs(closestDist)) { closestDist = distNext; }
            
            // Notify 3 days before up to 3 days after
            if (closestDist >= -3 && closestDist <= 3) {
               let msg = '';
               if (closestDist < -1) msg = \`Pagamento vence em \${Math.ceil(Math.abs(closestDist))} dias\`;
               else if (closestDist > 1) msg = \`Pagamento venceu há \${Math.floor(closestDist)} dias\`;
               else if (closestDist > 0 && closestDist <= 1) msg = \`Pagamento venceu ontem\`;
               else if (closestDist < 0 && closestDist >= -1) msg = \`Pagamento vence amanhã\`;
               else msg = \`Pagamento vence hoje\`;
               
               notifs.push({
                 id: c.id + '_pag',
                 title: c.nome || c.empresa,
                 msg: msg,
                 dia: diaPagamento,
                 type: 'pagamento'
               });
            }
          }
        }
        
        if (c.data_fim_contrato) {
          const [year, month, day] = c.data_fim_contrato.split('-');
          if (year && month && day) {
            const endData = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
            endData.setHours(0,0,0,0);
            const diffTime = endData.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays >= -5 && diffDays <= 15) {
               let msg = '';
               if (diffDays === 0) msg = 'Contrato termina hoje';
               else if (diffDays === 1) msg = 'Contrato termina amanhã';
               else if (diffDays > 1) msg = \`Contrato termina em \${diffDays} dias\`;
               else if (diffDays === -1) msg = 'Contrato terminou ontem';
               else msg = \`Contrato terminou há \${Math.abs(diffDays)} dias\`;
               
               notifs.push({
                 id: c.id + '_contrato',
                 title: c.nome || c.empresa,
                 msg: msg,
                 dia: c.data_fim_contrato.split('-').reverse().join('/'),
                 type: 'contrato'
               });
            }
          }
        }
      }
    });
    setClientPaymentNotifications(notifs);
  }, [clients]);`;

const startIndex = code.indexOf('  useEffect(() => {\n    const today = new Date();\n    const notifs: any[] = [];');
const endIndex = code.indexOf('  useEffect(() => {\n    let mounted = true;');

if (startIndex === -1 || endIndex === -1) {
  console.error("Could not find bounds");
  process.exit(1);
}

const newCode = code.slice(0, startIndex) + replacement + '\n' + code.slice(endIndex);
fs.writeFileSync('src/App.tsx', newCode);
console.log('App.tsx notifications updated successfully.');
