const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
const search = `const { error } = await supabase.from('pontos').update({ data_hora: newDateStr }).eq('id', editingPonto.id);`;
if (code.includes(search)) {
    console.log("Found it!");
} else {
    console.log("Not found.");
}
