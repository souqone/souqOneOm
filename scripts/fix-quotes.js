const fs = require('fs');
let c = fs.readFileSync('e2e-edge-cases.js','utf8');
c = c.replace(/عنوان طويل جداً أ/g, "'عنوان طويل جداً أ'");
c = c.replace(/عنوان طويل جداً ب/g, "'عنوان طويل جداً ب'");
// In case they are already quoted like ''عنوان...'' we can fix it:
c = c.replace(/''/g, "'");
fs.writeFileSync('e2e-edge-cases.js', c);
console.log('Fixed quotes');
