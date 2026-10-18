import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LegalPageShell, LegalSectionItem } from '../components/legal/LegalPageShell';
import { LegalFooter } from '../components/legal/LegalFooter';
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
});
