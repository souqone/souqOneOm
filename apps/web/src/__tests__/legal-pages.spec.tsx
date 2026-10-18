import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LegalPageShell, LegalSectionItem } from '../components/legal/LegalPageShell';
import { LEGAL_CONFIG } from '../lib/legal-config';
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
        expect(arKeys.length).toBeGreaterThanOrEqual(7);

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

        // Table of contents navigation exists
        const tocNav = screen.getByRole('navigation', { name: /فهرس الأقسام/i });
        expect(tocNav).toBeInTheDocument();

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

        const tocNav = screen.getByRole('navigation', { name: /Table of Contents/i });
        expect(tocNav).toBeInTheDocument();

        unmount();
      });
    });
  });
});
