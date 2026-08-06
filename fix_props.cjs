const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target1 = `const PontoView = ({ currentUserProfile, pontos, setPontos, isSystemAdmin, USER_PROFILES, supabase, permissions }: any) => {`;
const replacement1 = `const PontoView = ({ currentUserProfile, pontos, setPontos, isSystemAdmin, USER_PROFILES, supabase, permissions, setReportType, setReportDateStart, setReportDateEnd, setIsReportModalOpen }: any) => {`;

const target2 = `<PontoView currentUserProfile={currentUserProfile} pontos={pontos} setPontos={setPontos} isSystemAdmin={isSystemAdmin}
                  USER_PROFILES={USER_PROFILES} supabase={supabase} permissions={permissions} />`;
const replacement2 = `<PontoView currentUserProfile={currentUserProfile} pontos={pontos} setPontos={setPontos} isSystemAdmin={isSystemAdmin}
                  USER_PROFILES={USER_PROFILES} supabase={supabase} permissions={permissions} setReportType={setReportType} setReportDateStart={setReportDateStart} setReportDateEnd={setReportDateEnd} setIsReportModalOpen={setIsReportModalOpen} />`;

if (code.includes(target1) && code.includes(target2)) {
    code = code.replace(target1, replacement1);
    code = code.replace(target2, replacement2);
    fs.writeFileSync('src/App.tsx', code);
    console.log("Success");
} else {
    console.log("Not found target1:", code.includes(target1), "target2:", code.includes(target2));
}
