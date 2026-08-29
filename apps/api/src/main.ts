import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const webOrigin = process.env.WEB_ORIGIN;

  if (!webOrigin) {
    throw new Error('WEB_ORIGIN is not configured');
  }

  app.enableCors({
    origin: webOrigin,
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
    .build();
  const swaggerDocument = () =>
    SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('docs', app, swaggerDocument);

  app.enableShutdownHooks();
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
