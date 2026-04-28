const fs = require('fs');
let code = fs.readFileSync('components/SmartNotifications.tsx', 'utf-8');

code = code.replace(
  /id:\s*\`\$\{id\}_\$\{todayStr\}\`,/g,
  "id: `${id}_${todayStr}_${Math.random().toString(36).substr(2,9)}`,"
);

fs.writeFileSync('components/SmartNotifications.tsx', code);
