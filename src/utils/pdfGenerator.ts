export interface ReportCard {
  label: string;
  value: string | number;
  color?: [number, number, number];
}

export interface ReportTable {
  title?: string;
  head: string[][];
  body: any[][];
  didParseCell?: (data: any) => void;
}

export interface ReportUserPage {
  userName: string;
  cards?: ReportCard[];
  progressBar?: { label: string, percent: number };
  mainTable?: ReportTable;
}

export interface ExecutiveReportConfig {
  title: string;
  period: string;
  author?: string;
  cards?: ReportCard[];
  progressBar?: { label: string, percent: number };
  summary?: string;
  mainTable?: ReportTable;
  additionalTables?: ReportTable[];
  userPages?: ReportUserPage[];
  observations?: boolean;
  finalSummary?: string;
  filename?: string;
}

const bgColor: [number, number, number] = [15, 23, 42]; 
const primaryColor: [number, number, number] = [37, 99, 235]; 
const successColor: [number, number, number] = [34, 197, 94]; 
const warningColor: [number, number, number] = [245, 158, 11]; 
const dangerColor: [number, number, number] = [239, 68, 68]; 
const textColor: [number, number, number] = [255, 255, 255]; 
const lightText: [number, number, number] = [148, 163, 184]; 

export const generateExecutiveReport = async (config: ExecutiveReportConfig) => {
  try {
    const [jspdf, autoTableModule] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable')
    ]);
    const jsPDF = jspdf.default;
    const autoTable = autoTableModule.default;

    const doc = new jsPDF();
  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR');
  const timeStr = now.toLocaleTimeString('pt-BR');
  
  const addExecutivePage = () => {
    doc.addPage();
    doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
    doc.rect(0, 0, 210, 297, 'F');
    const pageCount = (doc as any).internal.getNumberOfPages();
    doc.setFontSize(8);
    doc.setTextColor(lightText[0], lightText[1], lightText[2]);
    doc.text(`Emitido em: ${dateStr} às ${timeStr}`, 14, 290);
    doc.text(`Página ${pageCount}`, 196, 290, { align: 'right' });
  };

  doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
  doc.rect(0, 0, 210, 297, 'F');
  
  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('FREITAS HUB AGÊNCIA', 105, 40, { align: 'center' }); // Logo/Nome
  
  doc.setFontSize(32);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text(config.title, 105, 60, { align: 'center' });

  doc.setFontSize(14);
  doc.setTextColor(lightText[0], lightText[1], lightText[2]);
  doc.setFont('helvetica', 'normal');
  if (config.author) {
    doc.text(`Responsável: ${config.author}`, 105, 80, { align: 'center' });
  }
  doc.text(`Período: ${config.period}`, 105, 90, { align: 'center' });
  doc.text(`Data de Emissão: ${dateStr}`, 105, 100, { align: 'center' });

  // Footer on first page
  doc.setFontSize(8);
  doc.text(`Emitido em: ${dateStr} às ${timeStr}`, 14, 290);
  doc.text(`Página 1`, 196, 290, { align: 'right' });

  addExecutivePage();
  let currentY = 20;
  let sectionIndex = 1;
  
  const checkPageBreak = (neededHeight: number) => {
    if (currentY + neededHeight > 270) {
      addExecutivePage();
      currentY = 20;
    }
  };

  // Cards
  if (config.cards && config.cards.length > 0) {
    checkPageBreak(50);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text(`${sectionIndex}. Resumo`, 14, currentY);
    sectionIndex++;
    currentY += 15;

    let cardX = 14;
    let cardY = currentY;
    config.cards.forEach((card, index) => {
        if (index > 0 && index % 3 === 0) {
            cardX = 14;
            cardY += 25;
            checkPageBreak(30);
            if (currentY === 20) { cardY = currentY; } // Reset cardY if page break happened
        }
        doc.setFillColor(30, 41, 59);
        doc.roundedRect(cardX, cardY, 55, 20, 2, 2, 'F');
        doc.setFontSize(8);
        doc.setTextColor(lightText[0], lightText[1], lightText[2]);
        doc.setFont('helvetica', 'normal');
        doc.text(card.label, cardX + 5, cardY + 7);
        doc.setFontSize(12);
        
        const cardColor = card.color || primaryColor;
        doc.setTextColor(cardColor[0], cardColor[1], cardColor[2]);
        doc.setFont('helvetica', 'bold');
        doc.text(String(card.value), cardX + 5, cardY + 16);
        cardX += 60;
    });
    currentY = cardY + 35;
  }

  // Progress Bar
  if (config.progressBar) {
    checkPageBreak(30);
    doc.setFontSize(10);
    doc.setTextColor(lightText[0], lightText[1], lightText[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(`${config.progressBar.label} - ${config.progressBar.percent}%`, 14, currentY);
    
    currentY += 5;
    
    // Background bar
    doc.setFillColor(30, 41, 59);
    doc.roundedRect(14, currentY, 182, 6, 3, 3, 'F');
    
    // Foreground bar
    const barWidth = (182 * config.progressBar.percent) / 100;
    if (barWidth > 0) {
      doc.setFillColor(successColor[0], successColor[1], successColor[2]);
      doc.roundedRect(14, currentY, barWidth, 6, 3, 3, 'F');
    }
    
    currentY += 20;
  }

  // Resumo Executivo
  if (config.summary) {
    checkPageBreak(40);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text(`${sectionIndex}. Resumo Executivo`, 14, currentY);
    sectionIndex++;
    currentY += 10;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(lightText[0], lightText[1], lightText[2]);
    const splitText = doc.splitTextToSize(config.summary, 180);
    doc.text(splitText, 14, currentY);
    currentY += (splitText.length * 6) + 10;
  }

  // Tabela Principal
  if (config.mainTable) {
    checkPageBreak(40);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text(`${sectionIndex}. ${config.mainTable.title || 'Dados Principais'}`, 14, currentY);
    sectionIndex++;
    currentY += 10;

    autoTable(doc, {
        startY: currentY,
        head: config.mainTable.head,
        body: config.mainTable.body,
        theme: 'grid',
        headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 8, fillColor: [30, 41, 59], textColor: [255, 255, 255], lineColor: [51, 65, 85] },
        alternateRowStyles: { fillColor: [15, 23, 42] },
        didParseCell: config.mainTable.didParseCell
    });
    currentY = (doc as any).lastAutoTable.finalY + 15;
  }

  // Additional Tables
  if (config.additionalTables && config.additionalTables.length > 0) {
    config.additionalTables.forEach(table => {
      checkPageBreak(40);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.text(`${sectionIndex}. ${table.title || 'Tabela'}`, 14, currentY);
      sectionIndex++;
      currentY += 10;

      autoTable(doc, {
          startY: currentY,
          head: table.head,
          body: table.body,
          theme: 'grid',
          headStyles: { fillColor: primaryColor },
          styles: { fontSize: 9, fillColor: [30, 41, 59], textColor: [255, 255, 255], lineColor: [51, 65, 85] },
          alternateRowStyles: { fillColor: [15, 23, 42] },
          didParseCell: table.didParseCell
      });
      currentY = (doc as any).lastAutoTable.finalY + 15;
    });
  }

  // Observações
  if (config.observations) {
    checkPageBreak(60);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text(`${sectionIndex}. Observações`, 14, currentY);
    sectionIndex++;
    currentY += 10;
    
    doc.setFillColor(30, 41, 59);
    doc.rect(14, currentY, 182, 30, 'F');
    doc.setDrawColor(51, 65, 85);
    doc.rect(14, currentY, 182, 30, 'S');
    currentY += 45;
  }

  // Resumo Final
  if (config.finalSummary) {
    checkPageBreak(40);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text(`${sectionIndex}. Resumo Final`, 14, currentY);
    sectionIndex++;
    currentY += 10;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(lightText[0], lightText[1], lightText[2]);
    const splitSummaryText = doc.splitTextToSize(config.finalSummary, 180);
    doc.text(splitSummaryText, 14, currentY);
  }

  if (config.userPages && config.userPages.length > 0) {
    config.userPages.forEach((userPage) => {
      addExecutivePage();
      currentY = 20;
      sectionIndex = 1;

      // Header para a página do usuário
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(`Relatório Individual: ${userPage.userName}`, 105, currentY, { align: 'center' });
      currentY += 20;

      // Cards do Usuário
      if (userPage.cards && userPage.cards.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.text(`Resumo - ${userPage.userName}`, 14, currentY);
        currentY += 15;

        let cardX = 14;
        let cardY = currentY;
        userPage.cards.forEach((card, index) => {
            if (index > 0 && index % 3 === 0) {
                cardX = 14;
                cardY += 25;
                checkPageBreak(30);
                if (currentY === 20) { cardY = currentY; }
            }
            doc.setFillColor(30, 41, 59);
            doc.roundedRect(cardX, cardY, 55, 20, 2, 2, 'F');
            doc.setFontSize(8);
            doc.setTextColor(lightText[0], lightText[1], lightText[2]);
            doc.setFont('helvetica', 'normal');
            doc.text(card.label, cardX + 5, cardY + 7);
            doc.setFontSize(12);
            
            const cardColor = card.color || primaryColor;
            doc.setTextColor(cardColor[0], cardColor[1], cardColor[2]);
            doc.setFont('helvetica', 'bold');
            doc.text(String(card.value), cardX + 5, cardY + 16);
            cardX += 60;
        });
        currentY = cardY + 35;
      }

      // Progress Bar do Usuário
      if (userPage.progressBar) {
        checkPageBreak(30);
        doc.setFontSize(10);
        doc.setTextColor(lightText[0], lightText[1], lightText[2]);
        doc.setFont('helvetica', 'bold');
        doc.text(`${userPage.progressBar.label} - ${userPage.progressBar.percent}%`, 14, currentY);
        
        currentY += 5;
        
        doc.setFillColor(30, 41, 59);
        doc.roundedRect(14, currentY, 182, 6, 3, 3, 'F');
        
        const barWidth = (182 * userPage.progressBar.percent) / 100;
        if (barWidth > 0) {
          doc.setFillColor(successColor[0], successColor[1], successColor[2]);
          doc.roundedRect(14, currentY, barWidth, 6, 3, 3, 'F');
        }
        
        currentY += 20;
      }

      // Tabela Principal do Usuário
      if (userPage.mainTable) {
        checkPageBreak(40);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.text(`${userPage.mainTable.title || 'Tarefas'} - ${userPage.userName}`, 14, currentY);
        currentY += 10;

        autoTable(doc, {
            startY: currentY,
            head: userPage.mainTable.head,
            body: userPage.mainTable.body,
            theme: 'grid',
            headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold' },
            styles: { fontSize: 8, fillColor: [30, 41, 59], textColor: [255, 255, 255], lineColor: [51, 65, 85] },
            alternateRowStyles: { fillColor: [15, 23, 42] },
            didParseCell: userPage.mainTable.didParseCell
        });
        currentY = (doc as any).lastAutoTable.finalY + 15;
      }
    });
  }

  const defaultFilename = `relatorio_${dateStr.replace(/\//g, '-')}.pdf`;
  doc.save(config.filename || defaultFilename);
  } catch (err: any) {
    if(err?.message?.includes("Failed to fetch")) console.warn("Erro ao gerar PDF:", err); else console.error("Erro ao gerar PDF:", err);
    alert("Falha ao gerar o PDF. Verifique sua conexão de rede ou tente novamente.");
  }
};
