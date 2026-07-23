#!/bin/bash
awk '
BEGIN { in_func = 0; }
/const isOutsideTolerance = \(tipo: string, time: Date\) => \{/ {
    in_func = 1;
    print "  const isOutsideTolerance = (tipo: string, time: Date) => {";
    print "    const currentMinutes = time.getHours() * 60 + time.getMinutes();";
    print "    let expectedTime = \x27\x27;";
    print "    let tolAntes = 0;";
    print "    let tolDepois = 0;";
    print "    if (tipo === \x27Entrada\x27) {";
    print "      expectedTime = configPonto.hora_entrada || \x2708:00\x27;";
    print "      tolAntes = configPonto.tolerancia_entrada_antes ?? 15;";
    print "      tolDepois = configPonto.tolerancia_entrada_depois ?? 15;";
    print "    } else if (tipo === \x27Saída Almoço\x27) {";
    print "      expectedTime = configPonto.hora_inicio_almoco || \x2712:00\x27;";
    print "      tolAntes = configPonto.tolerancia_inicio_almoco_antes ?? 15;";
    print "      tolDepois = configPonto.tolerancia_inicio_almoco_depois ?? 15;";
    print "    } else if (tipo === \x27Retorno Almoço\x27) {";
    print "      expectedTime = configPonto.hora_fim_almoco || \x2713:00\x27;";
    print "      if (configPonto.duracao_almoco) {";
    print "        const todayStr = new Date(time.getTime() - (time.getTimezoneOffset() * 60000)).toISOString().split(\x27T\x27)[0];";
    print "        const saidaAlmoco = pontos.find((p: any) => p.usuario_email === currentUserProfile && p.tipo === \x27Saída Almoço\x27 && new Date(p.data_hora).toISOString().startsWith(todayStr));";
    print "        if (saidaAlmoco) {";
    print "          const saidaTime = new Date(saidaAlmoco.data_hora);";
    print "          const expectedReturnMinutes = saidaTime.getHours() * 60 + saidaTime.getMinutes() + Number(configPonto.duracao_almoco);";
    print "          const expectedH = Math.floor(expectedReturnMinutes / 60).toString().padStart(2, \x270\x27);";
    print "          const expectedM = (expectedReturnMinutes % 60).toString().padStart(2, \x270\x27);";
    print "          expectedTime = `${expectedH}:${expectedM}`;";
    print "        }";
    print "      }";
    print "      tolAntes = configPonto.tolerancia_fim_almoco_antes ?? 15;";
    print "      tolDepois = configPonto.tolerancia_fim_almoco_depois ?? 15;";
    print "    } else if (tipo === \x27Saída\x27) {";
    print "      expectedTime = configPonto.hora_saida || \x2718:00\x27;";
    print "      tolAntes = configPonto.tolerancia_saida_antes ?? 15;";
    print "      tolDepois = configPonto.tolerancia_saida_depois ?? 15;";
    print "    }";
    print "    if (!expectedTime) return false;";
    print "    const [eh, em] = expectedTime.split(\x27:\x27).map(Number);";
    print "    const expectedMinutes = eh * 60 + em;";
    print "    return currentMinutes < (expectedMinutes - tolAntes) || currentMinutes > (expectedMinutes + tolDepois);";
    print "  };";
    next;
}
in_func == 1 && /const initiatePonto =/ {
    in_func = 0;
    print $0;
    next;
}
in_func == 0 {
    print $0;
}
' src/App.tsx > temp.tsx && mv temp.tsx src/App.tsx
