import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { FiltreExceptions } from './common/filtre-exceptions';

async function demarrer() {
  const application = await NestFactory.create(AppModule);

  application.use(helmet());
  application.use((_demande: Request, reponse: Response, suivante: NextFunction) => {
    reponse.setHeader('Cache-Control', 'no-store');
    suivante();
  });

  // Toutes les routes de l'API sont préfixées par /api
  application.setGlobalPrefix('api');

  const origines = (process.env.CLIENT_URL ?? 'http://localhost:5173')
    .split(',')
    .map((origine) => origine.trim())
    .filter(Boolean);
  const accesUniversel = origines.includes('*');

  if (accesUniversel) {
    console.warn(
      'CLIENT_URL contient *, toutes les origines sont autorisées : à réserver au développement.',
    );
  }

  application.enableCors({
    origin: accesUniversel ? true : origines,
    credentials: !accesUniversel,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 600,
  });

  application.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  application.useGlobalFilters(new FiltreExceptions());
  application.enableShutdownHooks();

  const port = Number(process.env.PORT ?? 5000);
  await application.listen(port);

  console.log(`Service disponible sur http://localhost:${port}/api`);
}

void demarrer();
