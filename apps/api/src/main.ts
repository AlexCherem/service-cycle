import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';

import { AppModule } from './app.module';
import { ACCESS_TOKEN_COOKIE_NAME } from './auth/auth.constants';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  const webOrigin = process.env.WEB_ORIGIN;

  if (!webOrigin) {
    throw new Error('WEB_ORIGIN is not configured');
  }

  app.enableCors({
    origin: webOrigin,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
      whitelist: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Service Cycle API')
    .setDescription('API для управления плановым обслуживанием клиентов')
    .setVersion('1.0')
    .addCookieAuth(
      ACCESS_TOKEN_COOKIE_NAME,
      {
        type: 'apiKey',
      },
      ACCESS_TOKEN_COOKIE_NAME,
    )
    .build();
  const swaggerDocument = () =>
    SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('docs', app, swaggerDocument);

  app.enableShutdownHooks();
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
