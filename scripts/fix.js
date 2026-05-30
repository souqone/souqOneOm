const fs = require('fs');

let content = fs.readFileSync('e2e-edge-cases.js', 'utf8');

// Replace Scenario 1 form
content = content.replace(
  /await shipperPage\.fill\('input\[placeholder="اختر المحافظة"\]', 'مسقط'\);\s*await shipperPage\.fill\('input\[placeholder\*="تفاصيل العنوان"\]', 'روي'\);\s*await shipperPage\.fill\('input\[placeholder="اختر المحافظة \(للوصول\)"\]', 'ظفار'\);\s*await shipperPage\.fill\('input\[placeholder\*="الوجهة النهائية"\]', 'صلالة'\);/g,
  `await shipperPage.selectOption('select[name="fromGovernorate"]', { index: 1 });
  await shipperPage.fill('textarea[name="fromAddress"]', 'روي');
  await shipperPage.selectOption('select[name="toGovernorate"]', { index: 2 });
  await shipperPage.fill('textarea[name="toAddress"]', 'صلالة');`
);

// Replace Scenario 2 form
content = content.replace(
  /await shipperPage\.fill\('input\[placeholder="اختر المحافظة"\]', 'مسقط'\);\s*await shipperPage\.fill\('input\[placeholder\*="تفاصيل العنوان"\]', 'بوشر'\);\s*await shipperPage\.fill\('input\[placeholder="اختر المحافظة \(للوصول\)"\]', 'نزوى'\);\s*await shipperPage\.fill\('input\[placeholder\*="الوجهة النهائية"\]', 'السوق'\);/g,
  `await shipperPage.selectOption('select[name="fromGovernorate"]', { index: 1 });
  await shipperPage.fill('textarea[name="fromAddress"]', 'بوشر');
  await shipperPage.selectOption('select[name="toGovernorate"]', { index: 3 });
  await shipperPage.fill('textarea[name="toAddress"]', 'نزوى');`
);

// Replace Scenario 3/5 form
content = content.replace(
  /await shipperPage\.fill\('input\[placeholder="اختر المحافظة"\]', 'مسقط'\);\s*await shipperPage\.fill\('input\[placeholder\*="تفاصيل العنوان"\]', 'A'\);\s*await shipperPage\.fill\('input\[placeholder="اختر المحافظة \(للوصول\)"\]', 'صلالة'\);\s*await shipperPage\.fill\('input\[placeholder\*="الوجهة النهائية"\]', 'B'\);/g,
  `await shipperPage.selectOption('select[name="fromGovernorate"]', { index: 1 });
  await shipperPage.fill('textarea[name="fromAddress"]', 'A');
  await shipperPage.selectOption('select[name="toGovernorate"]', { index: 2 });
  await shipperPage.fill('textarea[name="toAddress"]', 'B');`
);

// Replace budget inputs with weightTons
content = content.replace(
  /await shipperPage\.fill\('textarea', ('.*?')\);\s*await shipperPage\.click\('button:has-text\("التالي"\)'\);\s*await shipperPage\.fill\('input\[placeholder="أقل ميزانية"\]', '.*?'\);\s*await shipperPage\.fill\('input\[placeholder="أقصى ميزانية"\]', '.*?'\);\s*await shipperPage\.click\('button:has-text\("التالي"\)'\);/g,
  `await shipperPage.fill('textarea[name="cargoDescription"]', $1);
  await shipperPage.fill('input[name="weightTons"]', '2');
  await shipperPage.click('button:has-text("التالي")');
  await shipperPage.click('button:has-text("التالي")');`
);

fs.writeFileSync('e2e-edge-cases.js', content, 'utf8');
console.log('Fixed e2e-edge-cases.js');
