import 'dotenv/config';
import { json, urlencoded } from 'express';
import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { SanitizeInterceptor } from './common/interceptors/sanitize.interceptor';
import { NormalizeImagesInterceptor } from './common/interceptors/normalize-images.interceptor';
import { RedisIoAdapter } from './common/adapters/redis-io.adapter';
import * as path from 'path';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  logger.log('[DIAG-BUILD-CHECK-20260824T214045Z-65e02d84] bootstrap starting');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Redis Socket.IO Adapter for horizontal scaling
  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis();
  logger.log('[DIAG] connectToRedis() resolved, about to call useWebSocketAdapter');
  app.useWebSocketAdapter(redisIoAdapter);

  // M-8: trust the first proxy hop so req.ip / X-Forwarded-For reflects the real client IP
  app.set('trust proxy', 1);

  // Set JSON payload limits to prevent unbounded memory exhaustion
  app.use(json({ limit: '2mb' }));
  app.use(urlencoded({ extended: true, limit: '2mb' }));

  // Strict CORS Allowlist
  const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:3001')
    .split(',')
    .map((o) => o.trim());

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
  });

  // أنبوب التحقق الشامل
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // فلتر الأخطاء الشامل
  app.useGlobalFilters(new GlobalExceptionFilter());

  // حماية شاملة ضد تسريب البيانات الحساسة
  app.useGlobalInterceptors(new SanitizeInterceptor(), new NormalizeImagesInterceptor());

  // Serve uploaded files statically at /uploads/*
  app.useStaticAssets(path.join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // بادئة API مع إصدار
  app.setGlobalPrefix('api/v1');

  const config = new DocumentBuilder()
    .setTitle('CarOne API')
    .setDescription('The CarOne API description')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app as any, config);
  SwaggerModule.setup('api/docs', app as any, document);

  const port = process.env.PORT || process.env.API_PORT || 4000;
  logger.log('[DIAG] About to call app.listen()');
  await app.listen(port);
  logger.log('[DIAG] app.listen() resolved, server listening');

  logger.log(`كار وان API يعمل على: http://localhost:${port}/api/v1`);
}

bootstrap();
