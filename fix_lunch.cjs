const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldLunch = `                      } else {
                          let d2 = getDiff(t2_raw, expSaidaAlmoco);
                          if (d2 > tolSaidaAlmocoDepois) addExtra(d2, 'Saída almoço além do horário');
                          if (d2 < -tolSaidaAlmocoAntes) addDelay(Math.abs(d2), 'Saída almoço antecipada');

                          let d3 = getDiff(t3_raw, expRetornoAlmoco);
                          if (d3 < -tolRetornoAlmocoAntes) addExtra(Math.abs(d3), 'Retorno almoço antecipado');
                          if (d3 > tolRetornoAlmocoDepois) addDelay(d3, 'Retorno almoço em atraso');
                      }`;

const newLunch = `                      } else {
                          const actualLunchDuration = getDiff(t3_raw, t2_raw);
                          if (actualLunchDuration < lunchDuration) {
                              addExtra(lunchDuration - actualLunchDuration, 'Intervalo de almoço reduzido');
                          } else if (actualLunchDuration > lunchDuration) {
                              addDelay(actualLunchDuration - lunchDuration, 'Intervalo de almoço excedido');
                          }
                      }`;

if(code.includes(oldLunch)) {
    code = code.replace(oldLunch, newLunch);
    fs.writeFileSync('src/App.tsx', code);
    console.log("Success");
} else {
    console.log("Not found");
}
