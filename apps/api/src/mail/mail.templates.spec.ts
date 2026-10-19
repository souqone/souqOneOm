import {
  buildVerificationEmail,
  buildPasswordResetEmail,
  buildDeletionRequestEmail,
  buildDeletionCancelledEmail,
  buildFinalDeletionEmail,
  buildPasswordChangedEmail,
  buildWelcomeEmail,
  buildAccountSuspendedEmail,
  buildAccountBannedEmail,
  formatOmanDate,
  BRAND_LOGO_URL,
  BRAND_NAME,
} from './mail.templates';
import { VERIFICATION_CODE_TTL_MINUTES } from '../auth/auth.constants';

describe('mail.templates', () => {
  const emojiRegex = /\p{Extended_Pictographic}/u;
  const sampleCode = '849201';

  function hexToRgb(hex: string): [number, number, number] {
    let cleaned = hex.trim().replace(/^#/, '');
    if (cleaned.length === 3) {
      cleaned = cleaned.split('').map((c) => c + c).join('');
    }
    const num = parseInt(cleaned, 16);
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
  }

  function rgbToHex([r, g, b]: [number, number, number]): string {
    return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0').toUpperCase()).join('');
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

  function extractAttribute(tag: string, attrName: string): string | undefined {
    const regex = new RegExp(`\\s${attrName}=(?:"([^"]*)"|'([^']*)')`, 'i');
    const m = tag.match(regex);
    if (!m) return undefined;
    return m[1] !== undefined ? m[1] : m[2];
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

  interface ResolvedTextElement {
    text: string;
    tag: string;
    id?: string;
    fg: [number, number, number];
    fgHex: string;
    fgExplicit: boolean;
    bg: [number, number, number];
    bgHex: string;
    fontSizePx: number;
    isBold: boolean;
    isLarge: boolean;
    ratio: number;
    requiredRatio: number;
  }

  function extractVisibleTextElements(html: string): ResolvedTextElement[] {
    const results: ResolvedTextElement[] = [];
    const stack: StackElement[] = [];
    const tokenRegex = /(<!--[\s\S]*?-->)|(<![^>]*>)|(<style[\s\S]*?<\/style>)|(<script[\s\S]*?<\/script>)|(<\/?[a-zA-Z0-9]+[^>]*>)|([^<]+)/gi;

    let match: RegExpExecArray | null;
    while ((match = tokenRegex.exec(html)) !== null) {
      const [full, comment, doctype, styleTag, scriptTag, tag, text] = match;
      if (comment || doctype || styleTag || scriptTag) continue;

      if (tag) {
        if (tag.startsWith('</')) {
          stack.pop();
        } else {
          const isSelfClosing = tag.endsWith('/>') || /^<(img|meta|link|br|hr|input)/i.test(tag);
          const tagNameMatch = tag.match(/^<([a-zA-Z0-9]+)/i);
          const tagName = tagNameMatch ? tagNameMatch[1].toLowerCase() : '';

          const style = extractAttribute(tag, 'style') || '';
          const id = extractAttribute(tag, 'id');
          const bgcolor = extractAttribute(tag, 'bgcolor');

          const colorMatch = style.match(/(?:^|;)\s*(?<!background-)color\s*:\s*([^;]+)/i);
          const bgColorMatch = style.match(/(?:^|;)\s*background(?:-color)?\s*:\s*([^;]+)/i);
          const fontSizeMatch = style.match(/(?:^|;)\s*font-size\s*:\s*([\d.]+)px/i);
          const fontWeightMatch = style.match(/(?:^|;)\s*font-weight\s*:\s*([^;]+)/i);

          const color = colorMatch ? parseColor(colorMatch[1]) : null;
          const bgColor = bgColorMatch
            ? parseColor(bgColorMatch[1])
            : bgcolor
              ? parseColor(bgcolor)
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
          let fgExplicit = false;
          for (let i = stack.length - 1; i >= 0; i--) {
            if (stack[i].color) {
              fg = stack[i].color;
              fgExplicit = true;
              break;
            }
          }
          if (!fg) {
            fg = [0, 0, 0];
            fgExplicit = false;
          }

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

          const currentElement = stack[stack.length - 1];

          results.push({
            text: cleanText,
            tag: currentElement ? currentElement.tag : '',
            id: currentElement ? currentElement.id : undefined,
            fg,
            fgHex: rgbToHex(fg),
            fgExplicit,
            bg,
            bgHex: rgbToHex(bg),
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
      expectedSubject: 'رمز التحقق من البريد الإلكتروني — SouqOne',
      expectedPreheader: `أكد بريدكم الإلكتروني في SouqOne. ينتهي الرمز خلال ${VERIFICATION_CODE_TTL_MINUTES} دقيقة.`,
      expectedBodySentence: 'نرحب بانضمامكم إلى منصة <bdi dir="ltr">SouqOne</bdi>. يرجى استخدام رمز التحقق التالي لتأكيد بريدكم الإلكتروني وإتمام إنشاء الحساب:',
    },
    {
      name: 'buildPasswordResetEmail',
      builder: buildPasswordResetEmail,
      expectedSubject: 'طلب استعادة كلمة المرور — SouqOne',
      expectedPreheader: `تلقينا طلباً لإعادة تعيين كلمة المرور. ينتهي الرمز خلال ${VERIFICATION_CODE_TTL_MINUTES} دقيقة.`,
      expectedBodySentence: 'تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابكم في <bdi dir="ltr">SouqOne</bdi>. يرجى إدخال الرمز التالي في التطبيق للمتابعة:',
    },
  ])('$name', ({ name, builder, expectedSubject, expectedPreheader, expectedBodySentence }) => {
    it('should generate valid subject, html, and text with code and TTL', () => {
      const result = builder({ code: sampleCode });

      // Subject
      expect(result.subject).toBe(expectedSubject);
      expect(result.subject).toContain('SouqOne');
      expect(result.subject).not.toContain('سوق ون');
      expect(result.subject).not.toContain('سوق وان');
      expect(BRAND_NAME).toBe('SouqOne');

      // <title> equals the subject
      expect(result.html.match(/<title>([^<]*)<\/title>/)?.[1]).toBe(result.subject);

      // Plain-text first line is identical to the subject
      expect(result.text.split('\n')[0]).toBe(result.subject);

      // HTML assertions
      expect(result.html).toContain(sampleCode);
      expect(result.html).toContain(VERIFICATION_CODE_TTL_MINUTES.toString());
      expect(result.html).toContain('dir="rtl"');
      expect(result.html).toContain('lang="ar"');
      expect(result.html).toContain(BRAND_LOGO_URL);

      // Brand name: English only, never the Arabic spellings
      expect(result.html).toContain('SouqOne');
      expect(result.text).toContain('SouqOne');
      expect(result.html).not.toContain('سوق ون');
      expect(result.html).not.toContain('سوق وان');
      expect(result.text).not.toContain('سوق ون');
      expect(result.text).not.toContain('سوق وان');
      expect(result.html).toContain('<bdi dir="ltr">SouqOne</bdi>');

      // Exact body sentence (HTML wraps the brand in bdi, text does not)
      expect(result.html).toContain(expectedBodySentence);
      expect(result.text).toContain(expectedBodySentence.replace('<bdi dir="ltr">SouqOne</bdi>', 'SouqOne'));

      // Copyright sign is never used
      expect(result.html).not.toContain('©');
      expect(result.text).not.toContain('©');

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

      // Logo URL points to the transparent brand logo
      expect(BRAND_LOGO_URL).toBe(
        'https://res.cloudinary.com/souqone/image/upload/brand/logo.png',
      );
      expect(result.html).toContain(BRAND_LOGO_URL);

      // Logo alt text is exactly the English brand
      expect(extractAttribute(imgs[0], 'alt')).toBe('SouqOne');
      expect(extractAttribute(imgs[0], 'id')).toBe('brand-logo');

      // #009CB5 is preserved for borders and lines, never as text color
      expect(result.html).not.toMatch(/(?<!background-)color\s*:\s*#009CB5/i);

      // OTP digits element has official brand navy text color #11232E
      expect(result.html).toMatch(/id="otp-box"[^>]*color:\s*#11232E/i);
    });

    it('should meet WCAG AA contrast thresholds and verify explicit styling on all real text elements', () => {
      const result = builder({ code: sampleCode });
      const elements = extractVisibleTextElements(result.html);

      expect(elements.length).toBeGreaterThan(0);

      // Every visible text element must have an explicit foreground color
      for (const el of elements) {
        expect(el.fgExplicit).toBe(true);
        expect(el.ratio).toBeGreaterThanOrEqual(el.requiredRatio);
      }

      // Guard assertion 1: 6-digit code entry
      const codeEntry = elements.find((e) => e.text === sampleCode);
      expect(codeEntry).toBeDefined();
      expect(codeEntry!.fgHex).toBe('#11232E');
      expect(codeEntry!.fontSizePx).toBe(34);
      expect(codeEntry!.isBold).toBe(true);
      expect(codeEntry!.isLarge).toBe(true);
      expect(codeEntry!.ratio).toBeGreaterThanOrEqual(3.0);

      // Guard assertion 2: H1 entry
      const h1Entry = elements.find((e) => e.tag === 'h1' || e.id === 'mail-heading');
      expect(h1Entry).toBeDefined();
      expect(h1Entry!.fgHex).toBe('#11232E');
      expect(h1Entry!.fontSizePx).toBe(20);
      expect(h1Entry!.isBold).toBe(true);

      // Guard assertion 3: Support-email link entry
      const supportEntry = elements.find((e) => e.text.includes('support@souqoneom.com'));
      expect(supportEntry).toBeDefined();
      expect(supportEntry!.fgHex).toBe('#007A8F');
      expect(supportEntry!.fontSizePx).toBe(12);

      // Guard assertion 4: Copyright notice entry
      const copyrightEntry = elements.find((e) => e.text.includes('جميع الحقوق محفوظة'));
      expect(copyrightEntry).toBeDefined();
      expect(copyrightEntry!.fgHex).toBe('#6B7280');
      expect(copyrightEntry!.fontSizePx).toBe(11);

      // Guard assertion 5: footer first entry is the bare brand name (bold, 13px, navy)
      const descriptionIdx = elements.findIndex((e) => e.text.includes('سوق إلكتروني للإعلانات'));
      expect(descriptionIdx).toBeGreaterThan(0);
      const footerFirst = elements[descriptionIdx - 1];
      expect(footerFirst.text).toBe('SouqOne');
      expect(footerFirst.fgHex).toBe('#11232E');
      expect(footerFirst.fontSizePx).toBe(13);
      expect(footerFirst.isBold).toBe(true);

      // Guard assertion 6: copyright entries (11px, #6B7280) contain the current year
      const currentYear = String(new Date().getFullYear());
      const copyrightEntries = elements.filter((e) => e.fgHex === '#6B7280' && e.fontSizePx === 11);
      expect(copyrightEntries.length).toBeGreaterThan(0);
      expect(copyrightEntries.some((e) => e.text.includes(currentYear))).toBe(true);
      expect(copyrightEntries.some((e) => e.text === `SouqOne ${currentYear}`)).toBe(true);
    });

    it('should render the logo without any white wrapper around the transparent image', () => {
      const result = builder({ code: sampleCode });
      const imgIdx = result.html.indexOf('id="brand-logo"');
      expect(imgIdx).toBeGreaterThan(0);

      const rowStart = result.html.indexOf('<!-- Logo Row -->');
      expect(rowStart).toBeGreaterThan(0);
      expect(rowStart).toBeLessThan(imgIdx);
      const closingTd = result.html.indexOf('</td>', imgIdx);
      expect(closingTd).toBeGreaterThan(imgIdx);
      const logoCell = result.html.slice(rowStart, closingTd + '</td>'.length);

      expect(logoCell.length).toBeLessThan(600);
      expect(logoCell).not.toContain('bgcolor');
      expect(logoCell).not.toContain('background-color');
      expect(logoCell).not.toContain('border-radius');
    });

    it('should keep the code out of the hidden preheader and keep the TTL in it', () => {
      const result = builder({ code: sampleCode });
      const hidden = result.html.match(/<div style="[^"]*display: none[^"]*">([\s\S]*?)<\/div>/);
      expect(hidden).not.toBeNull();
      const preheaderText = hidden![1].replace(/&nbsp;|&zwnj;/g, ' ').replace(/\s+/g, ' ').trim();

      expect(preheaderText).not.toContain(sampleCode);
      expect(preheaderText).toContain(VERIFICATION_CODE_TTL_MINUTES.toString());
      expect(preheaderText).toBe(expectedPreheader);
      // The &nbsp;&zwnj; padding after the preheader text is preserved
      expect(hidden![1]).toContain('&nbsp;&zwnj;&nbsp;&zwnj;');
    });

    it('should generate dynamic copyright year matching the current date', () => {
      jest.useFakeTimers().setSystemTime(new Date('2031-05-01T12:00:00Z'));
      try {
        const result = builder({ code: sampleCode });
        expect(result.html).toContain('2031');
        expect(result.text).toContain('2031');
        expect(result.html).not.toContain('2026');
        expect(result.text).not.toContain('2026');
      } finally {
        jest.useRealTimers();
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

  describe('Account Deletion Email Templates (PR 1)', () => {
    const fixedUtcDate = new Date('2026-10-23T12:00:00.000Z');

    describe('formatOmanDate', () => {
      it('should format date in Asia/Muscat timezone (+04:00) in Arabic', () => {
        const formatted = formatOmanDate(fixedUtcDate, 'ar');
        expect(formatted).toBeDefined();
        expect(typeof formatted).toBe('string');
        // 12:00 UTC is 16:00 in Muscat (UTC+4)
        expect(formatted).toMatch(/2026/);
        expect(formatted).toMatch(/16:00|4:00/);
      });

      it('should format date in Asia/Muscat timezone (+04:00) in English', () => {
        const formatted = formatOmanDate(fixedUtcDate, 'en');
        expect(formatted).toBeDefined();
        expect(typeof formatted).toBe('string');
        expect(formatted).toMatch(/2026/);
        expect(formatted).toMatch(/16:00|4:00/);
      });

      it('should accept string or timestamp inputs gracefully', () => {
        const formatted = formatOmanDate(new Date('2026-10-23T12:00:00.000Z'), 'en');
        expect(formatted).toContain('2026');
      });
    });

    describe('buildDeletionRequestEmail', () => {
      it('should generate template with matching Arabic/English texts and safe parameters', () => {
        const result = buildDeletionRequestEmail({
          displayName: 'سالم الكندي',
          scheduledAt: fixedUtcDate,
        });

        expect(result.subject).toBe('تم استلام طلب حذف حسابك — سوق ون');
        expect(result.html).toContain('سالم الكندي');
        expect(result.html).toContain('طلب حذف الحساب');
        expect(result.html).toContain('الإعدادات ثم حذف الحساب');
        expect(result.html).toContain('support@souqoneom.com');
        expect(result.html).toContain(`Account Deletion Request Received — ${BRAND_NAME}`);
        expect(result.html).toContain('Settings then Delete Account');

        // Text version
        expect(result.text).toContain(result.subject);
        expect(result.text).toContain('سالم الكندي');
        expect(result.text).toContain('الإعدادات ثم حذف الحساب');
        expect(result.text).toContain(`Account Deletion Request Received — ${BRAND_NAME}`);

        // No dead web links
        expect(result.html).not.toMatch(/href=["']https?:\/\/[^"']*\/settings\/delete/);
      });

      it('should format both dates in plain text with "بتوقيت عُمان" and keep HTML consistent', () => {
        const result = buildDeletionRequestEmail({
          displayName: 'سالم الكندي',
          scheduledAt: fixedUtcDate,
        });
        const lines = result.text.split('\n');
        const omanLines = lines.filter((l) => l.includes('بتوقيت عُمان'));
        expect(omanLines).toHaveLength(2);
        expect(omanLines[0]).toMatch(/- بتوقيت عُمان:\s*.+/);
        expect(omanLines[1]).toMatch(/- بتوقيت عُمان:\s*.+\(Asia\/Muscat\)/);
        expect(result.text).not.toContain('بتوقيت غرينتش');
        expect(result.text).not.toContain('UTC:');
        expect(result.html).toContain('(بتوقيت عُمان)');
        expect(result.html).toContain('(Oman Time — Asia/Muscat)');
      });

      it('should escape HTML tags in displayName and fallback safely when missing', () => {
        const malicious = buildDeletionRequestEmail({
          displayName: '<script>alert(1)</script>',
          scheduledAt: fixedUtcDate,
        });
        expect(malicious.html).not.toContain('<script>');
        expect(malicious.html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');

        const fallback = buildDeletionRequestEmail({
          displayName: null,
          scheduledAt: fixedUtcDate,
        });
        expect(fallback.html).toContain('المستخدم');
        expect(fallback.html).toContain('User');
      });
    });

    describe('buildDeletionCancelledEmail', () => {
      it('should generate template confirming cancellation and restored listings', () => {
        const result = buildDeletionCancelledEmail({
          displayName: 'مريم البلوشية',
        });

        expect(result.subject).toBe('تم إلغاء طلب حذف حسابك بنجاح — سوق ون');
        expect(result.html).toContain('مريم البلوشية');
        expect(result.html).toContain('إلغاء حذف الحساب');
        expect(result.html).toContain('تمت استعادة ظهور إعلاناتكم وخدماتكم');
        expect(result.html).toContain(`Account Deletion Request Cancelled — ${BRAND_NAME}`);
        expect(result.html).toContain('listings and services have been restored');
        expect(result.html).toContain('support@souqoneom.com');

        expect(result.text).toContain(result.subject);
        expect(result.text).toContain('مريم البلوشية');
        expect(result.text).toContain(`Account Deletion Request Cancelled — ${BRAND_NAME}`);
      });

      it('should escape HTML tags and fallback safely when missing', () => {
        const malicious = buildDeletionCancelledEmail({
          displayName: '<b>Hacked</b>',
        });
        expect(malicious.html).not.toContain('<b>Hacked</b>');
        expect(malicious.html).toContain('&lt;b&gt;Hacked&lt;/b&gt;');

        const fallback = buildDeletionCancelledEmail({ displayName: '   ' });
        expect(fallback.html).toContain('المستخدم');
        expect(fallback.html).toContain('User');
      });
    });

    describe('buildFinalDeletionEmail', () => {
      it('should generate template with exact approved wording and accounting/security notice', () => {
        const result = buildFinalDeletionEmail({
          displayName: 'خالد العامري',
        });

        expect(result.subject).toBe('تم حذف حسابك — سوق ون');
        expect(result.html).toContain('خالد العامري');
        expect(result.html).toContain('تم حذف الحساب');
        // Exact wording replacements required by approved plan:
        expect(result.html).toContain('لا تتضمن بياناتكم الشخصية المباشرة');
        expect(result.html).toContain('لأغراض محاسبية وأمنية');
        expect(result.html).not.toContain('دون أي إمكانية لربطها بهويتك');
        expect(result.html).not.toContain('للامتثال للمتطلبات المحاسبية والتنظيمية في سلطنة عُمان');

        // English text validation
        expect(result.html).toContain(`Account Deleted — ${BRAND_NAME}`);
        expect(result.html).toContain('do not contain your direct personal data');
        expect(result.html).toContain('accounting and security purposes');

        // Released email note
        expect(result.html).toContain('أصبح بريدكم الإلكتروني الآن متاحاً');
        expect(result.html).toContain('Your email address is now released');

        // Text version
        expect(result.text).toContain(result.subject);
        expect(result.text).toContain('لا تتضمن بياناتكم الشخصية المباشرة');
        expect(result.text).toContain('لأغراض محاسبية وأمنية');
        expect(result.text).toContain(`Account Deleted — ${BRAND_NAME}`);
        expect(result.text).toContain('do not contain your direct personal data');
        expect(result.text).toContain('accounting and security purposes');
      });

      it('should contain message retention notice ("مستخدم محذوف" / "Deleted user") in HTML and text', () => {
        const result = buildFinalDeletionEmail({
          displayName: 'خالد العامري',
        });
        // Arabic HTML & text
        expect(result.html).toContain('الرسائل التي أرسلتموها ضمن محادثات الأطراف الأخرى تبقى محفوظة لديهم دون ربطها باسمكم وتظهر باسم «مستخدم محذوف».');
        expect(result.html).toContain('مستخدم محذوف');
        expect(result.text).toContain('الرسائل التي أرسلتموها ضمن محادثات الأطراف الأخرى تبقى محفوظة لديهم دون ربطها باسمكم وتظهر باسم «مستخدم محذوف».');
        expect(result.text).toContain('مستخدم محذوف');

        // English HTML & text
        expect(result.html).toContain('Please note that messages sent within conversations with other users remain visible to them without being linked to your name, appearing as "Deleted user".');
        expect(result.html).toContain('Deleted user');
        expect(result.text).toContain('Messages sent within conversations with other users remain without being linked to your name, appearing as "Deleted user".');
        expect(result.text).toContain('Deleted user');
      });

      it('should escape HTML tags and fallback safely when missing', () => {
        const malicious = buildFinalDeletionEmail({
          displayName: '<img src=x onerror=alert(1)>',
        });
        expect(malicious.html).not.toContain('<img src=x');
        expect(malicious.html).toContain('&lt;img src=x');

        const fallback = buildFinalDeletionEmail({ displayName: undefined });
        expect(fallback.html).toContain('المستخدم');
        expect(fallback.html).toContain('User');
      });
    });

    describe('raw plain-text name vs HTML-escaped name with &, \', < across all 3 templates', () => {
      const specialName = "Ali & Sons <Tech> 'Pro'";

      it('should keep raw characters in plain-text and escaped characters in HTML for buildDeletionRequestEmail', () => {
        const result = buildDeletionRequestEmail({
          displayName: specialName,
          scheduledAt: fixedUtcDate,
        });
        expect(result.text).toContain(specialName);
        expect(result.text).not.toContain('&amp;');
        expect(result.text).not.toContain('&lt;');
        expect(result.text).not.toContain('&#39;');

        expect(result.html).toContain('Ali &amp; Sons &lt;Tech&gt; &#39;Pro&#39;');
        expect(result.html).not.toContain('<Tech>');
      });

      it('should keep raw characters in plain-text and escaped characters in HTML for buildDeletionCancelledEmail', () => {
        const result = buildDeletionCancelledEmail({
          displayName: specialName,
        });
        expect(result.text).toContain(specialName);
        expect(result.text).not.toContain('&amp;');
        expect(result.text).not.toContain('&lt;');
        expect(result.text).not.toContain('&#39;');

        expect(result.html).toContain('Ali &amp; Sons &lt;Tech&gt; &#39;Pro&#39;');
        expect(result.html).not.toContain('<Tech>');
      });

      it('should keep raw characters in plain-text and escaped characters in HTML for buildFinalDeletionEmail', () => {
        const result = buildFinalDeletionEmail({
          displayName: specialName,
        });
        expect(result.text).toContain(specialName);
        expect(result.text).not.toContain('&amp;');
        expect(result.text).not.toContain('&lt;');
        expect(result.text).not.toContain('&#39;');

        expect(result.html).toContain('Ali &amp; Sons &lt;Tech&gt; &#39;Pro&#39;');
        expect(result.html).not.toContain('<Tech>');
      });
    });
  });

  describe('Security and Lifecycle Email Templates (PR 1)', () => {
    const fixedUtcDate = new Date('2026-10-23T12:00:00.000Z');

    const checkCommonInvariants = (result: { subject: string; html: string; text: string }) => {
      expect(result.html).toContain('dir="rtl"');
      expect(result.html).toContain('lang="ar"');

      expect(emojiRegex.test(result.subject)).toBe(false);
      expect(emojiRegex.test(result.html)).toBe(false);
      expect(emojiRegex.test(result.text)).toBe(false);

      expect(result.subject).not.toContain('!');
      expect(result.text).not.toContain('!');
      const visibleHtmlText = result.html
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/<!DOCTYPE[^>]*>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<[^>]+>/g, ' ');
      expect(visibleHtmlText).not.toContain('!');

      const urls = result.html.match(/https?:\/\/[^\s"'<>]+/g) || [];
      expect(urls).toEqual([BRAND_LOGO_URL]);

      expect(result.subject).toContain('SouqOne');
      expect(result.html).toContain('SouqOne');
      expect(result.text).toContain('SouqOne');
      expect(result.subject).not.toContain('سوق ون');
      expect(result.subject).not.toContain('سوق وان');
      expect(result.text).not.toContain('سوق وان');

      expect(result.html).toContain('support@souqoneom.com');
      expect(result.text).toContain('support@souqoneom.com');
    };

    describe('buildPasswordChangedEmail', () => {
      it('should generate password changed email with Muscat time and western digits 0-9', () => {
        const result = buildPasswordChangedEmail({
          displayName: 'أحمد الحارثي',
          changedAt: fixedUtcDate,
        });

        expect(result.subject).toBe('تم تغيير كلمة المرور — SouqOne');
        expect(result.html).toContain('أحمد الحارثي');
        expect(result.html).toContain('تم تغيير كلمة المرور الخاصة بحسابكم في <bdi dir="ltr">SouqOne</bdi> بتاريخ');
        expect(result.html).toContain('إذا لم تكونوا أنتم من قام بذلك، يرجى التواصل فوراً مع فريق الدعم عبر');
        expect(result.html).toContain('support@souqoneom.com');
        expect(result.html).toContain('Password Changed — SouqOne');

        expect(result.html).toMatch(/2026/);
        expect(result.html).toMatch(/16:00|4:00/);
        expect(result.html).not.toMatch(/[\u0660-\u0669]/);
        expect(result.text).not.toMatch(/[\u0660-\u0669]/);

        expect(result.text).toContain(result.subject);
        expect(result.text).toContain('أحمد الحارثي');
        expect(result.text).toContain('تم تغيير كلمة المرور الخاصة بحسابكم في SouqOne بتاريخ');
        expect(result.text).toContain('support@souqoneom.com');

        checkCommonInvariants(result);
      });

      it('should escape HTML tags in displayName and fallback safely when missing', () => {
        const malicious = buildPasswordChangedEmail({
          displayName: '<script>alert("xss")</script>',
          changedAt: fixedUtcDate,
        });
        expect(malicious.html).not.toContain('<script>');
        expect(malicious.html).toContain('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');

        const fallback = buildPasswordChangedEmail({
          displayName: undefined,
          changedAt: fixedUtcDate,
        });
        expect(fallback.html).toContain('المستخدم');
        expect(fallback.html).toContain('User');
      });
    });

    describe('buildWelcomeEmail', () => {
      it('should generate welcome email mentioning all 7 categories without restricting to vehicles', () => {
        const result = buildWelcomeEmail({
          displayName: 'سارة البوسعيدية',
        });

        expect(result.subject).toBe('مرحباً بكم في SouqOne');
        expect(result.html).toContain('سارة البوسعيدية');
        expect(result.html).toContain('انضمامكم إلى منصة <bdi dir="ltr">SouqOne</bdi>');
        expect(result.html).toContain('السيارات');
        expect(result.html).toContain('الحافلات');
        expect(result.html).toContain('المعدات');
        expect(result.html).toContain('المشغّلون');
        expect(result.html).toContain('الوظائف');
        expect(result.html).toContain('قطع الغيار');
        expect(result.html).toContain('الخدمات');

        expect(result.html).toContain('Welcome to SouqOne');

        expect(result.text).toContain(result.subject);
        expect(result.text).toContain('سارة البوسعيدية');
        expect(result.text).toContain('انضمامكم إلى منصة SouqOne');
        expect(result.text).toContain('السيارات');
        expect(result.text).toContain('الحافلات');
        expect(result.text).toContain('المعدات');
        expect(result.text).toContain('المشغّلون');
        expect(result.text).toContain('الوظائف');
        expect(result.text).toContain('قطع الغيار');
        expect(result.text).toContain('الخدمات');

        checkCommonInvariants(result);
      });

      it('should escape HTML tags in displayName and fallback safely when missing', () => {
        const malicious = buildWelcomeEmail({
          displayName: '<script>alert(1)</script>',
        });
        expect(malicious.html).not.toContain('<script>');
        expect(malicious.html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');

        const fallback = buildWelcomeEmail({});
        expect(fallback.html).toContain('المستخدم');
        expect(fallback.html).toContain('User');
      });
    });

    describe('buildAccountSuspendedEmail', () => {
      it('should generate suspended email with Muscat date when suspendedUntil is provided', () => {
        const result = buildAccountSuspendedEmail({
          displayName: 'علي المعمري',
          suspendedUntil: fixedUtcDate,
        });

        expect(result.subject).toBe('إشعار إيقاف الحساب مؤقتاً — SouqOne');
        expect(result.html).toContain('علي المعمري');
        expect(result.html).toContain('تم إيقاف حسابكم مؤقتاً للاشتباه في مخالفة سياسات الاستخدام المنصوص عليها في المنصة.');
        expect(result.html).toContain('تنتهي مدة الإيقاف بتاريخ');
        expect(result.html).toContain('خلال هذه الفترة تم إخفاء إعلاناتكم وتعليق إمكانية النشر.');
        expect(result.html).toContain('للاستفسار أو تقديم التماس:');
        expect(result.html).toContain('support@souqoneom.com');
        expect(result.html).toContain('Account Temporarily Suspended — SouqOne');
        expect(result.html).toContain('The suspension is scheduled to end on');
        expect(result.text).toContain('The suspension is scheduled to end on');

        expect(result.html).toMatch(/2026/);
        expect(result.html).toMatch(/16:00|4:00/);
        expect(result.html).not.toMatch(/[\u0660-\u0669]/);
        expect(result.text).not.toMatch(/[\u0660-\u0669]/);

        expect(result.text).toContain(result.subject);
        expect(result.text).toContain('علي المعمري');
        expect(result.text).toContain('تنتهي مدة الإيقاف بتاريخ');
        expect(result.text).toContain('support@souqoneom.com');

        checkCommonInvariants(result);
      });

      it('should omit the date sentence entirely when suspendedUntil is undefined or empty', () => {
        const result = buildAccountSuspendedEmail({
          displayName: 'علي المعمري',
        });

        expect(result.subject).toBe('إشعار إيقاف الحساب مؤقتاً — SouqOne');
        expect(result.html).toContain('تم إيقاف حسابكم مؤقتاً للاشتباه في مخالفة سياسات الاستخدام المنصوص عليها في المنصة.');
        expect(result.html).not.toContain('تنتهي مدة الإيقاف بتاريخ');
        expect(result.html).not.toContain('The suspension is scheduled to end on');
        expect(result.html).toContain('خلال هذه الفترة تم إخفاء إعلاناتكم وتعليق إمكانية النشر.');
        expect(result.html).toContain('للاستفسار أو تقديم التماس:');
        expect(result.html).toContain('support@souqoneom.com');

        expect(result.text).not.toContain('تنتهي مدة الإيقاف بتاريخ');
        expect(result.text).not.toContain('The suspension is scheduled to end on');
        expect(result.text).toContain('خلال هذه الفترة تم إخفاء إعلاناتكم وتعليق إمكانية النشر.');
        expect(result.text).toContain('للاستفسار أو تقديم التماس: support@souqoneom.com.');

        checkCommonInvariants(result);
      });

      it('should escape HTML tags in displayName and fallback safely when missing', () => {
        const malicious = buildAccountSuspendedEmail({
          displayName: '<script>alert(1)</script>',
        });
        expect(malicious.html).not.toContain('<script>');
        expect(malicious.html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');

        const fallback = buildAccountSuspendedEmail({});
        expect(fallback.html).toContain('المستخدم');
        expect(fallback.html).toContain('User');
      });
    });

    describe('buildAccountBannedEmail', () => {
      it('should generate banned email with neutral wording and without admin notes', () => {
        const result = buildAccountBannedEmail({
          displayName: 'ماجد الريامي',
        });

        expect(result.subject).toBe('إشعار حظر الحساب — SouqOne');
        expect(result.html).toContain('ماجد الريامي');
        expect(result.html).toContain(
          'نحيطكم علماً بأنه قد تم حظر حسابكم نهائياً في منصة <bdi dir="ltr">SouqOne</bdi> لمخالفة شروط وسياسات الاستخدام، وتم إلغاء الجلسات النشطة وإزالة إعلاناتكم.',
        );
        expect(result.html).toContain('Account Banned Notice — SouqOne');

        expect(result.html).not.toContain('ملاحظات الأدمن');
        expect(result.html).not.toContain('السبب الداخلي');
        expect(result.text).not.toContain('ملاحظات الأدمن');

        expect(result.text).toContain(result.subject);
        expect(result.text).toContain('ماجد الريامي');
        expect(result.text).toContain(
          'نحيطكم علماً بأنه قد تم حظر حسابكم نهائياً في منصة SouqOne لمخالفة شروط وسياسات الاستخدام، وتم إلغاء الجلسات النشطة وإزالة إعلاناتكم.',
        );
        expect(result.text).toContain('للاستفسار أو تقديم التماس: support@souqoneom.com.');

        checkCommonInvariants(result);
      });

      it('should escape HTML tags in displayName and fallback safely when missing', () => {
        const malicious = buildAccountBannedEmail({
          displayName: '<script>alert("banned")</script>',
        });
        expect(malicious.html).not.toContain('<script>');
        expect(malicious.html).toContain('&lt;script&gt;alert(&quot;banned&quot;)&lt;/script&gt;');

        const fallback = buildAccountBannedEmail({});
        expect(fallback.html).toContain('المستخدم');
        expect(fallback.html).toContain('User');
      });
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });
});
