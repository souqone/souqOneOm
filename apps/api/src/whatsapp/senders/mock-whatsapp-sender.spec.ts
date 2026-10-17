import { MockWhatsappOtpSender } from './mock-whatsapp-sender.service';

describe('MockWhatsappOtpSender', () => {
  let sender: MockWhatsappOtpSender;

  beforeEach(() => {
    sender = new MockWhatsappOtpSender();
  });

  it('records message in-memory and returns mock providerMessageId', async () => {
    const result = await sender.send({
      phoneE164: '+96891234567',
      code: '123456',
      locale: 'ar',
    });

    expect(result.providerMessageId).toMatch(/^mock_wamid_/);

    const messages = sender.getMessages();
    expect(messages).toHaveLength(1);
    expect(messages[0].phoneE164).toBe('+96891234567');
    expect(messages[0].providerMessageId).toBe(result.providerMessageId);
    expect(messages[0].locale).toBe('ar');
    expect(sender.getLastMessage()?.providerMessageId).toBe(result.providerMessageId);
  });

  it('clears recorded messages', async () => {
    await sender.send({
      phoneE164: '+96891234567',
      code: '654321',
    });

    expect(sender.getMessages()).toHaveLength(1);
    sender.clearMessages();
    expect(sender.getMessages()).toHaveLength(0);
  });
});
