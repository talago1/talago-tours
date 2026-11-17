const fs = require('fs');
const f = 'src/locales/uk.ts';
let c = fs.readFileSync(f, 'utf8');
// Fix double comma
c = c.replace("    verified: 'Підтверджене бронювання',,\r\n", "    verified: 'Підтверджене бронювання',\r\n");
fs.writeFileSync(f, c);
console.log('Fixed double comma in uk.ts');
