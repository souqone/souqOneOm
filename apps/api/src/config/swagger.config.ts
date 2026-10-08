import { INestApplication, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

const logger = new Logger('Swagger');

export function setupSwagger(app: INestApplication): boolean {
  if (process.env.NODE_ENV === 'production') {
    logger.log('Swagger documentation is disabled in production.');
    return false;
  }

  const config = new DocumentBuilder()
    .setTitle('CarOne API')
    .setDescription('The CarOne API description')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app as any, config);
  SwaggerModule.setup('api/docs', app as any, document);
  SwaggerModule.setup('docs', app as any, document);

  logger.log('Swagger documentation mounted at /api/docs and /docs');
  return true;
}
