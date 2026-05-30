const fs = require('fs');
let c = fs.readFileSync('e2e-edge-cases.js','utf8');

c = c.replace(
  /await shipperPage\.reload\(\);\s*await shipperPage\.waitForSelector\('button:has-text\("قبول هذا العرض"\)'\);/g,
  `await shipperPage.goto(requestUrl3 /* REPLACE WITH ACTUAL */);
  await shipperPage.waitForSelector('button:has-text("قبول هذا العرض")');`
);

// We have two such replacements, one should use requestUrl3, the other requestUrl4
const parts = c.split('/* REPLACE WITH ACTUAL */');
if (parts.length === 3) {
  c = parts[0] + parts[1].replace('requestUrl3', 'requestUrl4') + parts[2];
}

fs.writeFileSync('e2e-edge-cases.js', c);
console.log('Fixed navigation!');
