const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
    "const actualLunchDuration = getDiff(t3_raw, t2_raw);",
    "const actualLunchDuration = timeDiff(t2_raw, t3_raw);"
);

fs.writeFileSync('src/App.tsx', code);
console.log("Success");
