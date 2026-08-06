const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target1 = `  const saveSettings = async () => {`;
const replacement1 = `  const removeDuplicatePontos = async () => {
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.from('pontos').select('*');
      if (error) throw error;
      
      const toDelete = [];
      const seen = new Set();
      
      const sorted = data.sort((a: any, b: any) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime());
      
      for (const p of sorted) {
          if (p.tipo === 'CONFIG') continue;
          
          let dateObj = getBRTDate(p.data_hora);
          const parts = (p.tipo || '').split('::justificativa::');
          const baseTipo = parts[0];
          
          if (baseTipo !== 'Entrada' && dateObj.getHours() < 7) {
              dateObj = new Date(dateObj.getTime() - 24 * 60 * 60 * 1000);
          }
          const dateStr = getBRTDateString(dateObj);
          
          const key = \`\${p.usuario_email}-\${dateStr}-\${baseTipo}\`;
          if (seen.has(key)) {
              toDelete.push(p.id);
          } else {
              seen.add(key);
          }
      }
      
      if (toDelete.length === 0) {
          alert('Nenhuma duplicata encontrada no sistema.');
          setIsProcessing(false);
          return;
      }
      
      const confirm = window.confirm(\`Foram encontradas \${toDelete.length} duplicatas. Deseja excluí-las permanentemente?\`);
      if (!confirm) {
          setIsProcessing(false);
          return;
      }
      
      for (let i = 0; i < toDelete.length; i += 50) {
          const chunk = toDelete.slice(i, i + 50);
          await supabase.from('pontos').delete().in('id', chunk);
      }
      
      setPontos((prev: any) => prev.filter((p: any) => !toDelete.includes(p.id)));
      alert('Duplicatas excluídas com sucesso!');
    } catch (err: any) {
      alert('Erro ao remover duplicatas: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const saveSettings = async () => {`;

const target2 = `            <div className="p-6 border-t border-slate-800 flex-shrink-0 bg-slate-900">
              <Button onClick={saveSettings} disabled={isProcessing} className="bg-emerald-600 hover:bg-emerald-500 text-white w-full font-bold tracking-widest text-xs py-4">
                {isProcessing ? '...' : 'SALVAR CONFIGURAÇÕES'}
              </Button>
            </div>`;
const replacement2 = `            <div className="p-6 border-t border-slate-800 flex-shrink-0 bg-slate-900 flex gap-2">
              <Button onClick={saveSettings} disabled={isProcessing} className="bg-emerald-600 hover:bg-emerald-500 text-white flex-1 font-bold tracking-widest text-xs py-4">
                {isProcessing ? '...' : 'SALVAR CONFIGURAÇÕES'}
              </Button>
              <Button onClick={removeDuplicatePontos} disabled={isProcessing} className="bg-red-600 hover:bg-red-500 text-white flex-1 font-bold tracking-widest text-xs py-4">
                REMOVER DUPLICADAS
              </Button>
            </div>`;

if (code.includes(target1) && code.includes(target2)) {
    code = code.replace(target1, replacement1);
    code = code.replace(target2, replacement2);
    fs.writeFileSync('src/App.tsx', code);
    console.log("Success");
} else {
    console.log("Not found 1:", code.includes(target1), "Not found 2:", code.includes(target2));
}
