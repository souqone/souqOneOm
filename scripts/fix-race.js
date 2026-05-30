const fs = require('fs');
let c = fs.readFileSync('e2e-edge-cases.js', 'utf8');

c = c.replace(
  /await shipperPage\.click\('button:has-text\("التالي"\)'\);\s*\/\/\s*سنترك المحافظة فارغة/g,
  `await shipperPage.click('button:has-text("التالي")');\n  await shipperPage.waitForSelector('select[name="fromGovernorate"]');\n  // سنترك المحافظة فارغة`
);

fs.writeFileSync('e2e-edge-cases.js', c);
console.log('Fixed race condition in Scenario 4!');
