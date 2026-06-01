const fs = require('fs');
const path = require('path');

const cwd = 'c:\\Users\\DELL\\Desktop\\m';
function read(file) {
  try {
    return fs.readFileSync(path.join(cwd, file), 'utf8');
  } catch (e) {
    return '';
  }
}

const results = [];

console.log("🕵️‍♂️ جاري تشغيل فاحص أكواد الوظائف (Jobs Static Audit)...");

// 1. Roles & Guards (هل يتم حماية مسارات أصحاب العمل والسائقين بشكل دقيق؟)
const newJobPage = read('apps/web/src/app/[locale]/jobs/new/page.tsx');
// Bug: JobsPageGuard forces role="employer" which prevents drivers from creating "OFFERING" services.
const r1 = newJobPage.includes('role="employer"') ? '❌' : '✅';
results.push({ bug: 'Roles-1', status: r1, file: 'jobs/new/page.tsx', note: 'صفحة إنشاء الوظيفة تمنع السائقين من إنشاء (خدمات تقديم) لأنها تجبر دور Employer فقط' });

const driverRegPage = read('apps/web/src/app/[locale]/jobs/drivers/register/page.tsx');
const r2 = driverRegPage.includes('AuthGuard') && (driverRegPage.includes('driver') || !driverRegPage.includes('employer')) ? '✅' : '❌';
results.push({ bug: 'Roles-2', status: r2, file: 'jobs/drivers/register/page.tsx', note: 'صفحة تسجيل السائق محمية' });

// 2. Edge Cases (تقديم طلب على الوظيفة الخاصة بي، أو التقديم المزدوج)
const jobDetailClient = read('apps/web/src/app/[locale]/jobs/[id]/job-detail-client.tsx');
const e1 = jobDetailClient.includes('!isJobOwner') ? '✅' : '❌';
results.push({ bug: 'Edge-1', status: e1, file: 'job-detail-client.tsx', note: 'منع صاحب العمل من التقديم على وظيفته (!isJobOwner)' });

const e2 = jobDetailClient.includes('!alreadyApplied') ? '✅' : '❌';
results.push({ bug: 'Edge-2', status: e2, file: 'job-detail-client.tsx', note: 'منع السائق من التقديم مرتين (!alreadyApplied)' });

// 3. API & Load Handling
const apiJobsSvc = read('apps/api/src/jobs/jobs.service.ts');
const api1 = apiJobsSvc.includes('include:') && apiJobsSvc.includes('employerProfile:') ? '✅' : '❌';
results.push({ bug: 'API-1', status: api1, file: 'jobs.service.ts', note: 'جلب بيانات صاحب الشركة مع الوظيفة' });

// توليد الجدول
let md = '| المُعرّف | الحالة | الملف | ملاحظة والفحص المطلوب |\n|-----|--------|-------|--------|\n';
let fixed = 0;
results.sort((a,b) => a.bug.localeCompare(b.bug)).forEach(r => {
  md += `| ${r.bug} | ${r.status} | ${r.file} | ${r.note} |\n`;
  if (r.status === '✅') fixed++;
});

md += `\n\n**النتيجة الإجمالية:** تم اجتياز ${fixed} من أصل ${results.length} فحصاً بنجاح.\n`;

const outputPath = path.join(cwd, 'jobs-audit-results.md');
fs.writeFileSync(outputPath, md);
console.log('✅ تم الانتهاء! تم كتابة تقرير الفحص في: jobs-audit-results.md');
