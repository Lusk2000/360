const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `                      } else {
                          addDelay(expectedTotal, 'Falta o dia todo ou marcações inconsistentes');
                      }`;

const replacement = `                      } else {
                          const countPunches = [t1_raw, t2_raw, t3_raw, t4_raw].filter(t => t !== null).length;
                          if (countPunches <= 1) {
                              addDelay(expectedTotal, 'Falta o dia todo');
                          } else {
                              if (t1_raw !== null) {
                                  let d1 = getDiff(t1_raw, expEntrada);
                                  if (d1 < -tolEntAntes) addExtra(Math.abs(d1), 'Entrada antecipada');
                                  if (d1 > tolEntDepois) addDelay(d1, 'Entrada em atraso');
                              } else {
                                  addDelay(expectedMorning / 2, 'Falta registro de entrada');
                              }
                              
                              if (t2_raw !== null) {
                                  let d2 = getDiff(t2_raw, expSaidaAlmoco);
                                  if (d2 > tolSaidaAlmocoDepois) addExtra(d2, 'Saída almoço além do horário');
                                  if (d2 < -tolSaidaAlmocoAntes) addDelay(Math.abs(d2), 'Saída almoço antecipada');
                              } else if (t1_raw !== null) {
                                  addDelay(expectedMorning / 2, 'Falta registro de saída pro almoço');
                              }
                              
                              if (t3_raw !== null) {
                                  let d3 = getDiff(t3_raw, expRetornoAlmoco);
                                  if (d3 < -tolRetornoAlmocoAntes) addExtra(Math.abs(d3), 'Retorno almoço antecipado');
                                  if (d3 > tolRetornoAlmocoDepois) addDelay(d3, 'Retorno almoço em atraso');
                              } else if (t4_raw !== null) {
                                  addDelay(expectedAfternoon / 2, 'Falta registro de retorno do almoço');
                              }
                              
                              if (t4_raw !== null) {
                                  let d4 = getDiff(t4_raw, expSaida);
                                  if (d4 > tolSaidaDepois) addExtra(d4, 'Saída além do horário');
                                  if (d4 < -tolSaidaAntes) addDelay(Math.abs(d4), 'Saída antecipada');
                              } else {
                                  addDelay(expectedAfternoon / 2, 'Falta registro de saída');
                              }
                          }
                      }`;

if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('src/App.tsx', code);
    console.log("Success");
} else {
    console.log("Not found");
}
