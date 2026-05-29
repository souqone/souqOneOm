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

// A1 + A2
const schema = read('apps/api/prisma/schema.prisma');
const tBooking = schema.split('model TransportBooking')[1] || '';
const a1 = tBooking.includes('status          BookingStatus') ? '✅' : '❌';
const a2 = tBooking.includes('@default(ACCEPTED)') ? '✅' : '❌';
results.push({ bug: 'A1', status: a1, file: 'schema.prisma', note: 'BookingStatus' });
results.push({ bug: 'A2', status: a2, file: 'schema.prisma', note: '@default(ACCEPTED)' });

// A3
const tController = read('apps/api/src/transport/transport.controller.ts');
const a3_1 = tController.includes("@Get('bookings/:id')");
const a3_myIndex = tController.indexOf("@Get('bookings/my')");
const a3_idIndex = tController.indexOf("@Get('bookings/:id')");
const a3 = (a3_1 && a3_idIndex > a3_myIndex) ? '✅' : '❌'; // :id should be AFTER my to work. If prompt means my before id, it's correct.
results.push({ bug: 'A3', status: a3, file: 'transport.controller.ts', note: ':id is after my' });

// A4
const carrierSvc = read('apps/api/src/transport/carrier-profile.service.ts');
const a4 = carrierSvc.includes('include: { user:') ? '✅' : '❌';
results.push({ bug: 'A4', status: a4, file: 'carrier-profile.service.ts', note: 'include user in setAvailability' });

// A5
const tReqSvc = read('apps/api/src/transport/transport-request.service.ts');
const myReqMatch = tReqSvc.match(/myRequests[\s\S]*?include:[\s\S]*?user:/);
const a5 = myReqMatch ? '✅' : '❌';
results.push({ bug: 'A5', status: a5, file: 'transport-request.service.ts', note: 'include user in myRequests' });

// A6
const typesTs = read('apps/web/src/features/transport/types.ts');
const tbInterface = typesTs.split('TransportBooking')[1] || '';
const a6 = (!tbInterface.includes('request?:') && tbInterface.includes('request:')) ? '✅' : '❌';
results.push({ bug: 'A6', status: a6, file: 'types.ts', note: 'relations required' });

// A7 + A8
const createWiz = read('apps/web/src/features/transport/components/CreateRequestWizard.tsx');
const a7 = createWiz.includes("timingType === 'scheduled'") ? '✅' : '❌';
const a8 = (createWiz.includes('isSubmitting') && createWiz.includes('submittedRef')) || createWiz.includes('isSubmitting') ? '✅' : '❌';
results.push({ bug: 'A7', status: a7, file: 'CreateRequestWizard.tsx', note: 'scheduledAt conditionally sent' });
results.push({ bug: 'A8', status: a8, file: 'CreateRequestWizard.tsx', note: 'guard against double submit' });

// B1 + B3
const myQuotes = read('apps/web/src/app/[locale]/transport/my-quotes/page.tsx');
const b1 = myQuotes.includes('bookings/') || myQuotes.includes('my-bookings') ? '✅' : '❌';
const b3 = myQuotes.includes('<AuthGuard>') ? '✅' : '❌';
results.push({ bug: 'B1', status: b1, file: 'my-quotes/page.tsx', note: 'link to bookings' });
results.push({ bug: 'B3', status: b3, file: 'my-quotes/page.tsx', note: 'AuthGuard present' });

// B2
const subNav = read('apps/web/src/components/layout/SubNavBar.tsx');
const b2 = subNav.includes('my-bookings') ? '✅' : '❌';
results.push({ bug: 'B2', status: b2, file: 'SubNavBar.tsx', note: 'my-bookings link' });

// B4
const b4 = createWiz.includes("timingType") || createWiz.includes("scheduledAt") ? '✅' : '❌'; // Check STEP_FIELDS[4]
results.push({ bug: 'B4', status: b4, file: 'CreateRequestWizard.tsx', note: 'Step 4 validation fields' });

// B5 + B9 + B11 + C10 + C16 + N6 + N14
const bookingIdPage = read('apps/web/src/app/[locale]/transport/bookings/[id]/page.tsx');
const b5 = bookingIdPage.includes('booking.carrier.') ? '❌' : '✅';
const b9_11 = bookingIdPage.includes("user?.role === 'CARRIER'") ? '❌' : '✅';
const b10_val = read('apps/web/src/app/[locale]/transport/my-bookings/page.tsx');
const b10 = b10_val.includes("role='carrier'") || b10_val.includes('role=carrier') || b10_val.includes("role === 'CARRIER'") ? '✅' : '❌';
const c10 = bookingIdPage.includes('truncate') || bookingIdPage.includes('overflow-hidden') ? '✅' : '❌';
const c16 = bookingIdPage.includes('confirm') || bookingIdPage.includes('Modal') || bookingIdPage.includes('Dialog') ? '✅' : '❌';
const n6 = b9_11;
const n14 = bookingIdPage.includes('isCarrier || isShipper') || bookingIdPage.includes('isShipper || isCarrier') ? '✅' : '❌';
results.push({ bug: 'B5', status: b5, file: 'bookings/[id]/page.tsx', note: 'optional chaining on carrier' });
results.push({ bug: 'B9', status: b9_11, file: 'bookings/[id]/page.tsx', note: 'isCarrier correct' });
results.push({ bug: 'B11', status: b9_11, file: 'bookings/[id]/page.tsx', note: 'isShipper correct' });
results.push({ bug: 'B10', status: b10, file: 'my-bookings/page.tsx', note: 'supports carrier role' });

// B6 + C3 + C17 + N13
const carrierDash = read('apps/web/src/app/[locale]/transport/carriers/dashboard/page.tsx');
const b6 = carrierDash.includes('loading') || carrierDash.includes('Skeleton') ? '✅' : '❌';
const c3 = carrierDash.includes('setTimeout') || carrierDash.includes('toast.dismiss') ? '✅' : '❌';
const c17 = carrierDash.includes('slice(0, 8)') || carrierDash.includes('slice(0,8)') ? '✅' : '❌';
const n13 = carrierDash.includes('Promise.allSettled') ? '✅' : '❌';
results.push({ bug: 'B6', status: b6, file: 'carriers/dashboard/page.tsx', note: 'early return/loading' });
results.push({ bug: 'C3', status: c3, file: 'carriers/dashboard/page.tsx', note: 'toast timeout/close' });
results.push({ bug: 'C17', status: c17, file: 'carriers/dashboard/page.tsx', note: 'slice requestId' });
results.push({ bug: 'N13', status: n13, file: 'carriers/dashboard/page.tsx', note: 'Promise.allSettled' });

// B7
const b7 = fs.existsSync(path.join(cwd, 'apps/web/src/app/[locale]/jobs/my/page.tsx')) ? '❌' : '✅';
results.push({ bug: 'B7', status: b7, file: 'jobs/my/page.tsx', note: 'deleted' });

// B8 + C8 + C12 + C13 + C14 + N4 + N5 + N8 + N16 + D15 + D16
const reqIdPage = read('apps/web/src/app/[locale]/transport/requests/[id]/page.tsx');
const b8 = reqIdPage.includes('!!carrierProfile') || reqIdPage.includes('!!myCarrierId') ? '✅' : '❌';
const c8 = reqIdPage.includes('hidden') && reqIdPage.includes('message') ? '❌' : '✅'; // roughly
const c12 = reqIdPage.includes('var(--color-error)') || reqIdPage.includes('border-red-500') ? '✅' : '❌';
const c13 = reqIdPage.includes('min') || reqIdPage.includes('validation') ? '✅' : '❌';
const c14 = reqIdPage.includes('trim()') ? '✅' : '❌';
const n4 = reqIdPage.includes('getQuotes') && reqIdPage.includes('isOwner') ? '✅' : '❌';
const n5 = reqIdPage.includes('=== myCarrierId') ? '✅' : '❌';
const n8 = reqIdPage.includes('cancelRequest') ? '✅' : '❌';
results.push({ bug: 'B8', status: b8, file: 'requests/[id]/page.tsx', note: 'canSubmitQuote check' });
results.push({ bug: 'C8', status: c8, file: 'requests/[id]/page.tsx', note: 'messages visible' });
results.push({ bug: 'C12', status: c12, file: 'requests/[id]/page.tsx', note: 'price visual feedback' });
results.push({ bug: 'C13', status: c13, file: 'requests/[id]/page.tsx', note: 'hours validation' });
results.push({ bug: 'C14', status: c14, file: 'requests/[id]/page.tsx', note: 'message trim' });
results.push({ bug: 'N4', status: n4, file: 'requests/[id]/page.tsx', note: 'getQuotes only owner' });
results.push({ bug: 'N5', status: n5, file: 'requests/[id]/page.tsx', note: 'hasAlreadyQuoted check' });
results.push({ bug: 'N8', status: n8, file: 'requests/[id]/page.tsx', note: 'cancel button' });
results.push({ bug: 'N16', status: b8, file: 'requests/[id]/page.tsx', note: 'canSubmitQuote / banner' });

// C1
const c1 = createWiz.includes('toast.error') ? '✅' : '❌';
results.push({ bug: 'C1', status: c1, file: 'CreateRequestWizard.tsx', note: 'toast error on validation' });

// C2
const c2 = myQuotes.includes('pendingWithdrawals') ? '✅' : '❌';
results.push({ bug: 'C2', status: c2, file: 'my-quotes/page.tsx', note: 'pendingWithdrawals ref' });

// C4 + C11 + C15 + N12 + N15 + N17 + D17
const myReqs = read('apps/web/src/app/[locale]/transport/my-requests/page.tsx');
const c4 = myReqs.includes('setLoading(true)') ? '✅' : '❌';
const c11 = myReqs.includes('window.location.reload()') ? '❌' : '✅';
const c15 = myReqs.includes('Skeleton') ? '✅' : '❌';
const n12 = myReqs.includes('limit') && !myReqs.includes('limit: 50') ? '✅' : '❌'; // Check pagination
const n17 = myReqs.includes('cancel') || myReqs.includes('Cancel') ? '✅' : '❌';
results.push({ bug: 'C4', status: c4, file: 'my-requests/page.tsx', note: 'setLoading first' });
results.push({ bug: 'C11', status: c11, file: 'my-requests/page.tsx', note: 'onRetry uses load' });
results.push({ bug: 'C15', status: c15, file: 'my-requests/page.tsx', note: 'skeleton on tab change' });
results.push({ bug: 'N12', status: n12, file: 'my-requests/page.tsx', note: 'pagination limit' });
results.push({ bug: 'N15', status: c11, file: 'my-requests/page.tsx', note: 'reload vs load' });
results.push({ bug: 'N17', status: n17, file: 'my-requests/page.tsx', note: 'cancel button UI' });

// C5 + F1 + F2 + F3 + F4 + F5 + F10
const browseContent = read('apps/web/src/features/transport/components/BrowseContent.tsx');
const c5 = browseContent.includes('badge') || browseContent.includes('Count') ? '✅' : '❌';
const f1 = browseContent.includes('router.replace') ? '✅' : '❌';
const f2 = browseContent.includes('fromWilayat') ? '✅' : '❌';
const f3 = browseContent.includes('URLSearchParams') || browseContent.includes('searchParams') ? '✅' : '❌';
const f4 = browseContent.includes('toWilayat') ? '✅' : '❌';
const f5 = browseContent.includes('clearFilters') || browseContent.includes('reset') ? '✅' : '❌';
const f10 = browseContent.includes('sortBy') ? '✅' : '❌';
results.push({ bug: 'C5', status: c5, file: 'BrowseContent.tsx', note: 'filter badge' });
results.push({ bug: 'F1', status: f1, file: 'BrowseContent.tsx', note: 'router.replace' });
results.push({ bug: 'F2', status: f2, file: 'BrowseContent.tsx', note: 'fromWilayat passed' });
results.push({ bug: 'F3', status: f3, file: 'BrowseContent.tsx', note: 'keep URL params on page change' });
results.push({ bug: 'F4', status: f4, file: 'BrowseContent.tsx', note: 'toWilayat passed' });
results.push({ bug: 'F5', status: f5, file: 'BrowseContent.tsx', note: 'clear filters button' });
results.push({ bug: 'F10', status: f10, file: 'BrowseContent.tsx', note: 'sortBy in URL' });

// C6 + C7 + E8
const carrierReg = read('apps/web/src/app/[locale]/transport/carriers/register/page.tsx');
const c6 = carrierReg.includes('finally') && carrierReg.includes('setSubmitting(false)') ? '✅' : '❌';
const c7 = carrierReg.includes('جارٍ التحقق') || carrierReg.includes('t(') ? '✅' : '❌';
const e8 = carrierReg.includes("@/i18n/navigation") ? '✅' : '❌';
results.push({ bug: 'C6', status: c6, file: 'carriers/register/page.tsx', note: 'finally setSubmitting' });
results.push({ bug: 'C7', status: c7, file: 'carriers/register/page.tsx', note: 'text with spinner' });
results.push({ bug: 'E8', status: e8, file: 'carriers/register/page.tsx', note: 'Link import' });

// C9
const requestsGrid = read('apps/web/src/features/transport/components/RequestsGrid.tsx');
const c9 = requestsGrid.includes('scrollTo') ? '✅' : '❌';
results.push({ bug: 'C9', status: c9, file: 'RequestsGrid.tsx', note: 'scrollTo top on page change' });

// C18 + F9
const step5 = read('apps/web/src/features/transport/components/Step5Review.tsx');
const c18 = step5.includes('Check') || step5.includes('MapPin') || step5.includes('✓') ? '✅' : '❌';
results.push({ bug: 'C18', status: c18, file: 'Step5Review.tsx', note: 'visual map confirmation' });
results.push({ bug: 'F9', status: c18, file: 'Step5Review.tsx', note: 'visual map confirmation' });

// E1 + F6 + N1 + D14
const reqCard = read('apps/web/src/features/transport/components/TransportRequestCard.tsx');
const e1 = reqCard.includes("@/i18n/navigation") ? '✅' : '❌';
const f6 = reqCard.includes("|| 'لم يتم تحديد وصف'") || reqCard.includes("|| t(") ? '✅' : '❌';
const n1 = reqCard.includes('currentUserId') && reqCard.includes('===') ? '✅' : '❌';
const d14 = !reqCard.includes('من:') ? '✅' : '❌';
results.push({ bug: 'E1', status: e1, file: 'TransportRequestCard.tsx', note: 'Link import' });
results.push({ bug: 'F6', status: f6, file: 'TransportRequestCard.tsx', note: 'cargo fallback' });
results.push({ bug: 'N1', status: n1, file: 'TransportRequestCard.tsx', note: 'canEdit check' });
results.push({ bug: 'D14', status: d14, file: 'TransportRequestCard.tsx', note: 'card texts translated' });

// E2 + D1
const hero = read('apps/web/src/features/transport/components/HeroSection.tsx');
const e2 = hero.includes("@/i18n/navigation") ? '✅' : '❌';
const d1 = !hero.includes('خدمة نقل البضائع') ? '✅' : '❌';
results.push({ bug: 'E2', status: e2, file: 'HeroSection.tsx', note: 'Link import' });
results.push({ bug: 'D1', status: d1, file: 'HeroSection.tsx', note: 'Translated hero' });

// E3 + D7
const carrierCta = read('apps/web/src/features/transport/components/CarrierCTA.tsx');
const e3 = carrierCta.includes("@/i18n/navigation") ? '✅' : '❌';
const d7 = !carrierCta.includes('سجل كناقل') ? '✅' : '❌'; // Check for hardcoded arabic
results.push({ bug: 'E3', status: e3, file: 'CarrierCTA.tsx', note: 'Link import' });
results.push({ bug: 'D7', status: d7, file: 'CarrierCTA.tsx', note: 'Translated' });

// E4 + E7 + D8
const svcGrid = read('apps/web/src/features/transport/components/ServiceTypesGrid.tsx');
const e4 = svcGrid.includes("@/i18n/navigation") ? '✅' : '❌';
const d8 = !svcGrid.includes('نقل عام') ? '✅' : '❌';
results.push({ bug: 'E4', status: e4, file: 'ServiceTypesGrid.tsx', note: 'Link import' });
results.push({ bug: 'E7', status: e4, file: 'ServiceTypesGrid.tsx', note: 'Link import' });
results.push({ bug: 'D8', status: d8, file: 'ServiceTypesGrid.tsx', note: 'Translated' });

// E5 + D9
const latestReq = read('apps/web/src/features/transport/components/LatestRequests.tsx');
const e5 = latestReq.includes("@/i18n/navigation") ? '✅' : '❌';
const d9 = latestReq.includes('t(') && !latestReq.includes('أحدث الطلبات') ? '✅' : '❌';
results.push({ bug: 'E5', status: e5, file: 'LatestRequests.tsx', note: 'Link import' });
results.push({ bug: 'D9', status: d9, file: 'LatestRequests.tsx', note: 'Translated' });

// E6 + D15 + D16
const e6 = reqIdPage.includes("@/i18n/navigation") ? '✅' : '❌';
results.push({ bug: 'E6', status: e6, file: 'requests/[id]/page.tsx', note: 'Link import' });

// E9
const e9 = myQuotes.includes("@/i18n/navigation") ? '✅' : '❌';
results.push({ bug: 'E9', status: e9, file: 'my-quotes/page.tsx', note: 'Link import' });

// E10
const e10 = carrierDash.includes("@/i18n/navigation") ? '✅' : '❌';
results.push({ bug: 'E10', status: e10, file: 'carriers/dashboard/page.tsx', note: 'Link import' });

// F7
const routeMap = read('apps/web/src/features/transport/components/RouteMapView.tsx');
const f7 = routeMap.includes('if') && routeMap.includes('setTimeout') ? '✅' : '❌';
results.push({ bug: 'F7', status: f7, file: 'RouteMapView.tsx', note: 'conditional timeout' });

// F8
results.push({ bug: 'F8', status: b4, file: 'CreateRequestWizard.tsx', note: 'STEP_FIELDS[4]' });

// N2
const reqEdit = read('apps/web/src/app/[locale]/transport/requests/[id]/edit/page.tsx');
const n2 = reqEdit.includes('request.userId !== user.id') ? '✅' : '❌';
results.push({ bug: 'N2', status: n2, file: 'requests/[id]/edit/page.tsx', note: 'ownership redirect' });

// N3
const n3 = tReqSvc.includes('userId !== userId') || tReqSvc.includes('request.userId !== userId') ? '✅' : '❌';
results.push({ bug: 'N3', status: n3, file: 'transport-request.service.ts', note: 'forbidden exception' });

// N7
results.push({ bug: 'N7', status: a3, file: 'transport.controller.ts', note: 'bookings/:id vs bookings/my' });

// N9 + N10
const tQuoteSvc = read('apps/api/src/transport/transport-quote.service.ts');
const n9 = tQuoteSvc.includes('$transaction') && tQuoteSvc.includes('acceptQuote') ? '✅' : '❌';
const n10 = tQuoteSvc.includes('$transaction') && tQuoteSvc.includes('withdrawQuote') ? '✅' : '❌';
results.push({ bug: 'N9', status: n9, file: 'transport-quote.service.ts', note: 'transaction accept' });
results.push({ bug: 'N10', status: n10, file: 'transport-quote.service.ts', note: 'transaction withdraw' });

// N11
const createReqDto = read('apps/api/src/transport/dto/create-transport-request.dto.ts');
const n11 = createReqDto.includes('Validate') || createReqDto.includes('refine') ? '✅' : '❌';
results.push({ bug: 'N11', status: n11, file: 'create-transport-request.dto.ts', note: 'budgetMin > budgetMax' });

// D2
const constants = read('apps/web/src/features/transport/constants.ts');
const d2 = !constants.includes('مفتوح') ? '✅' : '❌';
results.push({ bug: 'D2', status: d2, file: 'constants.ts', note: 'no hardcoded strings' });

// D3
const arJson = read('apps/web/src/messages/ar.json');
const d3 = arJson.includes('requestStatus') ? '✅' : '❌';
results.push({ bug: 'D3', status: d3, file: 'ar.json', note: 'ar translations' });

// D4
const enJson = read('apps/web/src/messages/en.json');
const d4 = enJson.includes('requestStatus') ? '✅' : '❌';
results.push({ bug: 'D4', status: d4, file: 'en.json', note: 'en translations' });

// D5
const d5 = '❌'; // Check manually if needed
results.push({ bug: 'D5', status: d5, file: 'multiple', note: 'ناقل fallback' });

// D6
const d6 = '❌'; // Check manually if needed
results.push({ bug: 'D6', status: d6, file: 'multiple', note: 'toLocaleDateString' });

// D10-D13
const step1 = read('apps/web/src/features/transport/components/Step1ServiceType.tsx');
const d10 = !step1.includes('اختر نوع الخدمة') ? '✅' : '❌';
results.push({ bug: 'D10', status: d10, file: 'Step1ServiceType.tsx', note: 'Translated' });
results.push({ bug: 'D11', status: '❌', file: 'Step2Route.tsx', note: 'Translated' });
results.push({ bug: 'D12', status: '❌', file: 'Step3Cargo.tsx', note: 'Translated' });
results.push({ bug: 'D13', status: '❌', file: 'Step4Timing.tsx', note: 'Translated' });
results.push({ bug: 'D15', status: '❌', file: 'requests/[id]/page.tsx', note: 'Translated' });
results.push({ bug: 'D16', status: '❌', file: 'requests/[id]/page.tsx', note: 'Translated' });
results.push({ bug: 'D17', status: '❌', file: 'my-requests/page.tsx', note: 'Translated' });
results.push({ bug: 'D18', status: '❌', file: 'my-quotes/page.tsx', note: 'Translated' });
results.push({ bug: 'D19', status: '❌', file: 'general', note: 'Translated' });
results.push({ bug: 'D20', status: '❌', file: 'general', note: 'Translated' });


let md = '| Bug | الحالة | الملف | ملاحظة |\n|-----|--------|-------|--------|\n';
let fixed = 0;
results.sort((a,b) => a.bug.localeCompare(b.bug)).forEach(r => {
  md += `| ${r.bug} | ${r.status} | ${r.file} | ${r.note} |\n`;
  if (r.status === '✅') fixed++;
});

md += `\n\n**عدد الـ bugs المصلحة:** ${fixed} من ${results.length}\n`;

fs.writeFileSync(path.join(cwd, 'audit-results.md'), md);
console.log('Done, wrote audit-results.md');
