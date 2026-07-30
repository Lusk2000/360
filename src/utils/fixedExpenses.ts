export const getFixedExpensesTasks = (tasks: any[]) => {
  return tasks.filter(t => t.is_recurring && t.titulo?.startsWith('[GASTO_FIXO]'));
};

export const parseFixedExpense = (task: any) => {
  try {
    const data = JSON.parse(task.descricao);
    return { ...data, id: task.id, active: task.status !== 'done', created_at: task.created_at, titulo: task.titulo, name: data.name || task.titulo?.replace('[GASTO_FIXO] ', '') };
  } catch(e) {
    return null;
  }
};

export const getPendingFixedExpensesNotifications = (tasks: any[], transactions: any[]) => {
  const fixedTasks = getFixedExpensesTasks(tasks).map(parseFixedExpense).filter(Boolean);
  const notifications: any[] = [];
  
  // Date in local timezone
  const todayDate = new Date();
  const today = new Date(todayDate.getTime() - (todayDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
  
  for (const ft of fixedTasks) {
    if (!ft.active) continue;
    
    const relatedTxs = transactions.filter(tx => {
       if (tx.type !== 'expense') return false;
       try {
         const desc = JSON.parse(tx._raw_descricao || '{}');
         return desc.fixedExpenseId === ft.id;
       } catch(e) { return false; }
    });
    
    const pendingTxs = relatedTxs.filter(tx => tx.status === 'pending');
    for (const pTx of pendingTxs) {
       if (pTx.data <= today) {
         notifications.push({
           id: pTx.id,
           title: ft.name || 'Despesa Fixa',
           dueDate: pTx.data,
           value: pTx.valor
         });
       }
    }
  }
  
  return notifications;
};

const addDays = (dateStr: string, days: number) => {
   const d = new Date(dateStr + 'T00:00:00Z'); // force UTC to avoid timezone shift
   d.setUTCDate(d.getUTCDate() + days);
   return d.toISOString().split('T')[0];
};


const addMonths = (dateStr: string, months: number, preferredDay?: number) => {
   const d = new Date(dateStr + 'T00:00:00Z');
   const targetMonth = d.getUTCMonth() + months;
   const targetYear = d.getUTCFullYear() + Math.floor(targetMonth / 12);
   const normalizedMonth = ((targetMonth % 12) + 12) % 12; // handle negatives if any
   
   let targetDay = preferredDay || d.getUTCDate();
   
   const lastDayOfTargetMonth = new Date(targetYear, normalizedMonth + 1, 0).getUTCDate();
   if (targetDay > lastDayOfTargetMonth) {
       targetDay = lastDayOfTargetMonth;
   }
   
   const res = new Date(Date.UTC(targetYear, normalizedMonth, targetDay));
   return res.toISOString().split('T')[0];
};


export const syncFixedExpenses = async (tasks: any[], transactions: any[], supabase: any) => {
   const fixedTasks = getFixedExpensesTasks(tasks).map(parseFixedExpense).filter(Boolean);
   let inserted = false;
   
   const todayDate = new Date();
   const today = new Date(todayDate.getTime() - (todayDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
   
   for (const ft of fixedTasks) {
      if (!ft.active) continue;
      
      const relatedTxs = transactions.filter(tx => {
         if (tx.type !== 'expense') return false;
         try {
           const desc = JSON.parse(tx._raw_descricao || '{}');
           return desc.fixedExpenseId === ft.id;
         } catch(e) { return false; }
      });
      
      // Find the latest transaction for this fixed expense
      relatedTxs.sort((a, b) => a.data.localeCompare(b.data));
      

      let nextDate = '';
      if (relatedTxs.length === 0) {
         // Determine the first date based on ft.day
         const d = new Date(todayDate.getTime() - (todayDate.getTimezoneOffset() * 60000));
         let targetDay = Number(ft.day) || 1;
         
         // Fix day overflow (e.g. Feb 30 -> Feb 28)
         const lastDayOfMonth = new Date(d.getUTCFullYear(), d.getUTCMonth() + 1, 0).getUTCDate();
         if (targetDay > lastDayOfMonth) targetDay = lastDayOfMonth;
         
         d.setUTCDate(targetDay);
         
         // If the date has already passed this month (e.g. today is 15th, target is 5th), 
         // we should still generate it for this month (it will be immediately overdue),
         // because the user probably meant for this month. 
         // If they meant next month, they wouldn't have created it now?
         // Let's just use this month's date!
         nextDate = d.toISOString().split('T')[0];
      } else {

         const lastTx = relatedTxs[relatedTxs.length - 1];
         // Calculate next date based on recurrence
         if (ft.recurrence === 'Semanal') {
            nextDate = addDays(lastTx.data, 7);
         } else if (ft.recurrence === 'Quinzenal') {
            nextDate = addDays(lastTx.data, 15);
         } else if (ft.recurrence === 'Anual') {
            nextDate = addMonths(lastTx.data, 12, Number(ft.day));
         } else {
            // Mensal
            nextDate = addMonths(lastTx.data, 1, Number(ft.day));
         }
      }
      
      // If nextDate is today or in the past, or in the very near future (like within this month?),
      // Actually, if it's due within the next 30 days, we can generate it?
      // Wait, "Adicionar automaticamente a despesa do novo período".
      // Let's generate it if nextDate is <= today + 15 days, so they appear in advance.
      const advanceDays = 15;
      const thresholdDate = addDays(today, advanceDays);
      
      let currentNextDate = nextDate;
      // We might need to generate multiple if they haven't opened the app for a long time
      while (currentNextDate <= thresholdDate) {
         const payload = {
            type: 'expense',
            valor: ft.value,
            data: currentNextDate,
            status: 'pending',
            created_at: new Date().toISOString(),
            descricao: JSON.stringify({
              descricao: ft.obs || '',
              categoria: ft.category || 'Gasto Fixo',
              forma_pagamento: ft.paymentMethod || 'PIX',
              fixedExpenseId: ft.id,
              period: currentNextDate // just use date as period marker
            })
         };
         
         try {
            const { error } = await supabase.from('transactions').insert(payload);
            if (!error) inserted = true;
         } catch (e: any) {
            if(e?.message?.includes('Failed to fetch')) { console.warn('Error inserting fixed expense:', e); } else { console.error('Error inserting fixed expense:', e); }
         }
         
         if (ft.recurrence === 'Semanal') {
            currentNextDate = addDays(currentNextDate, 7);
         } else if (ft.recurrence === 'Quinzenal') {
            currentNextDate = addDays(currentNextDate, 15);
         } else if (ft.recurrence === 'Anual') {
            currentNextDate = addMonths(currentNextDate, 12, Number(ft.day));
         } else {
            currentNextDate = addMonths(currentNextDate, 1, Number(ft.day));
         }
      }
   }
   
   return inserted;
};
