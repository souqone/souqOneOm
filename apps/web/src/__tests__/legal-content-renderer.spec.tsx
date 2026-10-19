import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { renderLegalContent } from '../components/legal/renderLegalContent';
import ar from '../messages/ar.json';
import en from '../messages/en.json';

describe('renderLegalContent pure function unit tests', () => {
  it('renders a normal plain paragraph without any lists', () => {
    const text = 'هذه فقرة قانونية عادية لا تحتوي على أي بنود أو قوائم.';
    const { container } = render(<div>{renderLegalContent(text, 'ar')}</div>);

    const paragraphs = container.querySelectorAll('p');
    expect(paragraphs.length).toBe(1);
    expect(paragraphs[0].textContent).toBe(text);
    expect(paragraphs[0].className).toContain('leading-[1.85]');

    expect(container.querySelectorAll('ul').length).toBe(0);
    expect(container.querySelectorAll('li').length).toBe(0);
  });

  it('renders an intro line ending with colon followed by bullet list items', () => {
    const text = 'تشمل البيانات المجمعة ما يلي:\n- بند أول: بيانات الحساب\n- بند ثاني: بيانات الإعلانات';
    const { container } = render(<div>{renderLegalContent(text, 'ar')}</div>);

    const paragraphs = container.querySelectorAll('p');
    expect(paragraphs.length).toBe(1);
    expect(paragraphs[0].textContent).toBe('تشمل البيانات المجمعة ما يلي:');

    const uls = container.querySelectorAll('ul');
    expect(uls.length).toBe(1);
    expect(uls[0].className).toContain('list-disc');
    expect(uls[0].className).toContain('marker:text-primary');
    expect(uls[0].className).toContain('ps-5');

    const lis = container.querySelectorAll('li');
    expect(lis.length).toBe(2);
    expect(lis[0].textContent).toBe('بند أول: بيانات الحساب');
    expect(lis[1].textContent).toBe('بند ثاني: بيانات الإعلانات');
  });

  it('renders two consecutive lists separated by an empty line as two distinct <ul> elements', () => {
    const text = '- قائمة أ بند 1\n- قائمة أ بند 2\n\n- قائمة ب بند 1\n- قائمة ب بند 2';
    const { container } = render(<div>{renderLegalContent(text, 'ar')}</div>);

    const uls = container.querySelectorAll('ul');
    expect(uls.length).toBe(2);

    const lis = container.querySelectorAll('li');
    expect(lis.length).toBe(4);
    expect(lis[0].textContent).toBe('قائمة أ بند 1');
    expect(lis[1].textContent).toBe('قائمة أ بند 2');
    expect(lis[2].textContent).toBe('قائمة ب بند 1');
    expect(lis[3].textContent).toBe('قائمة ب بند 2');
  });

  it('transforms email inside an Arabic sentence ending with a dot into <a href="mailto:..."> with <bdi dir="ltr"> and preserves the dot outside the link', () => {
    const text = 'يسعدنا تواصلك مع فريق الدعم الفني عبر البريد الإلكتروني: support@souqoneom.com.';
    const { container } = render(<div>{renderLegalContent(text, 'ar')}</div>);

    const mailtoLink = container.querySelector('a[href="mailto:support@souqoneom.com"]');
    expect(mailtoLink).toBeInTheDocument();
    expect(mailtoLink?.className).toContain('text-primary');
    expect(mailtoLink?.className).toContain('hover:underline');
    expect(mailtoLink?.className).toContain('focus-visible:ring-2');

    // Email link text must not contain the trailing dot
    expect(mailtoLink?.textContent).toBe('support@souqoneom.com');

    // Contains <bdi dir="ltr">
    const bdi = mailtoLink?.querySelector('bdi');
    expect(bdi).toBeInTheDocument();
    expect(bdi?.getAttribute('dir')).toBe('ltr');
    expect(bdi?.textContent).toBe('support@souqoneom.com');

    // The whole paragraph ends with the dot after the link
    const paragraph = container.querySelector('p');
    expect(paragraph?.textContent?.endsWith('.')).toBe(true);
  });

  it('transforms https:// URLs into external links with rel="noopener noreferrer" and target="_blank"', () => {
    const text = 'يرجى مراجعة صفحة الشروط عبر الرابط https://souqoneom.com/terms للحصول على التفاصيل.';
    const { container } = render(<div>{renderLegalContent(text, 'en')}</div>);

    const urlLink = container.querySelector('a[href="https://souqoneom.com/terms"]');
    expect(urlLink).toBeInTheDocument();
    expect(urlLink?.getAttribute('target')).toBe('_blank');
    expect(urlLink?.getAttribute('rel')).toBe('noopener noreferrer');
    expect(urlLink?.className).toContain('text-primary');

    const bdi = urlLink?.querySelector('bdi');
    expect(bdi).toBeInTheDocument();
    expect(bdi?.getAttribute('dir')).toBe('ltr');
    expect(bdi?.textContent).toBe('https://souqoneom.com/terms');
  });

  it('returns null for empty strings or strings containing only whitespace', () => {
    const { container: emptyContainer } = render(<div>{renderLegalContent('', 'ar')}</div>);
    expect(emptyContainer.firstChild?.childNodes.length).toBe(0);

    const { container: wsContainer } = render(<div>{renderLegalContent('   \n\t  ', 'ar')}</div>);
    expect(wsContainer.firstChild?.childNodes.length).toBe(0);
  });

  it('ensures lines not starting with "- " do NOT get converted to <li> elements', () => {
    const text = 'سطر أول عادي\n* نجمة ليست قائمة\n1. ترقيم رقمي ليس قائمة داش\n-بدون مسافة ليست قائمة';
    const { container } = render(<div>{renderLegalContent(text, 'ar')}</div>);

    expect(container.querySelectorAll('li').length).toBe(0);
    expect(container.querySelectorAll('ul').length).toBe(0);

    const paragraphs = container.querySelectorAll('p');
    expect(paragraphs.length).toBe(4);
  });

  it('applies relaxed line-height of 1.85 for Arabic and 1.75 for English', () => {
    const arText = 'نص عربي قانوني للاختبار.';
    const { container: arContainer } = render(<div>{renderLegalContent(arText, 'ar')}</div>);
    expect(arContainer.querySelector('p')?.className).toContain('leading-[1.85]');

    const enText = 'English legal text for testing.';
    const { container: enContainer } = render(<div>{renderLegalContent(enText, 'en')}</div>);
    expect(enContainer.querySelector('p')?.className).toContain('leading-[1.75]');
  });

  describe('Real translations audit (Exact count: 35 privacy / 7 terms / 13 deleteAccount in ar and en)', () => {
    const translations = [
      { lang: 'ar', messages: ar },
      { lang: 'en', messages: en },
    ] as const;

    translations.forEach(({ lang, messages }) => {
      it(`verifies privacy in ${lang} renders exactly 35 <li> elements and no raw "- " marks`, () => {
        let totalLi = 0;
        const sections = messages.legalPages.privacy.sections as Record<string, { content: string }>;

        for (const section of Object.values(sections)) {
          const { container } = render(<div>{renderLegalContent(section.content, lang)}</div>);
          const lis = container.querySelectorAll('li');
          totalLi += lis.length;

          // Check that no raw "- " starts in paragraph text
          const paragraphs = container.querySelectorAll('p');
          paragraphs.forEach((p) => {
            expect(p.textContent?.trim().startsWith('- ')).toBe(false);
          });
        }

        expect(totalLi).toBe(35);
      });

      it(`verifies terms in ${lang} renders exactly 7 <li> elements and no raw "- " marks`, () => {
        let totalLi = 0;
        const sections = messages.legalPages.terms.sections as Record<string, { content: string }>;

        for (const section of Object.values(sections)) {
          const { container } = render(<div>{renderLegalContent(section.content, lang)}</div>);
          const lis = container.querySelectorAll('li');
          totalLi += lis.length;

          const paragraphs = container.querySelectorAll('p');
          paragraphs.forEach((p) => {
            expect(p.textContent?.trim().startsWith('- ')).toBe(false);
          });
        }

        expect(totalLi).toBe(7);
      });

      it(`verifies deleteAccount in ${lang} renders exactly 21 <li> elements and no raw "- " marks`, () => {
        let totalLi = 0;
        const sections = messages.legalPages.deleteAccount.sections as Record<string, { content: string }>;

        for (const section of Object.values(sections)) {
          const { container } = render(<div>{renderLegalContent(section.content, lang)}</div>);
          const lis = container.querySelectorAll('li');
          totalLi += lis.length;

          const paragraphs = container.querySelectorAll('p');
          paragraphs.forEach((p) => {
            expect(p.textContent?.trim().startsWith('- ')).toBe(false);
          });
        }

        expect(totalLi).toBe(21);
      });
    });
  });
});
