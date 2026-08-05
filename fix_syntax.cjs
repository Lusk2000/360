const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace('       });\n    });\n    });\n    return groups;', '       });\n    });\n    return groups;');

fs.writeFileSync('src/App.tsx', code);
