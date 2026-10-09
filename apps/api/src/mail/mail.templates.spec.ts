import {
  buildVerificationEmail,
  buildPasswordResetEmail,
  BRAND_LOGO_URL,
} from './mail.templates';
import { VERIFICATION_CODE_TTL_MINUTES } from '../auth/auth.constants';

describe('mail.templates', () => {
  const emojiRegex = /\p{Extended_Pictographic}/u;
  const sampleCode = '849201';

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
