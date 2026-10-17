import { Test } from '@nestjs/testing';
import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import * as crypto from 'crypto';
import { WhatsappWebhookController } from './whatsapp-webhook.controller';
import { PrismaService } from '../prisma/prisma.service';
import { applyBodyParsers } from '../common/utils/body-parser.util';

@Controller('test-json')
class TestEchoJsonController {
  @Post()
  @HttpCode(HttpStatus.OK)
  echo(@Body() body: any) {
    return { received: body };
  }
}

describe('WhatsappWebhookController HTTP Integration (supertest)', () => {
  let app: NestExpressApplication;
  let mockPrisma: any;
  const appSecret = 'test_webhook_app_secret_12345';
  const originalSecret = process.env.WHATSAPP_APP_SECRET;

  beforeAll(async () => {
    process.env.WHATSAPP_APP_SECRET = appSecret;

    mockPrisma = {
      whatsappMessageLog: {
        findUnique: jest.fn().mockResolvedValue(null),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        update: jest.fn().mockResolvedValue({}),
      },
    };

    const moduleFixture = await Test.createTestingModule({
      controllers: [WhatsappWebhookController, TestEchoJsonController],
      providers: [
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>({ rawBody: true });
    applyBodyParsers(app);
    await app.init();
  });

  afterAll(async () => {
    if (originalSecret !== undefined) {
      process.env.WHATSAPP_APP_SECRET = originalSecret;
    } else {
      delete process.env.WHATSAPP_APP_SECRET;
    }
    await app.close();
  });

  it('accepts POST /whatsapp/webhook with valid X-Hub-Signature-256 and returns 200', async () => {
    const rawPayload = JSON.stringify({
      object: 'whatsapp_business_account',
      entry: [
        {
          id: 'WHATSAPP_BUSINESS_ACCOUNT_ID',
          changes: [
            {
              field: 'messages',
              value: {
                messaging_product: 'whatsapp',
                statuses: [
                  {
                    id: 'wamid.HBgLMTY1MDk5OTk5OTkFQIAERjIw',
                    status: 'sent',
                    timestamp: '1650999999',
                  },
                ],
              },
            },
          ],
        },
      ],
    });

    const signature =
      'sha256=' +
      crypto.createHmac('sha256', appSecret).update(rawPayload, 'utf8').digest('hex');

    const res = await request(app.getHttpServer())
      .post('/whatsapp/webhook')
      .set('Content-Type', 'application/json')
      .set('X-Hub-Signature-256', signature)
      .send(rawPayload);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('rejects POST /whatsapp/webhook with invalid X-Hub-Signature-256 and returns 401', async () => {
    const rawPayload = JSON.stringify({ object: 'whatsapp_business_account' });
    const invalidSignature = 'sha256=0000000000000000000000000000000000000000000000000000000000000000';

    const res = await request(app.getHttpServer())
      .post('/whatsapp/webhook')
      .set('Content-Type', 'application/json')
      .set('X-Hub-Signature-256', invalidSignature)
      .send(rawPayload);

    expect(res.status).toBe(401);
  });

  it('rejects POST /whatsapp/webhook when X-Hub-Signature-256 header is missing and returns 401', async () => {
    const rawPayload = JSON.stringify({ object: 'whatsapp_business_account' });

    const res = await request(app.getHttpServer())
      .post('/whatsapp/webhook')
      .set('Content-Type', 'application/json')
      .send(rawPayload);

    expect(res.status).toBe(401);
  });

  it('ensures regular JSON endpoints correctly parse req.body', async () => {
    const bodyData = { foo: 'bar', numbers: [1, 2, 3] };

    const res = await request(app.getHttpServer())
      .post('/test-json')
      .set('Content-Type', 'application/json')
      .send(bodyData);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ received: bodyData });
  });

  it('enforces 2MB payload limit on incoming requests', async () => {
    // Construct payload slightly larger than 2MB (> 2 * 1024 * 1024 bytes)
    const largeStr = 'x'.repeat(2.1 * 1024 * 1024);
    const largePayload = JSON.stringify({ data: largeStr });

    const res = await request(app.getHttpServer())
      .post('/test-json')
      .set('Content-Type', 'application/json')
      .send(largePayload);

    expect(res.status).toBe(413); // Payload Too Large
  });
});
