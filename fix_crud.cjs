const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const handleDeleteTarget = `      const { error, status } = await supabase.from(collectionName).delete().eq('id', itemToDelete.id);
      if (error) {
        if (status === 401 || error.code === 'PGRST303') {
          const { data: refreshData } = await supabase.auth.getSession();
          if (!refreshData.session) logout();
        }
        throw error;
      }
    } catch (err: any) {`;
const handleDeleteReplacement = `      const { error, status } = await supabase.from(collectionName).delete().eq('id', itemToDelete.id);
      if (error) {
        if (status === 401 || error.code === 'PGRST303') {
          const { data: refreshData } = await supabase.auth.getSession();
          if (!refreshData.session) logout();
        }
        throw error;
      }
      
      fetchCollections(collectionName);
    } catch (err: any) {`;

const handleSaveTarget = `    try {
      const collectionName: any = {
        'clients': 'clients',
        'servicos': 'clients',
        'financial_control': 'transactions',
        'agenda': 'appointments',
        'tasks': 'tasks'
      }[activeTab];`;
const handleSaveReplacement = `    try {
      const collectionName: any = {
        'clients': 'clients',
        'servicos': 'servicos',
        'financial_control': 'transactions',
        'agenda': 'appointments',
        'tasks': 'tasks'
      }[activeTab];`;

let changed = false;
if (code.includes(handleDeleteTarget)) {
    code = code.replace(handleDeleteTarget, handleDeleteReplacement);
    changed = true;
} else {
    console.log("handleDeleteTarget not found");
}

if (code.includes(handleSaveTarget)) {
    code = code.replace(handleSaveTarget, handleSaveReplacement);
    changed = true;
} else {
    console.log("handleSaveTarget not found");
}

if (changed) {
    fs.writeFileSync('src/App.tsx', code);
    console.log("Success");
}
