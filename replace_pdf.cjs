const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const replacement = `  const exportarFolhaPontoPDF = async () => {
    try {
      const [jspdf, autoTableModule] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable')
      ]);
      const jsPDF = jspdf.default;
      const autoTable = autoTableModule.default;
      const doc = new jsPDF({ orientation: 'landscape' });
      
      const now = new Date();
      const dateStr = now.toLocaleDateString('pt-BR');
      let isFirstPage = true;

      Object.entries(groupedPontos).forEach(([userName, dates]) => {
        const sortedDays = Object.values(dates).sort((a: any, b: any) => a.dateObj.getTime() - b.dateObj.getTime());
        
        // Group days by cycle (10th to 9th)
        const cycles: Record<string, any[]> = {};
        sortedDays.forEach((day: any) => {
            const d = day.dateObj;
            let cycleYear = d.getFullYear();
            let cycleMonth = d.getMonth();
            if (d.getDate() >= 10) {
                cycleMonth += 1; // Ends next month
                if (cycleMonth > 11) {
                    cycleMonth = 0;
                    cycleYear++;
                }
            }
            const cycleKey = \`\${cycleYear}-\${cycleMonth.toString().padStart(2, '0')}\`;
            if (!cycles[cycleKey]) cycles[cycleKey] = [];
            cycles[cycleKey].push(day);
        });

        // Recuperar Configurações
        const userEmail = sortedDays.length > 0 ? (sortedDays[0]['Entrada']?.usuario_email || userName) : userName;
        const uConfig = baseConfigPonto.userConfigs?.[userEmail] || baseConfigPonto;
        const expectedMorning = (timeToMin(uConfig.hora_inicio_almoco) - timeToMin(uConfig.hora_entrada));
        const expectedAfternoon = (timeToMin(uConfig.hora_saida) - timeToMin(uConfig.hora_fim_almoco));
        const expectedTotal = (expectedMorning > 0 ? expectedMorning : 0) + (expectedAfternoon > 0 ? expectedAfternoon : 0);
        const expTotalTime = minToTime(expectedTotal);

        Object.keys(cycles).sort().forEach(cycleKey => {
            if (!isFirstPage) {
              doc.addPage();
            }
            isFirstPage = false;
            
            const cycleDays = cycles[cycleKey];
            
            let startDate = '-';
            let endDate = '-';
            if (cycleDays.length > 0) {
                startDate = cycleDays[0].dateStr;
                endDate = cycleDays[cycleDays.length - 1].dateStr;
            }
            
            // Determinar o mês/ano base do ciclo
            const [cYear, cMonth] = cycleKey.split('-');
            const monthNameObj = new Date(parseInt(cYear), parseInt(cMonth), 1);
            const monthName = monthNameObj.toLocaleDateString('pt-BR', { month: 'long' }).toUpperCase();
            const yearNum = cYear;

            // HEADER (Landscape: max width 297, center 148.5, rect width 269)
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(14);
            doc.setTextColor(31, 41, 55); // primary #1F2937
            doc.text('CONTROLE DE PONTO - DEPARTAMENTO PESSOAL', 148.5, 20, { align: 'center' });
            
            // Header Fields - Retângulo
            doc.setDrawColor(55, 65, 81); // border #374151
            doc.setLineWidth(0.3);
            doc.rect(14, 25, 269, 20);

            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.text('Empresa:', 16, 31);
            doc.setFont('helvetica', 'normal');
            doc.text('FREITAS HUB AGÊNCIA', 35, 31);

            doc.setFont('helvetica', 'bold');
            doc.text('Funcionário:', 16, 38);
            doc.setFont('helvetica', 'normal');
            doc.text(userName, 40, 38);
            
            doc.setFont('helvetica', 'bold');
            doc.text('Período:', 110, 31);
            doc.setFont('helvetica', 'normal');
            doc.text(\`10/\${(parseInt(cMonth) === 0 ? 12 : parseInt(cMonth)).toString().padStart(2, '0')}/\${parseInt(cMonth) === 0 ? parseInt(cYear) - 1 : cYear} a 09/\${(parseInt(cMonth) + 1).toString().padStart(2, '0')}/\${cYear}\`, 128, 31);
            
            doc.setFont('helvetica', 'bold');
            doc.text('Mês Ref:', 110, 38);
            doc.setFont('helvetica', 'normal');
            doc.text(\`\${monthName} / \${yearNum}\`, 128, 38);

            // Header Schedule Config
            doc.setFont('helvetica', 'bold');
            doc.text('Jornada:', 200, 31);
            doc.setFont('helvetica', 'normal');
            doc.text(\`\${uConfig.hora_entrada} às \${uConfig.hora_inicio_almoco} / \${uConfig.hora_fim_almoco} às \${uConfig.hora_saida} (\${expTotalTime}h/dia)\`, 218, 31);
            
            doc.setFont('helvetica', 'bold');
            doc.text('Tolerância:', 200, 38);
            doc.setFont('helvetica', 'normal');
            doc.text(\`\${uConfig.tolerancia_entrada_antes || 5} min\`, 222, 38);

            const tableRows: any[] = [];
            let totalWorked = 0;
            let totalExtra = 0;
            let totalDelay = 0;
            
            let totalWorkDays = 0;
            let totalSaturdays = 0;
            let totalSundays = 0;
            
            const allObservations: string[] = [];

            cycleDays.forEach((day: any) => {
              if (day.workedMin !== null) totalWorked += day.workedMin || 0;
              totalExtra += day.extraMin || 0;
              totalDelay += day.delayMin || 0;
              
              const dLower = day.dayOfWeek.toLowerCase();
              if (dLower.includes('sáb')) totalSaturdays++;
              else if (dLower.includes('dom')) totalSundays++;
              else totalWorkDays++;
              
              let dayObs = '';
              if (day.hasIncomplete) dayObs += 'Dia Incompleto. ';
              ['Entrada', 'Saída Almoço', 'Retorno Almoço', 'Saída'].forEach(tipo => {
                  if (day[tipo] && day[tipo].justificativa) {
                     dayObs += \`\${tipo}: \${day[tipo].justificativa} \`;
                  }
              });
              
              const observacoes = (day.extraDetails || []).concat(day.delayDetails || []).join(' | ');
              if (observacoes) {
                  dayObs += \` (\${observacoes})\`;
              }
              
              if (dayObs.trim()) {
                  allObservations.push(\`\${day.dateStr}: \${dayObs.trim()}\`);
              }

              tableRows.push([
                day.dateStr,
                day.dayOfWeek,
                day['Entrada'] ? day['Entrada'].time : '-',
                day['Saída Almoço'] ? day['Saída Almoço'].time : '-',
                day['Retorno Almoço'] ? day['Retorno Almoço'].time : '-',
                day['Saída'] ? day['Saída'].time : '-',
                expTotalTime,
                day.workedMin !== null ? minToTime(day.workedMin) : '-',
                day.extraMin > 0 ? minToTime(day.extraMin) : '-',
                day.delayMin > 0 ? minToTime(day.delayMin) : '-',
                '-'
              ]);
            });

            // expected total for month
            const totalExpectedMonth = (totalWorkDays * expectedTotal);

            autoTable(doc, {
                startY: 50,
                head: [["Data", "Dia", "Entrada", "Saída Almoço", "Retorno", "Saída", "Jornada Prevista", "Horas Trab", "Horas Ext", "Atrasos", "Banco"]],
                body: tableRows,
                theme: 'grid',
                headStyles: { fillColor: [31, 41, 55], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
                styles: { fontSize: 8, lineColor: [55, 65, 81], lineWidth: 0.1, cellPadding: 1.5, halign: 'center' },
                columnStyles: {
                    0: { cellWidth: 20 },
                    1: { cellWidth: 20 },
                    2: { cellWidth: 20 },
                    3: { cellWidth: 25 },
                    4: { cellWidth: 25 },
                    5: { cellWidth: 20 },
                    6: { cellWidth: 30 },
                    7: { cellWidth: 25, fontStyle: 'bold' },
                    8: { cellWidth: 25, textColor: [22, 163, 74] },
                    9: { cellWidth: 25, textColor: [220, 38, 38] },
                    10: { cellWidth: 20 }
                },
                didParseCell: function (data: any) {
                    if (data.section === 'body') {
                        const rowData = data.row.raw;
                        const dayStr = rowData[1].toLowerCase();
                        if (dayStr.includes('sáb') || dayStr.includes('dom')) {
                            data.cell.styles.fillColor = [243, 244, 246]; // weekend #F3F4F6
                        }
                    }
                }
            });

            let currentY = (doc as any).lastAutoTable.finalY + 5;
            
            // Resumo do Banco de Horas
            if (currentY > 170) {
               doc.addPage();
               currentY = 20;
            }

            doc.setDrawColor(55, 65, 81);
            doc.setLineWidth(0.3);
            doc.rect(14, currentY, 269, 20);
            
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.text('RESUMO MENSAL', 16, currentY + 6);
            
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            
            doc.text(\`Dias Trabalhados: \${totalWorkDays} | Sábados: \${totalSaturdays} | Domingos: \${totalSundays} | Feriados: 0\`, 16, currentY + 14);
            
            doc.setFont('helvetica', 'bold');
            doc.text(\`Horas Previstas: \${minToTime(totalExpectedMonth)}\`, 120, currentY + 7);
            doc.text(\`Horas Trabalhadas: \${minToTime(totalWorked)}\`, 120, currentY + 14);
            
            doc.text(\`Horas Extras: \${minToTime(totalExtra)}\`, 190, currentY + 7);
            doc.text(\`Horas Atraso: \${minToTime(totalDelay)}\`, 190, currentY + 14);
            
            doc.text('Saldo Banco de Horas: ---', 240, currentY + 14);

            currentY += 25;
            
            if (allObservations.length > 0) {
                if (currentY > 180) {
                   doc.addPage();
                   currentY = 20;
                }
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(9);
                doc.text('OBSERVAÇÕES (ATRASOS / ANTECIPAÇÕES / JUSTIFICATIVAS)', 14, currentY);
                currentY += 5;
                
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(8);
                allObservations.forEach(obs => {
                    const lines = doc.splitTextToSize(obs, 269);
                    if (currentY + (lines.length * 4) > 190) {
                        doc.addPage();
                        currentY = 20;
                    }
                    doc.text(lines, 14, currentY);
                    currentY += (lines.length * 4) + 1;
                });
            }

            // Signatures
            if (currentY > 180) {
               doc.addPage();
               currentY = 30;
            } else {
               currentY = Math.max(currentY + 15, 185);
            }
            
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            
            doc.line(30, currentY, 120, currentY);
            doc.line(177, currentY, 267, currentY);
            currentY += 5;
            doc.text('Assinatura do Funcionário', 75, currentY, { align: 'center' });
            doc.text('Assinatura do Gerente', 222, currentY, { align: 'center' });
            
            currentY += 10;
            doc.text(\`Data: ____/____/______\`, 75, currentY, { align: 'center' });
            doc.text(\`Data: ____/____/______\`, 222, currentY, { align: 'center' });
        });
      });
      
      if (isFirstPage) { 
          doc.setFontSize(14);
         doc.text('Nenhum registro encontrado no período.', 148.5, 50, { align: 'center' });
      }

      doc.save(\`folha_de_ponto_\${dateStr.replace(/\\//g, '-')}.pdf\`);
    } catch (err: any) {
      if(err?.message?.includes("Failed to fetch")) console.warn("Erro ao gerar PDF:", err); else console.error("Erro ao gerar PDF:", err);
      alert("Falha ao gerar o PDF. Verifique sua conexão de rede ou tente novamente.");
    }
  };`;

const startIndex = code.indexOf('const exportarFolhaPontoPDF = async () => {');
const endIndex = code.indexOf('  const renderCell = (pointData: any, typeColorClass: string) => {');

if (startIndex === -1 || endIndex === -1) {
  console.error("Could not find bounds");
  process.exit(1);
}

const newCode = code.slice(0, startIndex) + replacement + '\n' + code.slice(endIndex);
fs.writeFileSync('src/App.tsx', newCode);
console.log('App.tsx pdf updated successfully.');
