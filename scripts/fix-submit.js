const fs = require('fs');

let content = fs.readFileSync('e2e-edge-cases.js', 'utf8');

// Replace the submit logic
content = content.replace(
  /await shipperPage\.click\('\[data-testid="submit-wizard"\]', \{ force: true \}\);\s*await shipperPage\.waitForURL\('\*\*\/transport\/requests\/\*', \{ timeout: \d+ \}\);\s*const (requestUrl\d*) = shipperPage\.url\(\);/g,
  `const [response] = await Promise.all([
    shipperPage.waitForResponse(resp => resp.url().includes('requests') && resp.request().method() === 'POST', { timeout: 30000 }),
    shipperPage.click('[data-testid="submit-wizard"]', { force: true })
  ]);
  const responseData = await response.json();
  const $1 = 'https://souq-one-om-web.vercel.app/ar/transport/requests/' + responseData.id;
  await shipperPage.waitForURL(/\\/transport\\/my-requests/);`
);

fs.writeFileSync('e2e-edge-cases.js', content, 'utf8');
console.log('Fixed submit logic in e2e-edge-cases.js');
