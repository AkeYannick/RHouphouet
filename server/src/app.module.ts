import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { SanteController } from './app.controller';
import { AppartementsModule } from './modules/appartements/appartements.module';
import { AuthModule } from './modules/auth/auth.module';
import { ChargesModule } from './modules/charges/charges.module';
import { ContratsModule } from './modules/contrats/contrats.module';
import { EspaceLocataireModule } from './modules/espace-locataire/espace-locataire.module';
import { LocatairesModule } from './modules/locataires/locataires.module';
import { LoyersModule } from './modules/loyers/loyers.module';
import { MessagesModule } from './modules/messages/messages.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PaiementsModule } from './modules/paiements/paiements.module';
import { PrismaModule } from './prisma/prisma.module';
import { TableauDeBordModule } from './modules/tableau-de-bord/tableau-de-bord.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    PrismaModule,
    AuthModule,
    AppartementsModule,
    LocatairesModule,
    LoyersModule,
    PaiementsModule,
    ContratsModule,
    ChargesModule,
    NotificationsModule,
    MessagesModule,
    TableauDeBordModule,
    EspaceLocataireModule,
  ],
  controllers: [SanteController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
