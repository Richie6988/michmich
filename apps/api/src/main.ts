import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { IoAdapter } from '@nestjs/platform-socket.io';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // Trust proxy headers when behind a load balancer (HSTS, X-Forwarded-*)
    bodyParser: true,
  });

  // === SECURITY MIDDLEWARE ===

  // Helmet: secure headers (X-Frame-Options, CSP, HSTS, etc)
  // HSTS preloads HTTPS for 1 year (prod only)
  app.use(
    helmet({
      contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
      hsts: process.env.NODE_ENV === 'production'
        ? { maxAge: 31536000, includeSubDomains: true, preload: true }
        : false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // Cookie parser for OAuth state cookies
  app.use(cookieParser(process.env.COOKIE_SECRET || 'barry-cookie-secret-change-me'));

  // Trust proxy for accurate client IP behind load balancers (rate limiting)
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // CORS - explicit allowlist
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'http://localhost:8081',
    ],
    credentials: true,
  });

  // Global validation: whitelist + reject unknown fields + auto-transform
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // WebSocket adapter
  app.useWebSocketAdapter(new IoAdapter(app));

  // Swagger (dev only)
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Barry API')
      .setDescription('Barry - Group equity meetup optimizer')
      .setVersion('0.1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.warn(`Barry API running on http://localhost:${port}`);
  console.warn(`Swagger docs: http://localhost:${port}/api/docs`);
}

bootstrap();
