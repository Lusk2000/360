const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  "    const channels = collections.map(name => {",
  "    // Refresh tasks periodically to handle daily recurrences naturally (e.g. at midnight)\n    const dailyRefreshInterval = setInterval(() => {\n      fetchCollections('tasks');\n    }, 60000 * 30); // 30 minutes\n\n    const channels = collections.map(name => {"
);

content = content.replace(
  "    return () => {\n      channels.forEach(channel => supabase.removeChannel(channel));\n    };",
  "    return () => {\n      clearInterval(dailyRefreshInterval);\n      channels.forEach(channel => supabase.removeChannel(channel));\n    };"
);

fs.writeFileSync('src/App.tsx', content);
