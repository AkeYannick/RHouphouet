import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '../generated/prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(configuration: ConfigService) {
    // L'adaptateur Neon gère la connexion groupée de la base PostgreSQL
    const adaptateur = new PrismaNeon({
      connectionString: configuration.getOrThrow<string>('databaseUrl'),
    });

    super({ adapter: adaptateur });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
