import { Module } from '@nestjs/common';
import { ContratsModule } from '../contrats/contrats.module';
import { MessagesModule } from '../messages/messages.module';
import { PaiementsModule } from '../paiements/paiements.module';
import { EspaceLocataireController } from './espace-locataire.controller';
import { EspaceLocataireService } from './espace-locataire.service';
import { LocataireGuard } from './locataire.guard';
import { LocataireSessionsService } from './locataire-sessions.service';

@Module({
  imports: [PaiementsModule, ContratsModule, MessagesModule],
  controllers: [EspaceLocataireController],
  providers: [EspaceLocataireService, LocataireSessionsService, LocataireGuard],
})
export class EspaceLocataireModule {}
