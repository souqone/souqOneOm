import { MetaWhatsappOtpSender } from './meta-whatsapp-sender.service';
import { WhatsappOtpError } from './whatsapp-sender.interface';

describe('MetaWhatsappOtpSender', () => {
  const originalFetch = global.fetch;
  let originalTemplateLang: string | undefined;

  beforeEach(() => {
    originalTemplateLang = process.env.WHATSAPP_TEMPLATE_LANG;
    delete process.env.WHATSAPP_TEMPLATE_LANG;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    if (originalTemplateLang !== undefined) {
      process.env.WHATSAPP_TEMPLATE_LANG = originalTemplateLang;
    } else {
      delete process.env.WHATSAPP_TEMPLATE_LANG;
    }
  });

  const validConfig = {
    phoneNumberId: '123456789',
    accessToken: 'test_token',
    templateName: 'auth_otp',
    templateLang: 'ar',
    graphVersion: 'v21.0',
    timeoutMs: 1000,
  };

  it('builds authentication template request with body parameter and copy-code button component', async () => {
    let capturedUrl = '';
    let capturedOptions: any = null;

    global.fetch = jest.fn().mockImplementation(async (url, opts) => {
      capturedUrl = url.toString();
      capturedOptions = opts;
      return {
        ok: true,
        status: 200,
        json: async () => ({
          messages: [{ id: 'wamid.HBgLM...==' }],
        }),
      } as Response;
    });

    const sender = new MetaWhatsappOtpSender(validConfig);
    const result = await sender.send({
      phoneE164: '+96891234567',
      code: '456789',
      locale: 'ar',
    });

    expect(result.providerMessageId).toBe('wamid.HBgLM...==');
    expect(capturedUrl).toBe('https://graph.facebook.com/v21.0/123456789/messages');
    expect(capturedOptions.method).toBe('POST');
    expect(capturedOptions.headers['Authorization']).toBe('Bearer test_token');

    const body = JSON.parse(capturedOptions.body);
    expect(body.messaging_product).toBe('whatsapp');
    expect(body.to).toBe('96891234567');
    expect(body.type).toBe('template');
    expect(body.template.name).toBe('auth_otp');
    expect(body.template.language.code).toBe('ar');

    // Body parameter
    expect(body.template.components[0]).toEqual({
      type: 'body',
      parameters: [{ type: 'text', text: '456789' }],
    });

    // Copy code button component
    expect(body.template.components[1]).toEqual({
      type: 'button',
      sub_type: 'url',
      index: '0',
      parameters: [{ type: 'text', text: '456789' }],
    });
  });

  it('maps Meta 400 invalid recipient error to INVALID_RECIPIENT', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        error: {
          message: 'Recipient phone number not in WhatsApp database',
          code: 131026,
        },
      }),
    } as Response);

    const sender = new MetaWhatsappOtpSender(validConfig);

    await expect(
      sender.send({ phoneE164: '+96891234567', code: '123456' }),
    ).rejects.toThrow(
      new WhatsappOtpError(
        'INVALID_RECIPIENT',
        'Recipient phone number is invalid or not registered on WhatsApp',
      ),
    );
  });

  it('maps Meta 401 unauthorized to PROVIDER_REJECTED', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({
        error: {
          message: 'Invalid OAuth access token.',
          code: 190,
        },
      }),
    } as Response);

    const sender = new MetaWhatsappOtpSender(validConfig);

    await expect(
      sender.send({ phoneE164: '+96891234567', code: '123456' }),
    ).rejects.toThrow(
      new WhatsappOtpError(
        'PROVIDER_REJECTED',
        'Meta WhatsApp provider authentication or authorization failed',
      ),
    );
  });

  it('maps network errors or timeouts to PROVIDER_UNAVAILABLE', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Connection timeout'));

    const sender = new MetaWhatsappOtpSender(validConfig);

    try {
      await sender.send({ phoneE164: '+96891234567', code: '123456' });
      fail('Expected PROVIDER_UNAVAILABLE');
    } catch (err: any) {
      expect(err).toBeInstanceOf(WhatsappOtpError);
      expect(err.code).toBe('PROVIDER_UNAVAILABLE');
      expect(err.message).toBe('Meta WhatsApp API request timed out or network error occurred');
      expect(err.cause).toBeDefined();
    }
  });

  it('prioritizes WHATSAPP_TEMPLATE_LANG over options.locale, then options.locale, then fallback to ar', async () => {
    let capturedOptions: any = null;
    global.fetch = jest.fn().mockImplementation(async (_url, opts) => {
      capturedOptions = opts;
      return {
        ok: true,
        status: 200,
        json: async () => ({ messages: [{ id: 'wamid.123' }] }),
      } as Response;
    });

    // 1. When config/env templateLang is set (e.g. 'ar_SA'), it overrides options.locale (e.g. 'en')
    const senderWithLang = new MetaWhatsappOtpSender({
      phoneNumberId: '123',
      accessToken: 'token',
      templateLang: 'ar_SA',
    });
    await senderWithLang.send({ phoneE164: '+96891234567', code: '123456', locale: 'en' });
    let body = JSON.parse(capturedOptions.body);
    expect(body.template.language.code).toBe('ar_SA');

    // 2. When templateLang is not set, options.locale is used
    const senderWithoutLang = new MetaWhatsappOtpSender({
      phoneNumberId: '123',
      accessToken: 'token',
    });
    await senderWithoutLang.send({ phoneE164: '+96891234567', code: '123456', locale: 'en' });
    body = JSON.parse(capturedOptions.body);
    expect(body.template.language.code).toBe('en');

    // 3. When neither is set, defaults to 'ar'
    await senderWithoutLang.send({ phoneE164: '+96891234567', code: '123456' });
    body = JSON.parse(capturedOptions.body);
    expect(body.template.language.code).toBe('ar');
  });
});
