import React from 'react';
import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LegalPageShell, LegalSectionItem } from '../components/legal/LegalPageShell';
import { LegalFooter } from '../components/legal/LegalFooter';
import { LegalSheet } from '../components/legal/LegalSheet';
import { Footer } from '../components/layout/footer';
import { LEGAL_CONFIG } from '../lib/legal-config';
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
          expect(h2?.textContent).toContain(sec.title);
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

        const h1Elements = container.querySelectorAll('h1');
        expect(h1Elements.length).toBe(1);
        expect(h1Elements[0].textContent).toBe(enPage.title);

        const tocNavs = screen.getAllByRole('navigation', { name: /Table of Contents/i });
        expect(tocNavs.length).toBeGreaterThanOrEqual(1);

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
    it('renders LegalSheet for terms with 13 sections, whitespace-pre-line, and localized link', () => {
      const { container, unmount } = render(
        <LegalSheet type="terms" open={true} onClose={() => {}} />,
      );

      const link = container.querySelector('a[href="/ar/terms"]');
      expect(link).toBeInTheDocument();

      const sections = container.querySelectorAll('section');
      expect(sections.length).toBe(13);

      const contentParagraphs = container.querySelectorAll('p.whitespace-pre-line');
      expect(contentParagraphs.length).toBe(13);

      unmount();
    });

    it('renders LegalSheet for privacy with 12 sections, whitespace-pre-line, and localized link', () => {
      const { container, unmount } = render(
        <LegalSheet type="privacy" open={true} onClose={() => {}} />,
      );

      const link = container.querySelector('a[href="/ar/privacy"]');
      expect(link).toBeInTheDocument();

      const sections = container.querySelectorAll('section');
      expect(sections.length).toBe(12);

      const contentParagraphs = container.querySelectorAll('p.whitespace-pre-line');
      expect(contentParagraphs.length).toBe(12);

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
});
