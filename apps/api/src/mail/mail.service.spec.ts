import { Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
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

    expect(callArgs.from).toBe('"سوق ون" <noreply@mail.souqoneom.com>');
    expect(callArgs.to).toBe('test@example.com');
    expect(callArgs.replyTo).toBe('support@souqoneom.com');
    expect(callArgs.subject).toBe('رمز التحقق من البريد الإلكتروني — سوق ون');
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

    expect(callArgs.from).toBe('"سوق ون" <alerts@mail.souqoneom.com>');
    expect(callArgs.to).toBe('reset@example.com');
    expect(callArgs.replyTo).toBe('help@souqoneom.com');
    expect(callArgs.subject).toBe('طلب استعادة كلمة المرور — سوق ون');
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
      const loggedString = call.map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg))).join(' ');
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
});
