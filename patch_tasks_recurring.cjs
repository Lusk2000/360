const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  "                  await supabase.from('tasks').update({\n                      is_recurring: false\n                  }).eq('id', t.id);\n                  t.is_recurring = false;\n                  \n                  const newTask = {\n                      titulo: t.titulo,\n                      descricao: t.descricao,\n                      status: 'pending',\n                      prioridade: t.prioridade,\n                      atribuido_a: t.atribuido_a,\n                      data: null, // não tem data, ou t.data\n                      is_recurring: true,\n                      user_id: t.user_id,\n                      created_at: new Date().toISOString(),\n                      updated_at: new Date().toISOString()\n                  };\n                  \n                  const { data: insertedTasks } = await supabase.from('tasks').insert([newTask]).select();\n                  if (insertedTasks && insertedTasks.length > 0) {\n                      data.push(...insertedTasks);\n                  }",
  "                  const now = new Date().toISOString();\n                  await supabase.from('tasks').update({\n                      status: 'pending',\n                      updated_at: now\n                  }).eq('id', t.id);\n                  t.status = 'pending';\n                  t.updated_at = now;"
);

fs.writeFileSync('src/App.tsx', content);
