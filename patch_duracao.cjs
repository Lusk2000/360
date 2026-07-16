const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  "    tolerancia_saida_depois: 15,\n  });",
  "    tolerancia_saida_depois: 15,\n    duracao_almoco: 60,\n  });"
);

content = content.replace(
  "} else if (tipo === 'Retorno Almoço') {\n      expectedTime = configPonto.hora_fim_almoco || '13:00';\n      tolAntes = configPonto.tolerancia_fim_almoco_antes ?? 15;\n      tolDepois = configPonto.tolerancia_fim_almoco_depois ?? 15;",
  "} else if (tipo === 'Retorno Almoço') {\n      expectedTime = configPonto.hora_fim_almoco || '13:00';\n      if (configPonto.duracao_almoco) {\n        const todayStr = new Date(time.getTime() - (time.getTimezoneOffset() * 60000)).toISOString().split('T')[0];\n        const saidaAlmoco = pontos.find((p: any) => p.usuario_email === currentUserProfile && p.tipo === 'Saída Almoço' && new Date(p.data_hora).toISOString().startsWith(todayStr));\n        if (saidaAlmoco) {\n          const saidaTime = new Date(saidaAlmoco.data_hora);\n          const expectedReturnMinutes = saidaTime.getHours() * 60 + saidaTime.getMinutes() + Number(configPonto.duracao_almoco);\n          const expectedH = Math.floor(expectedReturnMinutes / 60).toString().padStart(2, '0');\n          const expectedM = (expectedReturnMinutes % 60).toString().padStart(2, '0');\n          expectedTime = `${expectedH}:${expectedM}`;\n        }\n      }\n      tolAntes = configPonto.tolerancia_fim_almoco_antes ?? 15;\n      tolDepois = configPonto.tolerancia_fim_almoco_depois ?? 15;"
);

content = content.replace(
  "{/* FIM ALMOÇO */}",
  "{/* DURACAO ALMOCO */}\n              <div className=\"bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 mb-4\">\n                <h5 className=\"text-sm font-bold text-amber-400 uppercase tracking-widest mb-4\">Tempo de Almoço (Opcional)</h5>\n                <div className=\"grid grid-cols-1 gap-4\">\n                  <div>\n                    <label className=\"text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1 block\">Duração (minutos)</label>\n                    <input type=\"number\" min=\"0\" value={settingsFormData.duracao_almoco ?? ''} onChange={(e) => setSettingsFormData({...settingsFormData, duracao_almoco: Number(e.target.value) || 0})} className=\"w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono focus:border-emerald-500 outline-none text-sm text-center\" />\n                  </div>\n                </div>\n              </div>\n              {/* FIM ALMOÇO */}"
);

fs.writeFileSync('src/App.tsx', content);
