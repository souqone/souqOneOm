import React from 'react';
import fs from 'fs';
import path from 'path';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { LegalPageShell, LegalSectionItem } from '../components/legal/LegalPageShell';
import { splitSectionTitle } from '../components/legal/splitSectionTitle';
import { LegalToc } from '../components/legal/LegalToc';
import { LegalFooter } from '../components/legal/LegalFooter';
import { LegalSheet } from '../components/legal/LegalSheet';
import { Footer } from '../components/layout/footer';
import { LEGAL_CONFIG, INSTAGRAM_URL } from '../lib/legal-config';
import { setTestLocale } from '../test/setup';
import { generateMetadata as generatePrivacyMetadata } from '../app/[locale]/privacy/page';
import { generateMetadata as generateTermsMetadata } from '../app/[locale]/terms/page';
import { generateMetadata as generateDeleteAccountMetadata } from '../app/[locale]/delete-account/page';
import ar from '../messages/ar.json';
import en from '../messages/en.json';

describe('Legal Pages Content & Structural Audit', () => {
  const pages = ['privacy', 'terms', 'deleteAccount'] as const;

  describe('Translation Parity & Key Symmetry', () => {
    pages.forEach((page) => {
      it(`has matching sections and keys for ${page} in ar.json and en.json`, () => {
        const arPage = (ar.legalPages as any)[page];
        const enPage = (en.legalPages as any)[page];

        expect(arPage).toBeDefined();
        expect(enPage).toBeDefined();
        expect(arPage.title).toBeTruthy();
        expect(enPage.title).toBeTruthy();

        const arKeys = Object.keys(arPage.sections);
        const enKeys = Object.keys(enPage.sections);

        expect(arKeys).toEqual(enKeys);
        expect(arKeys.length).toBeGreaterThanOrEqual(6);

        arKeys.forEach((key) => {
          expect(arPage.sections[key].title).toBeTruthy();
          expect(arPage.sections[key].content).toBeTruthy();
          expect(enPage.sections[key].title).toBeTruthy();
          expect(enPage.sections[key].content).toBeTruthy();
        });
      });
    });
  });

  describe('Prohibited Terms & Brand Spelling Safety', () => {
    it('fails if "علامة تجارية مسجلة" or "registered trademark" is found in legalPages', () => {
      const arJsonStr = JSON.stringify(ar.legalPages);
      const enJsonStr = JSON.stringify(en.legalPages);

      expect(arJsonStr).not.toContain('علامة تجارية مسجلة');
      expect(arJsonStr.toLowerCase()).not.toContain('registered trademark');
      expect(enJsonStr).not.toContain('علامة تجارية مسجلة');
      expect(enJsonStr.toLowerCase()).not.toContain('registered trademark');
    });

    it('enforces brand spelling "سوق ون" in Arabic and "Souqone" in English inside legalPages', () => {
      const arJsonStr = JSON.stringify(ar.legalPages);
      expect(arJsonStr).not.toContain('سوق وان');

      expect(LEGAL_CONFIG.brandName.ar).toBe('سوق ون');
      expect(LEGAL_CONFIG.brandName.en).toBe('Souqone');
      expect(LEGAL_CONFIG.supportEmail).toBe('support@souqoneom.com');
    });

    it('ensures absolute metadata titles do NOT contain "سوق وان" or "SouqOne"', async () => {
      const metadataGetters = [
        { name: 'privacy', fn: generatePrivacyMetadata },
        { name: 'terms', fn: generateTermsMetadata },
        { name: 'delete-account', fn: generateDeleteAccountMetadata },
      ];

      for (const item of metadataGetters) {
        // Arabic metadata
        const arMeta = await item.fn({ params: Promise.resolve({ locale: 'ar' }) });
        const arTitle = typeof arMeta.title === 'object' && arMeta.title && 'absolute' in arMeta.title
          ? (arMeta.title as any).absolute
          : String(arMeta.title);

        expect(arTitle).toContain('سوق ون');
        expect(arTitle).not.toContain('سوق وان');
        expect(arTitle).not.toContain('SouqOne');

        // English metadata
        const enMeta = await item.fn({ params: Promise.resolve({ locale: 'en' }) });
        const enTitle = typeof enMeta.title === 'object' && enMeta.title && 'absolute' in enMeta.title
          ? (enMeta.title as any).absolute
          : String(enMeta.title);

        expect(enTitle).toContain('Souqone');
        expect(enTitle).not.toContain('سوق وان');
        expect(enTitle).not.toContain('SouqOne');
      }
    });

    it('fails if dummy phone "9999 0000" or old email "info@souqone.com" appears in messages or component files', () => {
      const arJsonStr = JSON.stringify(ar);
      const enJsonStr = JSON.stringify(en);

      expect(arJsonStr).not.toContain('info@souqone.com');
      expect(arJsonStr).not.toContain('9999 0000');
      expect(enJsonStr).not.toContain('info@souqone.com');
      expect(enJsonStr).not.toContain('9999 0000');

      const footerCode = fs.readFileSync(path.join(__dirname, '../components/layout/footer.tsx'), 'utf8');
      expect(footerCode).not.toContain('info@souqone.com');
      expect(footerCode).not.toContain('9999 0000');

      const legalFiles = ['LegalPageShell.tsx', 'LegalHeader.tsx', 'LegalFooter.tsx'];
      for (const file of legalFiles) {
        const code = fs.readFileSync(path.join(__dirname, '../components/legal', file), 'utf8');
        expect(code).not.toContain('info@souqone.com');
        expect(code).not.toContain('9999 0000');
      }
    });

    it('enforces operating entity details (CR 1373251 & «هامة المجد الوطنية للتجارة») and absence of placeholder text', () => {
      const crNumber = '1373251';
      const entityName = '«هامة المجد الوطنية للتجارة»';

      // 1. LEGAL_CONFIG
      expect(LEGAL_CONFIG.operatorNotice.ar).toContain(crNumber);
      expect(LEGAL_CONFIG.operatorNotice.ar).toContain(entityName);
      expect(LEGAL_CONFIG.operatorNotice.ar).not.toContain('سيتم تحديث');

      expect(LEGAL_CONFIG.operatorNotice.en).toContain(crNumber);
      expect(LEGAL_CONFIG.operatorNotice.en).toContain(entityName);
      expect(LEGAL_CONFIG.operatorNotice.en.toLowerCase()).not.toContain('will be updated');

      // 2. ar.json (common.operatorNotice & privacy.sections.operator.content & terms.sections.acceptance.content)
      const arLegal = ar.legalPages as any;
      expect(arLegal.common.operatorNotice).toContain(crNumber);
      expect(arLegal.common.operatorNotice).toContain(entityName);
      expect(arLegal.common.operatorNotice).not.toContain('سيتم تحديث');

      expect(arLegal.privacy.sections.operator.content).toContain(crNumber);
      expect(arLegal.privacy.sections.operator.content).toContain(entityName);
      expect(arLegal.privacy.sections.operator.content).not.toContain('سيتم تحديث');

      expect(arLegal.terms.sections.acceptance.content).toContain(crNumber);
      expect(arLegal.terms.sections.acceptance.content).toContain(entityName);
      expect(arLegal.terms.sections.acceptance.content).not.toContain('سيتم تحديث');
      expect(arLegal.terms.sections.acceptance.content.toLowerCase()).not.toContain('legal entity details');

      // 3. en.json (common.operatorNotice & privacy.sections.operator.content & terms.sections.acceptance.content)
      const enLegal = en.legalPages as any;
      expect(enLegal.common.operatorNotice).toContain(crNumber);
      expect(enLegal.common.operatorNotice).toContain(entityName);
      expect(enLegal.common.operatorNotice.toLowerCase()).not.toContain('will be updated');

      expect(enLegal.privacy.sections.operator.content).toContain(crNumber);
      expect(enLegal.privacy.sections.operator.content).toContain(entityName);
      expect(enLegal.privacy.sections.operator.content.toLowerCase()).not.toContain('will be updated');

      expect(enLegal.terms.sections.acceptance.content).toContain(crNumber);
      expect(enLegal.terms.sections.acceptance.content).toContain(entityName);
      expect(enLegal.terms.sections.acceptance.content.toLowerCase()).not.toContain('will be updated');
      expect(enLegal.terms.sections.acceptance.content.toLowerCase()).not.toContain('legal entity details');
    });

    it('verifies that no legacy placeholder phrases exist across the entirety of ar.json and en.json', () => {
      const arStr = JSON.stringify(ar);
      const enStr = JSON.stringify(en);

      const legacyPhrases = [
        'سيتم تحديث',
        'will be updated',
        'legal entity details',
      ];

      for (const phrase of legacyPhrases) {
        expect(arStr.toLowerCase()).not.toContain(phrase.toLowerCase());
        expect(enStr.toLowerCase()).not.toContain(phrase.toLowerCase());
      }
    });

    it('enforces presence of paidServices in Terms with exactly 13 sections in ar and en', () => {
      const arTerms = (ar.legalPages as any).terms.sections;
      const enTerms = (en.legalPages as any).terms.sections;

      expect(Object.keys(arTerms)).toHaveLength(13);
      expect(Object.keys(enTerms)).toHaveLength(13);

      expect(arTerms).toHaveProperty('paidServices');
      expect(enTerms).toHaveProperty('paidServices');

      expect(arTerms.paidServices.title).toBe('6. الخدمات المدفوعة');
      expect(enTerms.paidServices.title).toBe('6. Paid Services');

      // Content checks: must mention Thawani and payment types, no unauthorized refund terms
      expect(arTerms.paidServices.content).toContain('ثواني');
      expect(enTerms.paidServices.content).toContain('Thawani');
      expect(arTerms.paidServices.content).not.toContain('استرجاع');
      expect(enTerms.paidServices.content.toLowerCase()).not.toContain('refund');
    });

    it('enforces payment details in Privacy Policy across both languages', () => {
      const arPriv = (ar.legalPages as any).privacy.sections;
      const enPriv = (en.legalPages as any).privacy.sections;

      expect(arPriv.dataCollected.content).toContain('سجلات المدفوعات والاشتراكات');
      expect(enPriv.dataCollected.content).toContain('Payment and Subscription Records');

      expect(arPriv.thirdPartyServices.content).toContain('بوابة الدفع ثواني');
      expect(enPriv.thirdPartyServices.content).toContain('Thawani Payment Gateway');

      expect(arPriv.dataRetention.content).toContain('سجلات المدفوعات والاشتراكات تُحفظ');
      expect(enPriv.dataRetention.content).toContain('Payment and subscription transaction records are retained');
    });
  });

  describe('Account Deletion & Data Retention Legal Policy Alignment', () => {
    it('(1) has matching deleteAccount.sections keys in ar and en in the exact same order', () => {
      const arDelete = (ar.legalPages as any).deleteAccount.sections;
      const enDelete = (en.legalPages as any).deleteAccount.sections;

      const expectedKeys = [
        'overview',
        'inAppMethod',
        'gracePeriod',
        'emailMethod',
        'whatIsDeleted',
        'whatIsRetained',
        'timeframe',
        'contact',
      ];

      expect(Object.keys(arDelete)).toEqual(expectedKeys);
      expect(Object.keys(enDelete)).toEqual(expectedKeys);
    });

    it('(2) contains "5 أيام" in Arabic and "5 days" in English for deleteAccount, and no "30 يوم" or "30 days"', () => {
      const arDeleteStr = JSON.stringify((ar.legalPages as any).deleteAccount);
      const enDeleteStr = JSON.stringify((en.legalPages as any).deleteAccount);

      expect(arDeleteStr).toContain('5 أيام');
      expect(enDeleteStr).toContain('5 days');

      expect(arDeleteStr).not.toContain('30 يوم');
      expect(arDeleteStr).not.toContain('30 يوماً');
      expect(arDeleteStr).not.toContain('30 days');

      expect(enDeleteStr).not.toContain('30 يوم');
      expect(enDeleteStr).not.toContain('30 days');
    });

    it('(3) ensures privacy.sections.dataRetention does NOT contain "30 يوم" for account deletion', () => {
      const arDataRetention = (ar.legalPages as any).privacy.sections.dataRetention.content;
      const enDataRetention = (en.legalPages as any).privacy.sections.dataRetention.content;

      // Account deletion clause must not mention 30 days
      const arLines: string[] = arDataRetention.split('\n');
      const arDeletionLine = arLines.find((l: string) => l.includes('عند طلب حذف الحساب'));
      expect(arDeletionLine).toBeDefined();
      expect(arDeletionLine).toContain('5 أيام');
      expect(arDeletionLine).not.toContain('30 يوم');
      expect(arDeletionLine).not.toContain('30 يوماً');

      const enLines: string[] = enDataRetention.split('\n');
      const enDeletionLine = enLines.find((l: string) => l.toLowerCase().includes('grace period'));
      expect(enDeletionLine).toBeDefined();
      expect(enDeletionLine).toContain('5-day');
      expect(enDeletionLine).not.toContain('30 days');

      // 90 days login logs check
      expect(arDataRetention).toContain('90 يوماً');
      expect(enDataRetention).toContain('90 days');
    });

    it('(4) inAppMethod section exists and mentions "حذف الحساب" in Arabic and "Delete Account" in English', () => {
      const arInApp = (ar.legalPages as any).deleteAccount.sections.inAppMethod;
      const enInApp = (en.legalPages as any).deleteAccount.sections.inAppMethod;

      expect(arInApp).toBeDefined();
      expect(arInApp.title).toContain('الحذف من داخل التطبيق');
      expect(arInApp.content).toContain('حذف الحساب');

      expect(enInApp).toBeDefined();
      expect(enInApp.title).toContain('In-App Deletion');
      expect(enInApp.content).toContain('Delete Account');
    });
  });

  describe('Accessibility & LegalFooter aria-label', () => {
    it('localizes LegalFooter nav aria-label for Arabic and English', () => {
      const { container: arContainer, unmount: arUnmount } = render(<LegalFooter locale="ar" />);
      const arNav = arContainer.querySelector('nav');
      expect(arNav).toHaveAttribute('aria-label', 'صفحات قانونية');
      arUnmount();

      const { container: enContainer, unmount: enUnmount } = render(<LegalFooter locale="en" />);
      const enNav = enContainer.querySelector('nav');
      expect(enNav).toHaveAttribute('aria-label', 'Legal Pages');
      enUnmount();
    });
  });

  describe('HTML Hierarchy & Accessibility in LegalPageShell', () => {
    pages.forEach((page) => {
      it(`renders exactly one h1 and table of contents with h2 sections for ${page} in Arabic and English`, () => {
        const arPage = (ar.legalPages as any)[page];
        const sections: LegalSectionItem[] = Object.entries(arPage.sections).map(
          ([key, s]: [string, any]) => ({
            id: key,
            title: s.title,
            content: s.content,
          }),
        );

        const { container, unmount } = render(
          <LegalPageShell
            locale="ar"
            title={arPage.title}
            subtitle={arPage.subtitle}
            sections={sections}
          />,
        );

        // Exactly one h1
        const h1Elements = container.querySelectorAll('h1');
        expect(h1Elements.length).toBe(1);
        expect(h1Elements[0].textContent).toBe(arPage.title);

        // Table of contents navigation exists (mobile + desktop)
        const tocNavs = screen.getAllByRole('navigation', { name: /فهرس الأقسام/i });
        expect(tocNavs.length).toBeGreaterThanOrEqual(1);

        // Every section has an h2 and id
        sections.forEach((sec) => {
          const sectionElem = container.querySelector(`section#${sec.id}`);
          expect(sectionElem).toBeInTheDocument();
          const h2 = sectionElem?.querySelector('h2');
          expect(h2).toBeInTheDocument();
          const parsed = splitSectionTitle(sec.title);
          expect(h2?.textContent).toContain(parsed.text);
          if (parsed.number) {
            expect(h2?.textContent).toContain(parsed.number);
            expect(h2?.textContent).not.toContain('01');
          }
        });

        unmount();
      });

      it(`renders English version with LTR direction and exactly one h1 for ${page}`, () => {
        const enPage = (en.legalPages as any)[page];
        const sections: LegalSectionItem[] = Object.entries(enPage.sections).map(
          ([key, s]: [string, any]) => ({
            id: key,
            title: s.title,
            content: s.content,
          }),
        );

        const { container, unmount } = render(
          <LegalPageShell
            locale="en"
            title={enPage.title}
            subtitle={enPage.subtitle}
            sections={sections}
          />,
        );

        const rootDiv = container.firstChild as HTMLElement;
        expect(rootDiv.getAttribute('dir')).toBe('ltr');
        expect(rootDiv.getAttribute('lang')).toBe('en');
        expect(rootDiv.getAttribute('data-legal-page')).toBe('true');

        const h1Elements = container.querySelectorAll('h1');
        expect(h1Elements.length).toBe(1);
        expect(h1Elements[0].textContent).toBe(enPage.title);

        const tocNavs = screen.getAllByRole('navigation', { name: /Table of Contents/i });
        expect(tocNavs.length).toBeGreaterThanOrEqual(1);

        sections.forEach((sec) => {
          const sectionElem = container.querySelector(`section#${sec.id}`);
          expect(sectionElem).toBeInTheDocument();
          const h2 = sectionElem?.querySelector('h2');
          expect(h2).toBeInTheDocument();
          const parsed = splitSectionTitle(sec.title);
          expect(h2?.textContent).toContain(parsed.text);
          if (parsed.number) {
            expect(h2?.textContent).toContain(parsed.number);
            expect(h2?.textContent).not.toContain('01');
          }
        });

        unmount();
      });
    });
  });

  describe('Obsolete Keys Elimination in terms & privacy namespaces', () => {
    it('ensures terms namespace only contains title, agree, close', () => {
      const arTermsKeys = Object.keys(ar.terms).sort();
      const enTermsKeys = Object.keys(en.terms).sort();
      expect(arTermsKeys).toEqual(['agree', 'close', 'title']);
      expect(enTermsKeys).toEqual(['agree', 'close', 'title']);

      // Ensure no obsolete s1Title..s5Body or lastUpdated
      expect(ar.terms).not.toHaveProperty('lastUpdated');
      expect(ar.terms).not.toHaveProperty('s1Title');
      expect(en.terms).not.toHaveProperty('lastUpdated');
      expect(en.terms).not.toHaveProperty('s1Title');
    });

    it('ensures privacy namespace only contains title, agree, close', () => {
      const arPrivacyKeys = Object.keys(ar.privacy).sort();
      const enPrivacyKeys = Object.keys(en.privacy).sort();
      expect(arPrivacyKeys).toEqual(['agree', 'close', 'title']);
      expect(enPrivacyKeys).toEqual(['agree', 'close', 'title']);

      // Ensure no obsolete keys or promises
      expect(ar.privacy).not.toHaveProperty('lastUpdated');
      expect(ar.privacy).not.toHaveProperty('s1Title');
      expect(ar.privacy).not.toHaveProperty('contactTitle');
      expect(ar.privacy).not.toHaveProperty('contactBody');
      expect(en.privacy).not.toHaveProperty('lastUpdated');
      expect(en.privacy).not.toHaveProperty('s1Title');
      expect(en.privacy).not.toHaveProperty('contactTitle');
      expect(en.privacy).not.toHaveProperty('contactBody');
    });
  });

  describe('LegalSheet & Mobile Footer Integration', () => {
    it('renders LegalSheet for terms with 13 sections, renderLegalContent, and localized link', () => {
      const { container, unmount } = render(
        <LegalSheet type="terms" open={true} onClose={() => {}} />,
      );

      const link = container.querySelector('a[href="/ar/terms"]');
      expect(link).toBeInTheDocument();

      const sections = container.querySelectorAll('section');
      expect(sections.length).toBe(13);

      const contentWrappers = container.querySelectorAll('section > div.max-w-prose');
      expect(contentWrappers.length).toBe(13);

      unmount();
    });

    it('renders LegalSheet for privacy with 12 sections, renderLegalContent, and localized link', () => {
      const { container, unmount } = render(
        <LegalSheet type="privacy" open={true} onClose={() => {}} />,
      );

      const link = container.querySelector('a[href="/ar/privacy"]');
      expect(link).toBeInTheDocument();

      const sections = container.querySelectorAll('section');
      expect(sections.length).toBe(12);

      const contentWrappers = container.querySelectorAll('section > div.max-w-prose');
      expect(contentWrappers.length).toBe(12);

      unmount();
    });

    it('renders null when LegalSheet open is false', () => {
      const { container, unmount } = render(
        <LegalSheet type="terms" open={false} onClose={() => {}} />,
      );
      expect(container.firstChild).toBeNull();
      unmount();
    });

    it('renders Footer with both desktop container (hidden lg:block) and mobile legal bar (block lg:hidden)', () => {
      const { container, unmount } = render(<Footer />);

      const desktopContainer = container.querySelector('div.hidden.lg\\:block');
      expect(desktopContainer).toBeInTheDocument();

      const mobileContainer = container.querySelector('div.block.lg\\:hidden');
      expect(mobileContainer).toBeInTheDocument();

      // Mobile legal links exist
      const mobilePrivacy = mobileContainer?.querySelector('a[href="/privacy"]');
      const mobileTerms = mobileContainer?.querySelector('a[href="/terms"]');
      const mobileDelete = mobileContainer?.querySelector('a[href="/delete-account"]');
      const mobileMail = mobileContainer?.querySelector(`a[href="mailto:${LEGAL_CONFIG.supportEmail}"]`);

      expect(mobilePrivacy).toBeInTheDocument();
      expect(mobileTerms).toBeInTheDocument();
      expect(mobileDelete).toBeInTheDocument();
      expect(mobileMail).toBeInTheDocument();

      unmount();
    });
  });

  describe('Instagram Link & Single-Constant Verification', () => {
    it('defines Instagram URL in legal-config as a single constant and nowhere else in src', () => {
      expect(INSTAGRAM_URL).toBe('https://www.instagram.com/souqone.om/');
      expect(LEGAL_CONFIG.instagramUrl).toBe(INSTAGRAM_URL);

      const srcDir = path.resolve(__dirname, '..');
      const files: string[] = [];
      const walk = (dir: string) => {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
              walk(fullPath);
            }
          } else if (/\.(ts|tsx|js|json)$/.test(entry.name)) {
            files.push(fullPath);
          }
        }
      };
      walk(srcDir);

      const occurrences = files.filter((f) => {
        // Exclude test files and the single definition file itself
        if (f.endsWith('legal-config.ts') || f.includes('__tests__') || f.includes('spec.ts')) {
          return false;
        }
        const content = fs.readFileSync(f, 'utf8');
        return content.includes('https://www.instagram.com/souqone.om/');
      });

      expect(occurrences).toEqual([]);
    });

    (['ar', 'en'] as const).forEach((locale) => {
      it(`renders Instagram link in desktop and mobile footer with correct attributes in ${locale}`, () => {
        setTestLocale(locale);
        const expectedAria = locale === 'ar' ? 'تابعنا على إنستجرام' : 'Follow us on Instagram';

        const { container, unmount } = render(<Footer />);
        const links = container.querySelectorAll(`a[href="${LEGAL_CONFIG.instagramUrl}"]`);
        expect(links.length).toBeGreaterThanOrEqual(2); // desktop + mobile

        links.forEach((link) => {
          expect(link.getAttribute('target')).toBe('_blank');
          expect(link.getAttribute('rel')).toBe('noopener noreferrer');
          expect(link.getAttribute('aria-label')).toBe(expectedAria);
        });

        unmount();
      });
    });
  });

  describe('LegalSheet Parity & No-Raw-Keys Validation', () => {
    (['terms', 'privacy'] as const).forEach((type) => {
      (['ar', 'en'] as const).forEach((locale) => {
        it(`guarantees LegalSheet for ${type} in ${locale} matches legalPages sections exactly without any raw keys`, () => {
          setTestLocale(locale);
          const messages = locale === 'ar' ? ar : en;
          const expectedSections = (messages.legalPages as any)[type].sections;
          const expectedEntries = Object.entries(expectedSections);

          const { container, unmount } = render(
            <LegalSheet type={type} open={true} onClose={() => {}} />,
          );

          const renderedText = container.textContent || '';

          // 1. Must not contain any untranslated raw key strings
          expect(renderedText).not.toContain('sections.');
          expect(renderedText).not.toContain('sections.liability');
          expect(renderedText).not.toContain('sections.indemnity');
          expect(renderedText).not.toContain('sections.amendments');
          if (locale === 'ar') {
            expect(renderedText).not.toContain('liability');
            expect(renderedText).not.toContain('indemnity');
            expect(renderedText).not.toContain('amendments');
          }

          // 2. Section elements count
          const renderedSections = container.querySelectorAll('section');
          expect(renderedSections.length).toBe(expectedEntries.length);

          // 3. Every single section title and content must match in order
          expectedEntries.forEach(([, sec]: [string, any], index) => {
            const secElem = renderedSections[index];
            expect(secElem).toBeDefined();

            const h3 = secElem.querySelector('h3');
            const parsed = splitSectionTitle(sec.title);
            expect(h3?.textContent).toContain(parsed.text);
            if (parsed.number) {
              expect(h3?.textContent).toContain(parsed.number);
            }

            const firstLine = sec.content.split('\n')[0].replace(/^- /, '').trim();
            expect(secElem.textContent).toContain(firstLine);
          });

          // 4. Read full page translation key
          const expectedReadFull = (messages.legalPages as any).common.readFullPage;
          expect(renderedText).toContain(expectedReadFull);

          unmount();
        });
      });
    });
  });

  describe('Design Quality & Typography Audit (Points 1-9)', () => {
    it('enforces exact typography classes across legal components', () => {
      const pageShellContent = fs.readFileSync(
        path.resolve(__dirname, '../components/legal/LegalPageShell.tsx'),
        'utf8',
      );
      const legalSheetContent = fs.readFileSync(
        path.resolve(__dirname, '../components/legal/LegalSheet.tsx'),
        'utf8',
      );
      const legalFooterContent = fs.readFileSync(
        path.resolve(__dirname, '../components/legal/LegalFooter.tsx'),
        'utf8',
      );
      const legalTocContent = fs.readFileSync(
        path.resolve(__dirname, '../components/legal/LegalToc.tsx'),
        'utf8',
      );

      // 1. h1: 24 then 30px
      expect(pageShellContent).toContain('text-[24px] sm:text-[30px]');
      // 2. h2: 17-18px
      expect(pageShellContent).toContain('text-[17px] sm:text-[18px]');
      // 3. body: max-w-prose reading column with renderLegalContent
      expect(pageShellContent).toContain('renderLegalContent(section.content, locale)');
      expect(pageShellContent).toContain('max-w-prose');
      // 4. TOC: 13.5px and tabular-nums in LegalToc
      expect(legalTocContent).toContain('text-[13.5px]');
      expect(legalTocContent).toContain('tabular-nums');
      // 5. LegalFooter: 12.5px
      expect(legalFooterContent).toContain('text-[12.5px]');
      // 6. bdi for emails
      expect(legalFooterContent).toContain('<bdi dir="ltr">{LEGAL_CONFIG.supportEmail}</bdi>');
      // 7. LegalSheet: title 18-20, sections 15, renderLegalContent with max-w-prose
      expect(legalSheetContent).toContain('text-[18px] sm:text-[20px]');
      expect(legalSheetContent).toContain('text-[15px] font-bold');
      expect(legalSheetContent).toContain('renderLegalContent');
      expect(legalSheetContent).toContain('max-w-prose');
      // 8. Print styles
      expect(pageShellContent).toContain('print:hidden');
      expect(legalFooterContent).toContain('print:hidden');
    });
  });

  describe('Post-Review Fixes: Single Numbering, Scoped Smooth Scroll & TOC Observer State', () => {
    describe('splitSectionTitle Helper Unit Tests', () => {
      it('correctly splits numeric prefixes from titles', () => {
        expect(splitSectionTitle('1. الجهة المشغلة للمنصة')).toEqual({
          number: '1',
          text: 'الجهة المشغلة للمنصة',
        });
        expect(splitSectionTitle('12. القانون الواجب التطبيق')).toEqual({
          number: '12',
          text: 'القانون الواجب التطبيق',
        });
        expect(splitSectionTitle('4. Google User Data')).toEqual({
          number: '4',
          text: 'Google User Data',
        });
        expect(splitSectionTitle('عنوان بدون ترقيم')).toEqual({
          text: 'عنوان بدون ترقيم',
        });
        expect(splitSectionTitle('')).toEqual({
          text: '',
        });
      });
    });

    describe('Source Code Invariants: No padStart, No 01, No truncate', () => {
      it('ensures LegalPageShell and LegalToc do not use padStart or hardcoded 01', () => {
        const shellCode = fs.readFileSync(
          path.resolve(__dirname, '../components/legal/LegalPageShell.tsx'),
          'utf8',
        );
        const tocCode = fs.readFileSync(
          path.resolve(__dirname, '../components/legal/LegalToc.tsx'),
          'utf8',
        );

        expect(shellCode).not.toContain('padStart');
        expect(shellCode).not.toContain("'01'");
        expect(shellCode).not.toContain('"01"');
        expect(shellCode).toContain('data-legal-page="true"');
        expect(shellCode).not.toContain('scroll-smooth');

        expect(tocCode).not.toContain('padStart');
        expect(tocCode).not.toContain("'01'");
        expect(tocCode).not.toContain('"01"');
        expect(tocCode).not.toContain('truncate');
        expect(tocCode).toContain('items-start');
        expect(tocCode).toContain('leading-snug');
      });

      it('verifies globals.css scopes smooth scrolling to data-legal-page and avoids unlayered Material Symbols', () => {
        const cssCode = fs.readFileSync(
          path.resolve(__dirname, '../app/globals.css'),
          'utf8',
        );

        // Smooth scrolling must be scoped to data-legal-page
        expect(cssCode).toContain('html:has([data-legal-page])');
        expect(cssCode).not.toMatch(/html\s*\{\s*scroll-behavior:\s*smooth;\s*\}/);

        // Material Symbols must be defined in @layer base
        expect(cssCode).toMatch(/@layer\s+base\s*\{[\s\S]*\.material-symbols-outlined\s*\{[\s\S]*display:\s*inline-block/);
      });
    });

    describe('Render Audit: Single Numbering in Headings and TOC', () => {
      const locales = ['ar', 'en'] as const;

      locales.forEach((locale) => {
        pages.forEach((page) => {
          it(`guarantees number appears exactly once per section title and TOC item for ${page} in ${locale}`, () => {
            const pageData = (locale === 'ar' ? ar : en).legalPages[page];
            const sections: LegalSectionItem[] = Object.entries(pageData.sections).map(
              ([key, s]: [string, any]) => ({
                id: key,
                title: s.title,
                content: s.content,
              }),
            );

            const { container, unmount } = render(
              <LegalPageShell
                locale={locale}
                title={pageData.title}
                subtitle={pageData.subtitle}
                sections={sections}
              />,
            );

            // 1. Verify h2 section titles have single numbering
            sections.forEach((sec) => {
              const parsed = splitSectionTitle(sec.title);
              const sectionElem = container.querySelector(`section#${sec.id}`);
              const h2 = sectionElem?.querySelector('h2');
              expect(h2).toBeInTheDocument();

              if (parsed.number) {
                // Number must appear in the tabular-nums span
                const numberSpan = h2?.querySelector('span.tabular-nums');
                expect(numberSpan).toBeInTheDocument();
                expect(numberSpan?.textContent?.trim()).toBe(parsed.number);

                // No double number in the text part
                const textSpan = h2?.querySelector('span.leading-snug');
                expect(textSpan?.textContent?.trim()).toBe(parsed.text.trim());
                expect(textSpan?.textContent?.trim().startsWith(`${parsed.number}.`)).toBe(false);
              }
            });

            // 2. Verify TOC links have single numbering and no truncate
            const tocLinks = container.querySelectorAll('aside nav a, aside details a');
            expect(tocLinks.length).toBeGreaterThanOrEqual(sections.length);

            tocLinks.forEach((link) => {
              // Ensure no truncate class in any child
              expect(link.querySelector('.truncate')).toBeNull();
              expect(link.className).toContain('items-start');

              const textSpan = link.querySelector('span.leading-snug');
              expect(textSpan).toBeInTheDocument();
            });

            unmount();
          });
        });
      });
    });

    describe('LegalToc IntersectionObserver State Retention (CodeRabbit id 4307679682)', () => {
      it('retains previous intersecting section across partial callbacks and avoids premature jump', () => {
        const testSections = [
          { id: 'sec1', title: '1. القسم الأول' },
          { id: 'sec2', title: '2. القسم الثاني' },
          { id: 'sec3', title: '3. القسم الثالث' },
        ];

        // Create DOM elements for sections in document
        const elements: HTMLElement[] = [];
        testSections.forEach((s) => {
          const el = document.createElement('div');
          el.id = s.id;
          document.body.appendChild(el);
          elements.push(el);
        });

        let observerCallback: (entries: Partial<IntersectionObserverEntry>[]) => void = () => {};
        const disconnectMock = vi.fn();
        const observeMock = vi.fn();

        class MockIntersectionObserver {
          constructor(cb: any) {
            observerCallback = cb;
          }
          observe = observeMock;
          disconnect = disconnectMock;
          unobserve = vi.fn();
        }

        const originalIntersectionObserver = window.IntersectionObserver;
        window.IntersectionObserver = MockIntersectionObserver as any;

        const { container, unmount } = render(<LegalToc sections={testSections} locale="ar" />);

        // Helper to get active link id from desktop nav
        const getActiveLinkId = () => {
          const activeLink = container.querySelector('nav[aria-label="فهرس الأقسام"] a[aria-current="location"]');
          return activeLink?.getAttribute('href')?.replace('#', '');
        };

        // Initially activeId is sec1 (default fallback)
        expect(getActiveLinkId()).toBe('sec1');

        // Callback 1: sec1 starts intersecting
        act(() => {
          observerCallback([
            { target: elements[0], isIntersecting: true },
          ]);
        });
        expect(getActiveLinkId()).toBe('sec1');

        // Callback 2: sec2 crosses threshold, callback reports ONLY sec2 (sec1 unchanged)
        // With state retention via useRef<Set>, sec1 is still intersecting and comes first in document order
        act(() => {
          observerCallback([
            { target: elements[1], isIntersecting: true },
          ]);
        });
        expect(getActiveLinkId()).toBe('sec1');

        // Callback 3: sec1 stops intersecting
        act(() => {
          observerCallback([
            { target: elements[0], isIntersecting: false },
          ]);
        });
        // Now sec2 is the topmost intersecting section
        expect(getActiveLinkId()).toBe('sec2');

        // Cleanup
        unmount();
        elements.forEach((el) => el.remove());
        window.IntersectionObserver = originalIntersectionObserver;
      });
    });
  });
});
