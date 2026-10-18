import { Logger } from '@nestjs/common';
import { MailService } from './mail.service';

const mockSendMail = jest.fn();
const mockCreateTransport = jest.fn().mockReturnValue({
  sendMail: mockSendMail,
});

jest.mock('nodemailer', () => ({
  createTransport: (...args: any[]) => mockCreateTransport(...args),
}));

describe('MailService', () => {
  const originalEnv = process.env;
  let loggerLogSpy: jest.SpyInstance;
  let loggerWarnSpy: jest.SpyInstance;
  let loggerErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      MAIL_HOST: 'smtp.resend.com',
      MAIL_PORT: '465',
      MAIL_USER: 'resend',
      MAIL_PASS: 'test-pass',
    };
    delete process.env.MAIL_FROM;
    delete process.env.MAIL_REPLY_TO;

    loggerLogSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    loggerWarnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
    loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  it('should initialize transporter with correct credentials and defaults', () => {
    new MailService();

    expect(mockCreateTransport).toHaveBeenCalledWith({
      host: 'smtp.resend.com',
      port: 465,
      secure: true,
      auth: { user: 'resend', pass: 'test-pass' },
    });
  });

  it('should send verification email with default sender and replyTo', async () => {
    mockSendMail.mockResolvedValueOnce({ messageId: 'msg-1' });
    const service = new MailService();
    const testCode = '654321';

    await service.sendVerificationEmail('test@example.com', testCode);

    expect(mockSendMail).toHaveBeenCalledTimes(1);
    const callArgs = mockSendMail.mock.calls[0][0];

    expect(callArgs.from).toBe('"SouqOne" <noreply@mail.souqoneom.com>');
    expect(callArgs.to).toBe('test@example.com');
    expect(callArgs.replyTo).toBe('support@souqoneom.com');
    expect(callArgs.subject).toBe('رمز التحقق من البريد الإلكتروني — SouqOne');
    expect(typeof callArgs.html).toBe('string');
    expect(typeof callArgs.text).toBe('string');
    expect(callArgs.html).toContain(testCode);
    expect(callArgs.text).toContain(testCode);
  });

  it('should honor custom MAIL_FROM and MAIL_REPLY_TO', async () => {
    process.env.MAIL_FROM = 'alerts@mail.souqoneom.com';
    process.env.MAIL_REPLY_TO = 'help@souqoneom.com';
    mockSendMail.mockResolvedValueOnce({ messageId: 'msg-2' });

    const service = new MailService();
    await service.sendPasswordResetEmail('reset@example.com', '123456');

    expect(mockSendMail).toHaveBeenCalledTimes(1);
    const callArgs = mockSendMail.mock.calls[0][0];

    expect(callArgs.from).toBe('"SouqOne" <alerts@mail.souqoneom.com>');
    expect(callArgs.to).toBe('reset@example.com');
    expect(callArgs.replyTo).toBe('help@souqoneom.com');
    expect(callArgs.subject).toBe('طلب استعادة كلمة المرور — SouqOne');
    expect(typeof callArgs.html).toBe('string');
    expect(typeof callArgs.text).toBe('string');
  });

  it('should rethrow errors when sendMail fails and never log secret code', async () => {
    const error = new Error('SMTP connection timeout');
    mockSendMail.mockRejectedValueOnce(error);
    const service = new MailService();
    const secretCode = '987654';

    await expect(service.sendVerificationEmail('victim@example.com', secretCode)).rejects.toThrow(
      'SMTP connection timeout',
    );

    // Verify secret code was never logged in any logger call
    const allLogCalls = [
      ...loggerLogSpy.mock.calls,
      ...loggerWarnSpy.mock.calls,
      ...loggerErrorSpy.mock.calls,
    ];

    allLogCalls.forEach((call) => {
      const loggedString = call.map((arg: any) => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg))).join(' ');
      expect(loggedString).not.toContain(secretCode);
    });
  });

  it('should log warning and not throw in DEV when transporter is unconfigured', async () => {
    delete process.env.MAIL_HOST;
    delete process.env.MAIL_USER;
    delete process.env.MAIL_PASS;

    const service = new MailService();
    await service.sendVerificationEmail('dev@example.com', '112233');

    expect(mockSendMail).not.toHaveBeenCalled();
    expect(loggerWarnSpy).toHaveBeenCalledWith(expect.stringContaining('[DEV] Email to dev@example.com'));
  });

  describe('Deletion Emails (PR 1)', () => {
    const fixedDate = new Date('2026-10-23T12:00:00Z');

    it('should send deletion request email with Oman formatted date and cancellation guidance', async () => {
      mockSendMail.mockResolvedValueOnce({ messageId: 'msg-del-req' });
      const service = new MailService();

      await service.sendDeletionRequestEmail('user@example.com', fixedDate, 'أحمد العماني');

      expect(mockSendMail).toHaveBeenCalledTimes(1);
      const callArgs = mockSendMail.mock.calls[0][0];

      expect(callArgs.to).toBe('user@example.com');
      expect(callArgs.from).toBe('"SouqOne" <noreply@mail.souqoneom.com>');
      expect(callArgs.replyTo).toBe('support@souqoneom.com');
      expect(callArgs.subject).toBe('تم استلام طلب حذف حسابك — سوق ون');
      expect(callArgs.html).toContain('أحمد العماني');
      expect(callArgs.html).toContain('الإعدادات ثم حذف الحساب');
      expect(callArgs.text).toContain('الإعدادات ثم حذف الحساب');
      expect(callArgs.html).toContain('support@souqoneom.com');
    });

    it('should be fail-safe when sendDeletionRequestEmail fails (warns, does not throw)', async () => {
      mockSendMail.mockRejectedValueOnce(new Error('SMTP connection dropped'));
      const service = new MailService();

      await expect(
        service.sendDeletionRequestEmail('user@example.com', fixedDate, 'أحمد'),
      ).resolves.toBeUndefined();

      expect(loggerWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to send deletion request email to user@example.com'),
      );
    });

    it('should send deletion cancelled email with restored listings notice', async () => {
      mockSendMail.mockResolvedValueOnce({ messageId: 'msg-del-cancel' });
      const service = new MailService();

      await service.sendDeletionCancelledEmail('user@example.com', 'أحمد العماني');

      expect(mockSendMail).toHaveBeenCalledTimes(1);
      const callArgs = mockSendMail.mock.calls[0][0];

      expect(callArgs.to).toBe('user@example.com');
      expect(callArgs.subject).toBe('تم إلغاء طلب حذف حسابك بنجاح — سوق ون');
      expect(callArgs.html).toContain('أحمد العماني');
      expect(callArgs.html).toContain('تمت استعادة ظهور إعلاناتكم');
      expect(callArgs.text).toContain('تمت استعادة ظهور إعلاناتكم');
    });

    it('should be fail-safe when sendDeletionCancelledEmail fails (warns, does not throw)', async () => {
      mockSendMail.mockRejectedValueOnce(new Error('Network timeout'));
      const service = new MailService();

      await expect(
        service.sendDeletionCancelledEmail('user@example.com', 'أحمد'),
      ).resolves.toBeUndefined();

      expect(loggerWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to send deletion cancellation email to user@example.com'),
      );
    });

    it('should send final deletion email with accounting/security notice', async () => {
      mockSendMail.mockResolvedValueOnce({ messageId: 'msg-del-final' });
      const service = new MailService();

      await service.sendFinalDeletionEmail('user@example.com', 'أحمد العماني');

      expect(mockSendMail).toHaveBeenCalledTimes(1);
      const callArgs = mockSendMail.mock.calls[0][0];

      expect(callArgs.to).toBe('user@example.com');
      expect(callArgs.subject).toBe('تم حذف حسابك — سوق ون');
      expect(callArgs.html).toContain('لا تتضمن بياناتكم الشخصية المباشرة');
      expect(callArgs.html).toContain('لأغراض محاسبية وأمنية');
      expect(callArgs.text).toContain('لا تتضمن بياناتكم الشخصية المباشرة');
      expect(callArgs.text).toContain('لأغراض محاسبية وأمنية');
    });

    it('should be fail-safe when sendFinalDeletionEmail fails (warns, does not throw)', async () => {
      mockSendMail.mockRejectedValueOnce(new Error('SMTP down'));
      const service = new MailService();

      await expect(
        service.sendFinalDeletionEmail('user@example.com', 'أحمد'),
      ).resolves.toBeUndefined();

      expect(loggerWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to send final deletion email to user@example.com'),
      );
    });
  });
});
