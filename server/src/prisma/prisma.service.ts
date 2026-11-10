import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '../generated/prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(configuration: ConfigService) {
    const chaineConnexion = configuration.get<string>('DATABASE_URL');

    if (!chaineConnexion) {
      throw new Error(
        'DATABASE_URL est absent. Copiez server/.env.example vers server/.env et renseignez la connexion Neon.',
      );
    }

    // L'adaptateur Neon gère la connexion groupée de la base PostgreSQL
    const adaptateur = new PrismaNeon({ connectionString: chaineConnexion });

    super({ adapter: adaptateur });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
