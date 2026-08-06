const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Update exportarFolhaPontoPDF signature and add filter
const oldExportStart = `    const exportarFolhaPontoPDF = async () => {
    try {`;
const newExportStart = `    const exportarFolhaPontoPDF = async (start?: string, end?: string, userFilter: string = 'all') => {
    try {`;
code = code.replace(oldExportStart, newExportStart);

const oldFilter = `      Object.entries(groupedPontos).forEach(([userName, dates]) => {
        const sortedDays = Object.values(dates).sort((a: any, b: any) => a.dateObj.getTime() - b.dateObj.getTime());
        
        // Group days by cycle (10th to 9th)`;

const newFilter = `      Object.entries(groupedPontos).forEach(([userName, dates]) => {
        const sortedDays = Object.values(dates).sort((a: any, b: any) => a.dateObj.getTime() - b.dateObj.getTime()).filter((day: any) => {
            const dStr = getBRTDateString(day.dateObj);
            if (start && dStr < start) return false;
            if (end && dStr > end) return false;
            return true;
        });
        if (sortedDays.length === 0) return;
        
        const userEmail = sortedDays.length > 0 ? (sortedDays[0]['Entrada']?.usuario_email || sortedDays[0]['Saída']?.usuario_email || userName) : userName;
        if (userFilter !== 'all' && userEmail !== userFilter) return;

        // Group days by cycle (10th to 9th)`;
code = code.replace(oldFilter, newFilter);

// 2. Add ponto to executeReport
const executeReportSearch = `    if (type === 'agenda') {`;
const executeReportReplace = `    if (type === 'ponto') {
      exportarFolhaPontoPDF(start, end, userFilter);
      return;
    } else if (type === 'agenda') {`;
code = code.replace(executeReportSearch, executeReportReplace);

// 3. Update the button in the UI
const btnSearch = `<Button onClick={exportarFolhaPontoPDF} variant="secondary" className="py-4 px-8 text-sm font-black tracking-widest bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20">`;
const btnReplace = `<Button onClick={() => { setReportType('ponto'); setIsReportModalOpen(true); }} variant="secondary" className="py-4 px-8 text-sm font-black tracking-widest bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20">`;
code = code.replace(btnSearch, btnReplace);

// 4. Update the modal condition
const modalConditionSearch = `(reportType === 'tasks' || reportType === 'productivity') && USER_PROFILES[currentUserProfile]?.role === 'administrator'`;
const modalConditionReplace = `(reportType === 'tasks' || reportType === 'productivity' || reportType === 'ponto') && USER_PROFILES[currentUserProfile]?.role === 'administrator'`;
code = code.replace(modalConditionSearch, modalConditionReplace);

fs.writeFileSync('src/App.tsx', code);
console.log("Success");
