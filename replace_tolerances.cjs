const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const replacement = `       const tolEntAntes = uConfig.tolerancia_entrada_antes || 5;
       const tolEntDepois = uConfig.tolerancia_entrada_depois || 5;
       const tolSaidaAlmocoAntes = uConfig.tolerancia_inicio_almoco_antes || 5;
       const tolSaidaAlmocoDepois = uConfig.tolerancia_inicio_almoco_depois || 5;
       const tolRetornoAlmocoAntes = uConfig.tolerancia_fim_almoco_antes || 5;
       const tolRetornoAlmocoDepois = uConfig.tolerancia_fim_almoco_depois || 5;
       const tolSaidaAntes = uConfig.tolerancia_saida_antes || 5;
       const tolSaidaDepois = uConfig.tolerancia_saida_depois || 5;

       let expectedTotal = timeDiff(expEntrada, expSaidaAlmoco) + timeDiff(expRetornoAlmoco, expSaida);

       if (expSaidaAlmoco === null && expRetornoAlmoco === null) {
           expectedTotal = timeDiff(expEntrada, expSaida);
       }

       Object.keys(groups[user]).forEach(dateStr => {
          const day = groups[user][dateStr];
          const t1_raw = day['Entrada'] ? timeToMin(day['Entrada'].time) : null;
          const t2_raw = day['Saída Almoço'] ? timeToMin(day['Saída Almoço'].time) : null;
          const t3_raw = day['Retorno Almoço'] ? timeToMin(day['Retorno Almoço'].time) : null;
          const t4_raw = day['Saída'] ? timeToMin(day['Saída'].time) : null;
          
          let extra = 0;
          let delay = 0;
          let hasIncomplete = false;
          let extraDetails: string[] = [];
          let delayDetails: string[] = [];

          const addExtra = (min: number, reason: string) => { 
              extra += min; 
              extraDetails.push(\`+\${minToTime(min)}: \${reason}\`); 
          };
          const addDelay = (min: number, reason: string) => { 
              delay += min; 
              delayDetails.push(\`+\${minToTime(min)}: \${reason}\`); 
          };

          if (!t1_raw && !t2_raw && !t3_raw && !t4_raw) {
              day.workedMin = 0;
              day.extraMin = 0;
              day.delayMin = 0;
              day.extraDetails = [];
              day.delayDetails = [];
              return;
          }

          if (expSaidaAlmoco === null && expRetornoAlmoco === null) {
              if (t1_raw !== null && t4_raw !== null) {
                  let d1 = getDiff(t1_raw, expEntrada);
                  if (d1 < -tolEntAntes) addExtra(Math.abs(d1), 'Entrada antecipada');
                  if (d1 > tolEntDepois) addDelay(d1, 'Entrada em atraso');

                  let d4 = getDiff(t4_raw, expSaida);
                  if (d4 > tolSaidaDepois) addExtra(d4, 'Saída além do horário');
                  if (d4 < -tolSaidaAntes) addDelay(Math.abs(d4), 'Saída antecipada');
              } else {
                  hasIncomplete = true;
                  addDelay(expectedTotal, 'Dia incompleto sem almoço');
              }
          } else {
              const expectedMorning = timeDiff(expEntrada, expSaidaAlmoco);
              const expectedAfternoon = timeDiff(expRetornoAlmoco, expSaida);
              const lunchDuration = timeDiff(expSaidaAlmoco, expRetornoAlmoco);

              if (t1_raw !== null && t4_raw !== null && t2_raw === null && t3_raw === null) {
                  // Sem registro de saída e retorno do almoço: o período de almoço será considerado como tempo trabalhado (hora extra)
                  let d1 = getDiff(t1_raw, expEntrada);
                  if (d1 < -tolEntAntes) addExtra(Math.abs(d1), 'Entrada antecipada');
                  if (d1 > tolEntDepois) addDelay(d1, 'Entrada em atraso');

                  let d4 = getDiff(t4_raw, expSaida);
                  if (d4 > tolSaidaDepois) addExtra(d4, 'Saída além do horário');
                  if (d4 < -tolSaidaAntes) addDelay(Math.abs(d4), 'Saída antecipada');

                  addExtra(lunchDuration, 'Almoço não registrado');
              } else {
                  if (t1_raw !== null && t4_raw !== null) {
                      let d1 = getDiff(t1_raw, expEntrada);
                      if (d1 < -tolEntAntes) addExtra(Math.abs(d1), 'Entrada antecipada');
                      if (d1 > tolEntDepois) addDelay(d1, 'Entrada em atraso');

                      let d4 = getDiff(t4_raw, expSaida);
                      if (d4 > tolSaidaDepois) addExtra(d4, 'Saída além do horário');
                      if (d4 < -tolSaidaAntes) addDelay(Math.abs(d4), 'Saída antecipada');

                      if (t2_raw === null || t3_raw === null) {
                          // Almoço com apenas um registro: conta como atraso
                          if (t2_raw !== null) {
                              let d2 = getDiff(t2_raw, expSaidaAlmoco);
                              if (d2 > tolSaidaAlmocoDepois) addExtra(d2, 'Saída almoço além do horário');
                              if (d2 < -tolSaidaAlmocoAntes) addDelay(Math.abs(d2), 'Saída almoço antecipada');
                          }
                          if (t3_raw !== null) {
                              let d3 = getDiff(t3_raw, expRetornoAlmoco);
                              if (d3 < -tolRetornoAlmocoAntes) addExtra(Math.abs(d3), 'Retorno almoço antecipado');
                              if (d3 > tolRetornoAlmocoDepois) addDelay(d3, 'Retorno almoço em atraso');
                          }
                          addDelay(lunchDuration, 'Almoço incompleto');
                          hasIncomplete = true;
                      } else {
                          let d2 = getDiff(t2_raw, expSaidaAlmoco);
                          if (d2 > tolSaidaAlmocoDepois) addExtra(d2, 'Saída almoço além do horário');
                          if (d2 < -tolSaidaAlmocoAntes) addDelay(Math.abs(d2), 'Saída almoço antecipada');

                          let d3 = getDiff(t3_raw, expRetornoAlmoco);
                          if (d3 < -tolRetornoAlmocoAntes) addExtra(Math.abs(d3), 'Retorno almoço antecipado');
                          if (d3 > tolRetornoAlmocoDepois) addDelay(d3, 'Retorno almoço em atraso');
                      }
                  } else {
                      hasIncomplete = true;
                      if (t1_raw !== null && t2_raw !== null && t3_raw === null && t4_raw === null) {
                          let d1 = getDiff(t1_raw, expEntrada);
                          if (d1 < -tolEntAntes) addExtra(Math.abs(d1), 'Entrada antecipada');
                          if (d1 > tolEntDepois) addDelay(d1, 'Entrada em atraso');

                          let d2 = getDiff(t2_raw, expSaidaAlmoco);
                          if (d2 > tolSaidaAlmocoDepois) addExtra(d2, 'Saída almoço além do horário');
                          if (d2 < -tolSaidaAlmocoAntes) addDelay(Math.abs(d2), 'Saída almoço antecipada');
                          
                          addDelay(expectedAfternoon, 'Falta à tarde');
                      } else if (t1_raw === null && t2_raw === null && t3_raw !== null && t4_raw !== null) {
                          let d3 = getDiff(t3_raw, expRetornoAlmoco);
                          if (d3 < -tolRetornoAlmocoAntes) addExtra(Math.abs(d3), 'Retorno almoço antecipado');
                          if (d3 > tolRetornoAlmocoDepois) addDelay(d3, 'Retorno almoço em atraso');

                          let d4 = getDiff(t4_raw, expSaida);
                          if (d4 > tolSaidaDepois) addExtra(d4, 'Saída além do horário');
                          if (d4 < -tolSaidaAntes) addDelay(Math.abs(d4), 'Saída antecipada');

                          addDelay(expectedMorning, 'Falta de manhã');
                      } else {
                          addDelay(expectedTotal, 'Falta o dia todo ou marcações inconsistentes');
                      }
                  }
              }
          }

          let worked = expectedTotal - delay + extra;
          if (worked < 0) worked = 0;

          day.workedMin = worked;
          day.hasIncomplete = hasIncomplete;
          day.extraMin = extra;
          day.delayMin = delay;
          day.extraDetails = extraDetails;
          day.delayDetails = delayDetails;
       });`;

const startIndex = code.indexOf('let expectedTotal = timeDiff(expEntrada, expSaidaAlmoco) + timeDiff(expRetornoAlmoco, expSaida);');
const endIndex = code.indexOf('});\n    });\n    return groups;');

if (startIndex === -1 || endIndex === -1) {
  console.error("Could not find bounds");
  process.exit(1);
}

const newCode = code.slice(0, startIndex) + replacement + '\n    ' + code.slice(endIndex);
fs.writeFileSync('src/App.tsx', newCode);
console.log('App.tsx tolerances updated successfully.');
