import { DisabledWhatsappOtpSender } from './disabled-whatsapp-sender.service';
import { WhatsappOtpError } from './whatsapp-sender.interface';

describe('DisabledWhatsappOtpSender', () => {
  it('throws PROVIDER_UNAVAILABLE on send without throwing at instantiation', async () => {
    const sender = new DisabledWhatsappOtpSender('Service unconfigured');

    await expect(
      sender.send({ phoneE164: '+96891234567', code: '112233' }),
    ).rejects.toThrow(
      new WhatsappOtpError('PROVIDER_UNAVAILABLE', 'Service unconfigured'),
    );
  });
});
