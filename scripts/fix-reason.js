const fs = require('fs');
let c = fs.readFileSync('e2e-edge-cases.js', 'utf8');

c = c.replace(
  /await shipperPage\.click\('button:has-text\("تأكيد الإلغاء"\)'\);/,
  `await shipperPage.fill('textarea[placeholder="اكتب سبب الإلغاء..."]', 'تغيير في الخطط');\n  await shipperPage.click('button:has-text("تأكيد الإلغاء")');`
);

fs.writeFileSync('e2e-edge-cases.js', c);
console.log('Fixed cancel confirmation logic!');
