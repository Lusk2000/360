const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
    "const lunchDuration = timeDiff(expSaidaAlmoco, expRetornoAlmoco);",
    "const lunchDuration = uConfig.duracao_almoco ? Number(uConfig.duracao_almoco) : timeDiff(expSaidaAlmoco, expRetornoAlmoco);"
);

fs.writeFileSync('src/App.tsx', code);
console.log("Success");
