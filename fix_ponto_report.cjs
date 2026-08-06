const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Add state in App component
const appStateSearch = `  const [isReportModalOpen, setIsReportModalOpen] = useState(false);`;
const appStateReplace = `  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [pontoReportRequest, setPontoReportRequest] = useState<any>(null);`;
code = code.replace(appStateSearch, appStateReplace);

// Fix executeReport to set the state
const execReportSearch = `    if (type === 'ponto') {
      exportarFolhaPontoPDF(start, end, userFilter);
      return;
    }`;
const execReportReplace = `    if (type === 'ponto') {
      setPontoReportRequest({ start, end, userFilter, ts: Date.now() });
      return;
    }`;
code = code.replace(execReportSearch, execReportReplace);

// Fix PontoView props to accept it
const pontoViewPropsSearch = `const PontoView = ({ currentUserProfile, pontos, setPontos, isSystemAdmin, USER_PROFILES, supabase, permissions, setReportType, setReportDateStart, setReportDateEnd, setIsReportModalOpen }: any) => {`;
const pontoViewPropsReplace = `const PontoView = ({ currentUserProfile, pontos, setPontos, isSystemAdmin, USER_PROFILES, supabase, permissions, setReportType, setReportDateStart, setReportDateEnd, setIsReportModalOpen, pontoReportRequest }: any) => {`;
code = code.replace(pontoViewPropsSearch, pontoViewPropsReplace);

// Add useEffect in PontoView to listen for it
const pontoViewEffectSearch = `    const exportarFolhaPontoPDF = async (start?: string, end?: string, userFilter: string = 'all') => {`;
const pontoViewEffectReplace = `    React.useEffect(() => {
        if (pontoReportRequest) {
            exportarFolhaPontoPDF(pontoReportRequest.start, pontoReportRequest.end, pontoReportRequest.userFilter);
        }
    }, [pontoReportRequest]);

    const exportarFolhaPontoPDF = async (start?: string, end?: string, userFilter: string = 'all') => {`;
code = code.replace(pontoViewEffectSearch, pontoViewEffectReplace);

// Fix PontoView render to pass it
const pontoViewRenderSearch = `                  USER_PROFILES={USER_PROFILES} supabase={supabase} permissions={permissions} setReportType={setReportType} setReportDateStart={setReportDateStart} setReportDateEnd={setReportDateEnd} setIsReportModalOpen={setIsReportModalOpen} />`;
const pontoViewRenderReplace = `                  USER_PROFILES={USER_PROFILES} supabase={supabase} permissions={permissions} setReportType={setReportType} setReportDateStart={setReportDateStart} setReportDateEnd={setReportDateEnd} setIsReportModalOpen={setIsReportModalOpen} pontoReportRequest={pontoReportRequest} />`;
code = code.replace(pontoViewRenderSearch, pontoViewRenderReplace);

fs.writeFileSync('src/App.tsx', code);
console.log("Success");
