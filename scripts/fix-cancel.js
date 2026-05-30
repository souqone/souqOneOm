const fs = require('fs');
let c = fs.readFileSync('e2e-edge-cases.js','utf8');
c = c.replace(
  /console\.log\('✅ تم نشر الطلب\. الرابط:', requestUrl\);\s*\/\/ الشاحن يلغي الطلب\s*console\.log\('⏳ الشاحن يضغط إلغاء الطلب\.\.\.'\);/,
  `console.log('✅ تم نشر الطلب. الرابط:', requestUrl);
  
  await shipperPage.goto(requestUrl);
  await shipperPage.waitForSelector('button:has-text("إلغاء الطلب")');

  // الشاحن يلغي الطلب
  console.log('⏳ الشاحن يضغط إلغاء الطلب...');`
);
fs.writeFileSync('e2e-edge-cases.js', c);
console.log('Fixed cancel!');
