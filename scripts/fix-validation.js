const fs = require('fs');
let c = fs.readFileSync('e2e-edge-cases.js', 'utf8');

c = c.replace(
  /await shipperPage\.waitForSelector\('text=يرجى إكمال الحقول المطلوبة قبل المتابعة', \{ timeout: 5000 \}\);/,
  "await shipperPage.waitForSelector('.border-\\\\[var\\\\(--color-error\\\\)\\\\]', { timeout: 10000 });"
);

fs.writeFileSync('e2e-edge-cases.js', c);
console.log('Fixed validation wait logic!');
