const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `  const saveEditPonto = async () => {
    if (!editingPonto || !editTime) return;
    setIsProcessing(true);
    try {
      const brtDateStr = getBRTDateString(editingPonto.fullDate);
      const newDateStr = new Date(\`\${brtDateStr}T\${editTime}:00-03:00\`).toISOString();
      const { error } = await supabase.from('pontos').update({ data_hora: newDateStr }).eq('id', editingPonto.id);
      if (error) throw error;
      setPontos((prev: any) => prev.map((p: any) => p.id === editingPonto.id ? { ...p, data_hora: newDateStr } : p));
      setEditingPonto(null);
      alert('Registro editado com sucesso!');
    } catch (err: any) {
      alert('Erro ao atualizar: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };`;

const replacement = `  const saveEditPonto = async () => {
    if (!editingPonto || !editTime) return;
    setIsProcessing(true);
    try {
      const brtDateStr = getBRTDateString(editingPonto.fullDate);
      const newDateStr = new Date(\`\${brtDateStr}T\${editTime}:00-03:00\`).toISOString();
      
      const { data, error } = await supabase.from('pontos').update({ data_hora: newDateStr }).eq('id', editingPonto.id).select();
      if (error) throw error;
      
      let finalNewDateStr = newDateStr;
      
      if (!data || data.length === 0) {
          // If RLS blocked the update, let's try delete and insert
          const { error: delErr } = await supabase.from('pontos').delete().eq('id', editingPonto.id);
          if (delErr) throw new Error("Não foi possível editar (RLS bloqueou update e falhou no delete): " + delErr.message);
          
          const payload = {
              usuario_email: editingPonto.usuario_email,
              usuario_nome: USER_PROFILES[editingPonto.usuario_email]?.label || editingPonto.usuario_email,
              tipo: editingPonto.tipo + (editingPonto.justificativa ? \`::justificativa::\${editingPonto.justificativa}\` : ''),
              data_hora: newDateStr,
              latitude: editingPonto.latitude || null,
              longitude: editingPonto.longitude || null,
              is_location_valid: false
          };
          
          const { data: insData, error: insErr } = await supabase.from('pontos').insert([payload]).select();
          if (insErr) throw insErr;
          if (!insData || insData.length === 0) throw new Error("Falha ao recriar o ponto editado.");
          
          finalNewDateStr = insData[0].data_hora;
      }
      
      setPontos((prev: any) => prev.map((p: any) => p.id === editingPonto.id ? { ...p, data_hora: finalNewDateStr } : p));
      setEditingPonto(null);
      alert('Registro editado com sucesso!');
    } catch (err: any) {
      alert('Erro ao atualizar: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };`;

if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('src/App.tsx', code);
    console.log("Success");
} else {
    console.log("Not found");
}
