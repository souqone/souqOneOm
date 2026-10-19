import { maskEmail, maskEmailSafe, redactEmails } from './mask-email';

describe('maskEmail', () => {
  it('masks standard email addresses properly', () => {
    expect(maskEmail('mahmoud@example.test')).toBe('m***@example.test');
    expect(maskEmail('admin@souqone.om')).toBe('a***@souqone.om');
    expect(maskEmail('user123@gmail.com')).toBe('u***@gmail.com');
  });

  it('handles single character username', () => {
    expect(maskEmail('a@domain.com')).toBe('a***@domain.com');
  });

  it('handles whitespaces around email', () => {
    expect(maskEmail('  test@example.com  ')).toBe('t***@example.com');
  });

  it('returns null for null, undefined, empty, or invalid emails', () => {
    expect(maskEmail(null)).toBeNull();
    expect(maskEmail(undefined)).toBeNull();
    expect(maskEmail('')).toBeNull();
    expect(maskEmail('   ')).toBeNull();
    expect(maskEmail('notanemail')).toBeNull();
    expect(maskEmail('@domain.com')).toBeNull();
    expect(maskEmail('user@')).toBeNull();
    expect(maskEmail('x@user@example.com')).toBeNull();
    expect(maskEmail('user@@example.com')).toBeNull();
  });
});

describe('maskEmailSafe', () => {
  it('returns masked email for valid emails', () => {
    expect(maskEmailSafe('user@example.com')).toBe('u***@example.com');
  });

  it('returns fallback placeholder for invalid or missing emails', () => {
    expect(maskEmailSafe(null)).toBe('***');
    expect(maskEmailSafe(undefined)).toBe('***');
    expect(maskEmailSafe('')).toBe('***');
    expect(maskEmailSafe('invalid')).toBe('***');
    expect(maskEmailSafe('x@user@example.com')).toBe('***');
  });
});

describe('redactEmails', () => {
  it('redacts all email occurrences in text while keeping context', () => {
    const errorText = 'Recipient command failed: 553 5.1.2 <victim@example.com> rejected';
    expect(redactEmails(errorText)).toBe(
      'Recipient command failed: 553 5.1.2 <v***@example.com> rejected',
    );
  });

  it('handles null, undefined, or text without emails safely', () => {
    expect(redactEmails(null)).toBe('');
    expect(redactEmails(undefined)).toBe('');
    expect(redactEmails('Connection timeout')).toBe('Connection timeout');
  });
});
