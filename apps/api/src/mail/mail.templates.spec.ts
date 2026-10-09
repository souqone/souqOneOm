import {
  buildVerificationEmail,
  buildPasswordResetEmail,
  BRAND_LOGO_URL,
} from './mail.templates';
import { VERIFICATION_CODE_TTL_MINUTES } from '../auth/auth.constants';

describe('mail.templates', () => {
  const emojiRegex = /\p{Extended_Pictographic}/u;
  const sampleCode = '849201';

  // Minimal inline-style DOM resolver for WCAG AA compliance verification
  function hexToRgb(hex: string): [number, number, number] {
    let cleaned = hex.trim().replace(/^#/, '');
    if (cleaned.length === 3) {
      cleaned = cleaned.split('').map((c) => c + c).join('');
    }
    const num = parseInt(cleaned, 16);
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
  }

  function parseColor(str?: string | null): [number, number, number] | null {
    if (!str) return null;
    const s = str.trim().toLowerCase();
    if (s === 'transparent' || s === 'inherit' || s === 'initial') return null;
    if (s.startsWith('#')) return hexToRgb(s);
    const rgbMatch = s.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (rgbMatch) {
      return [parseInt(rgbMatch[1], 10), parseInt(rgbMatch[2], 10), parseInt(rgbMatch[3], 10)];
    }
    if (s === 'white') return [255, 255, 255];
    if (s === 'black') return [0, 0, 0];
    return null;
  }

  function relativeLuminance([r, g, b]: [number, number, number]): number {
    const [rs, gs, bs] = [r, g, b].map((c) => {
      const s = c / 255;
      return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  function contrastRatio(fg: [number, number, number], bg: [number, number, number]): number {
    const l1 = relativeLuminance(fg);
    const l2 = relativeLuminance(bg);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  interface StackElement {
    tag: string;
    style: string;
    color: [number, number, number] | null;
    bgColor: [number, number, number] | null;
    fontSizePx: number | null;
    isBold: boolean;
    isHidden: boolean;
    id?: string;
  }

  function extractVisibleTextElements(html: string) {
    const results: {
      text: string;
      fg: [number, number, number];
      bg: [number, number, number];
      fontSizePx: number;
      isBold: boolean;
      isLarge: boolean;
      ratio: number;
      requiredRatio: number;
    }[] = [];

    const stack: StackElement[] = [];
    const tokenRegex = /(<!--[\s\S]*?-->)|(<style[\s\S]*?<\/style>)|(<script[\s\S]*?<\/script>)|(<\/?[a-zA-Z0-9]+[^>]*>)|([^<]+)/gi;

    let match: RegExpExecArray | null;
    while ((match = tokenRegex.exec(html)) !== null) {
      const [full, comment, styleTag, scriptTag, tag, text] = match;
      if (comment || styleTag || scriptTag) continue;

      if (tag) {
        if (tag.startsWith('</')) {
          stack.pop();
        } else {
          const isSelfClosing = tag.endsWith('/>') || /^<(img|meta|link|br|hr|input)/i.test(tag);
          const tagNameMatch = tag.match(/^<([a-zA-Z0-9]+)/i);
          const tagName = tagNameMatch ? tagNameMatch[1].toLowerCase() : '';
          const styleMatch = tag.match(/style=["']([^"']*)["']/i);
          const style = styleMatch ? styleMatch[1] : '';
          const idMatch = tag.match(/id=["']([^"']*)["']/i);
          const id = idMatch ? idMatch[1] : undefined;
          const bgAttrMatch = tag.match(/bgcolor=["']([^"']*)["']/i);

          const colorMatch = style.match(/(?:^|;)\s*(?<!background-)color\s*:\s*([^;]+)/i);
          const bgColorMatch = style.match(/(?:^|;)\s*background(?:-color)?\s*:\s*([^;]+)/i);
          const fontSizeMatch = style.match(/(?:^|;)\s*font-size\s*:\s*([\d.]+)px/i);
          const fontWeightMatch = style.match(/(?:^|;)\s*font-weight\s*:\s*([^;]+)/i);

          const color = colorMatch ? parseColor(colorMatch[1]) : null;
          const bgColor = bgColorMatch
            ? parseColor(bgColorMatch[1])
            : bgAttrMatch
              ? parseColor(bgAttrMatch[1])
              : null;
          const fontSizePx = fontSizeMatch ? parseFloat(fontSizeMatch[1]) : null;

          const isBold =
            ['h1', 'h2', 'h3', 'strong', 'b', 'th'].includes(tagName) ||
            fontWeightMatch?.[1].toLowerCase().includes('bold') === true ||
            (fontWeightMatch ? parseInt(fontWeightMatch[1], 10) >= 700 : false);

          const isHidden =
            tagName === 'head' ||
            tagName === 'title' ||
            style.includes('display: none') ||
            style.includes('display:none') ||
            style.includes('visibility: hidden') ||
            style.includes('opacity: 0') ||
            stack.some((parent) => parent.isHidden);

          const el: StackElement = {
            tag: tagName,
            style,
            color,
            bgColor,
            fontSizePx,
            isBold,
            isHidden,
            id,
          };

          if (!isSelfClosing) {
            stack.push(el);
          }
        }
      } else if (text) {
        const cleanText = text.replace(/&nbsp;|&zwnj;/g, ' ').replace(/\s+/g, ' ').trim();
        if (cleanText.length > 0 && !stack.some((el) => el.isHidden)) {
          // Resolve effective foreground color (nearest up stack)
          let fg: [number, number, number] | null = null;
          for (let i = stack.length - 1; i >= 0; i--) {
            if (stack[i].color) {
              fg = stack[i].color;
              break;
            }
          }
          if (!fg) fg = [0, 0, 0];

          // Resolve effective background color (nearest up stack)
          let bg: [number, number, number] | null = null;
          for (let i = stack.length - 1; i >= 0; i--) {
            if (stack[i].bgColor) {
              bg = stack[i].bgColor;
              break;
            }
          }
          if (!bg) bg = [255, 255, 255]; // Default white page canvas

          // Resolve effective font size
          let fontSizePx = 16;
          for (let i = stack.length - 1; i >= 0; i--) {
            if (stack[i].fontSizePx !== null) {
              fontSizePx = stack[i].fontSizePx!;
              break;
            }
          }

          // Resolve bold status
          const isBold = stack.some((el) => el.isBold);
          const isLarge = fontSizePx >= 24 || (fontSizePx >= 18.66 && isBold);
          const ratio = contrastRatio(fg, bg);
          const requiredRatio = isLarge ? 3.0 : 4.5;

          results.push({
            text: cleanText,
            fg,
            bg,
            fontSizePx,
            isBold,
            isLarge,
            ratio: Math.round(ratio * 100) / 100,
            requiredRatio,
          });
        }
      }
    }

    return results;
  }

  describe.each([
    {
      name: 'buildVerificationEmail',
      builder: buildVerificationEmail,
      expectedSubject: 'رمز التحقق من البريد الإلكتروني — سوق ون',
    },
    {
      name: 'buildPasswordResetEmail',
      builder: buildPasswordResetEmail,
      expectedSubject: 'طلب استعادة كلمة المرور — سوق ون',
    },
  ])('$name', ({ builder, expectedSubject }) => {
    it('should generate valid subject, html, and text with code and TTL', () => {
      const result = builder({ code: sampleCode });

      // Subject
      expect(result.subject).toBe(expectedSubject);
      expect(result.subject).toContain('سوق ون');
      expect(result.subject).not.toContain('سوق وان');

      // HTML assertions
      expect(result.html).toContain(sampleCode);
      expect(result.html).toContain(VERIFICATION_CODE_TTL_MINUTES.toString());
      expect(result.html).toContain('dir="rtl"');
      expect(result.html).toContain('lang="ar"');
      expect(result.html).toContain(BRAND_LOGO_URL);

      // Brand spelling
      expect(result.html).toContain('سوق ون');
      expect(result.html).not.toContain('سوق وان');
      expect(result.text).toContain('سوق ون');
      expect(result.text).not.toContain('سوق وان');

      // No emojis in HTML or text
      expect(emojiRegex.test(result.html)).toBe(false);
      expect(emojiRegex.test(result.text)).toBe(false);

      // The only http(s) URL in HTML is the logo URL
      const urls = result.html.match(/https?:\/\/[^\s"'<>]+/g) || [];
      expect(urls).toEqual([BRAND_LOGO_URL]);

      // No script tags
      expect(result.html).not.toMatch(/<script/i);

      // No style blocks in body (pure inline CSS on content elements)
      const bodyContent = result.html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] || '';
      expect(bodyContent).not.toMatch(/<style/i);

      // Only one <img> tag and it is the logo
      const imgs = result.html.match(/<img[^>]*>/gi) || [];
      expect(imgs).toHaveLength(1);
      expect(imgs[0]).toContain(BRAND_LOGO_URL);

      // Text version assertions
      expect(result.text).toContain(sampleCode);
      expect(result.text).toContain(VERIFICATION_CODE_TTL_MINUTES.toString());

      // Logo URL points to official flat email logo
      expect(BRAND_LOGO_URL).toBe(
        'https://res.cloudinary.com/souqone/image/upload/brand/logo-email.png',
      );
      expect(result.html).toContain(BRAND_LOGO_URL);

      // #009CB5 is preserved for borders and lines, never as text color
      expect(result.html).not.toMatch(/(?<!background-)color\s*:\s*#009CB5/i);

      // OTP digits element has official brand navy text color #11232E
      expect(result.html).toMatch(/id="otp-box"[^>]*color:\s*#11232E/i);
    });

    it('should meet WCAG AA contrast thresholds for all real text elements in the generated HTML', () => {
      const result = builder({ code: sampleCode });
      const elements = extractVisibleTextElements(result.html);

      expect(elements.length).toBeGreaterThan(0);

      for (const el of elements) {
        expect(el.ratio).toBeGreaterThanOrEqual(el.requiredRatio);
      }
    });

    it('should throw when code is not 6 digits', () => {
      expect(() => builder({ code: 'abc123' })).toThrow();
      expect(() => builder({ code: '12345' })).toThrow();
      expect(() => builder({ code: '1234567' })).toThrow();
      expect(() => builder({ code: '<script>123456</script>' })).toThrow();
      expect(() => builder({ code: '' })).toThrow();
    });
  });
});
