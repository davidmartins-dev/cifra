import 'dotenv/config';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module.js';
import { initTelemetry, shutdownTelemetry } from './shared/observability/tracing.js';

initTelemetry();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
    credentials: true,
  });
  app.setGlobalPrefix('api/v1', {
    exclude: ['metrics', 'health'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Cifra API')
    .setDescription('API de gestão financeira pessoal')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
}

process.on('SIGTERM', () => {
  void shutdownTelemetry().finally(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  void shutdownTelemetry().finally(() => {
    process.exit(0);
  });
});

void bootstrap();
