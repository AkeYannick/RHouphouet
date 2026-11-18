import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ContratsService } from '../contrats/contrats.service';
import { MessagesService } from '../messages/messages.service';
import { PaiementsService } from '../paiements/paiements.service';
import {
  MessageLocataireDto,
  PaiementLocataireDto,
} from './dto/espace-locataire.dto';

@Injectable()
export class EspaceLocataireService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paiements: PaiementsService,
    private readonly contrats: ContratsService,
    private readonly messages: MessagesService,
  ) {}

  async profil(locataireId: string) {
    const locataire = await this.prisma.locataire.findUnique({
      where: { id: locataireId },
      include: { appartement: true },
    });

    if (!locataire) {
      throw new NotFoundException('Locataire introuvable');
    }

    const contrat = await this.contrats.trouverActif(locataireId);

    return { ...locataire, contrat };
  }

  async loyers(locataireId: string) {
    await this.prisma.loyer.updateMany({
      where: {
        locataireId,
        statut: 'EN_ATTENTE',
        dateEcheance: { lt: new Date() },
      },
      data: { statut: 'EN_RETARD' },
    });

    return this.prisma.loyer.findMany({
      where: { locataireId },
      orderBy: [{ mois: 'desc' }],
    });
  }

  listerPaiements(locataireId: string) {
    return this.paiements.lister({ locataireId });
  }

  contratActif(locataireId: string) {
    return this.contrats.trouverActif(locataireId);
  }

  contratActifPdf(locataireId: string) {
    return this.contrats.pdfActif(locataireId);
  }

  enregistrerPaiement(locataireId: string, donnees: PaiementLocataireDto) {
    return this.paiements.enregistrer(
      {
        locataireId,
        mois: donnees.mois,
        montant: donnees.montant,
        modePaiement: donnees.modePaiement,
        note: donnees.note,
      },
      "Paiement déclaré depuis l'application locataire",
    );
  }

  async listerMessages(locataireId: string) {
    await this.messages.marquerLus(locataireId, 'LOCATAIRE');
    return this.messages.listerParLocataire(locataireId);
  }

  envoyerMessage(locataireId: string, donnees: MessageLocataireDto) {
    return this.messages.envoyer({
      locataireId,
      expediteur: 'LOCATAIRE',
      contenu: donnees.contenu,
    });
  }
}
