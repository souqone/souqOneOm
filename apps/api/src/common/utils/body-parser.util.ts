import { json, urlencoded } from 'express';
import { INestApplication } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';

/**
 * Configures JSON and URL-encoded body parsers with a 2MB limit while ensuring
 * that the raw body Buffer is preserved on `req.rawBody` for webhook signature
 * verification (e.g., Meta WhatsApp X-Hub-Signature-256).
 */
export function applyBodyParsers(app: INestApplication | NestExpressApplication): void {
  const expressApp = app as NestExpressApplication;
  if (typeof expressApp.useBodyParser === 'function') {
    expressApp.useBodyParser('json', {
      limit: '2mb',
      verify: (req: any, _res: any, buf: Buffer) => {
        req.rawBody = buf;
      },
    });
    expressApp.useBodyParser('urlencoded', { extended: true, limit: '2mb' });
  } else {
    app.use(
      json({
        limit: '2mb',
        verify: (req: any, _res: any, buf: Buffer) => {
          req.rawBody = buf;
        },
      }),
    );
    app.use(urlencoded({ extended: true, limit: '2mb' }));
  }
}
