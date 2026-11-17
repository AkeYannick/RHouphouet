import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client';
import {
  calculerStatutLoyer,
  genererReference,
  genererReferencePaiement,
} from '../../common/statuts';
import { dateEcheanceDuMois, estMoisValide, libelleMois } from '../../common/dates';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreerPaiementDto,
  EncaissementLoyerDto,
} from './dto/paiement.dto';

function formaterMontant(montant: number): string {
  return `${new Intl.NumberFormat('fr-FR').format(montant)} FCFA`;
}

@Injectable()
export class PaiementsService {
  constructor(private readonly prisma: PrismaService) {}

  async lister(filtres: { locataireId?: string; mois?: string } = {}) {
    const where: Prisma.PaiementWhereInput = {};

    if (filtres.locataireId) {
      where.locataireId = filtres.locataireId;
    }

    if (filtres.mois) {
      if (!estMoisValide(filtres.mois)) {
        throw new BadRequestException('Le mois doit être au format AAAA-MM');
      }
      where.loyer = { mois: filtres.mois };
    }

    return this.prisma.paiement.findMany({
      where,
      include: {
        locataire: { include: { appartement: true } },
        loyer: true,
      },
      orderBy: { datePaiement: 'desc' },
    });
  }

  /** Enregistre un paiement en retrouvant ou en créant le loyer du mois concerné */
  async enregistrer(donnees: CreerPaiementDto, noteParDefaut?: string) {
    const locataire = await this.prisma.locataire.findUnique({
      where: { id: donnees.locataireId },
      include: { appartement: true },
    });

    if (!locataire || !locataire.actif) {
      throw new NotFoundException('Locataire introuvable ou inactif');
    }

    if (!estMoisValide(donnees.mois)) {
      throw new BadRequestException('Le mois doit être au format AAAA-MM');
    }

    const loyerExistant = await this.prisma.loyer.findUnique({
      where: {
        locataireId_mois: { locataireId: locataire.id, mois: donnees.mois },
      },
    });

    let loyerId = loyerExistant?.id;

    if (!loyerId) {
      const montantDu = donnees.montantDu ?? locataire.loyerMensuel;

      if (donnees.montant > montantDu) {
        throw new BadRequestException(
          `Le montant saisi dépasse le loyer du (${formaterMontant(montantDu)})`,
        );
      }

      const dateEcheance = dateEcheanceDuMois(donnees.mois);
      const loyer = await this.prisma.loyer.create({
        data: {
          locataireId: locataire.id,
          montantDu,
          montantRecu: 0,
          mois: donnees.mois,
          dateEcheance,
          statut: calculerStatutLoyer(montantDu, 0, dateEcheance),
          reference: genererReference(donnees.mois),
        },
      });
      loyerId = loyer.id;
    }

    return this.encaisserLoyer(loyerId, {
      montantRecu: donnees.montant,
      modePaiement: donnees.modePaiement,
      datePaiement: donnees.datePaiement,
      note: donnees.note ?? noteParDefaut,
    });
  }

  /**
   * Coeur commun à tous les encaissements : met à jour le loyer,
   * trace le versement et notifie l'administration et le locataire.
   */
  async encaisserLoyer(loyerId: string, donnees: EncaissementLoyerDto) {
    const loyer = await this.prisma.loyer.findUnique({
      where: { id: loyerId },
      include: { locataire: { include: { appartement: true } } },
    });

    if (!loyer) {
      throw new NotFoundException('Loyer introuvable');
    }

    if (loyer.statut === 'PAYE') {
      throw new BadRequestException('Ce loyer est déjà entièrement payé');
    }

    const montantVerse = donnees.montantRecu;
    const reste = Math.max(loyer.montantDu - loyer.montantRecu, 0);

    if (montantVerse > reste) {
      throw new BadRequestException(
        `Le montant saisi dépasse le reste à payer (${formaterMontant(reste)})`,
      );
    }

    const montantRecu = loyer.montantRecu + montantVerse;
    const statut = calculerStatutLoyer(loyer.montantDu, montantRecu, loyer.dateEcheance);
    const datePaiement = donnees.datePaiement ? new Date(donnees.datePaiement) : new Date();
    const modePaiement = donnees.modePaiement ?? loyer.modePaiement;

    return this.prisma.$transaction(async (transaction) => {
      const loyerMisAJour = await transaction.loyer.update({
        where: { id: loyerId },
        data: { montantRecu, statut, datePaiement, modePaiement },
        include: { locataire: { include: { appartement: true } } },
      });

      await transaction.paiement.create({
        data: {
          locataireId: loyer.locataireId,
          loyerId,
          montant: montantVerse,
          modePaiement,
          datePaiement,
          reference: genererReferencePaiement(loyer.mois),
          note: donnees.note?.trim() || null,
        },
      });

      await transaction.notification.create({
        data: {
          titre: 'Paiement reçu',
          contenu: `${loyer.locataire.nom} a versé ${formaterMontant(montantVerse)} pour ${libelleMois(
            loyer.mois,
          )}.`,
          type: 'PAIEMENT',
          destinataire: 'ADMIN',
          locataireId: loyer.locataireId,
          lien: '/Paiements',
        },
      });

      await transaction.notification.create({
        data: {
          titre: 'Paiement enregistré',
          contenu: `Votre versement de ${formaterMontant(
            montantVerse,
          )} a bien été enregistré. Reste à payer : ${formaterMontant(
            Math.max(loyerMisAJour.montantDu - loyerMisAJour.montantRecu, 0),
          )}.`,
          type: 'PAIEMENT',
          destinataire: 'LOCATAIRE',
          locataireId: loyer.locataireId,
          lien: '/Loyers',
        },
      });

      return loyerMisAJour;
    });
  }

  async supprimer(id: string) {
    const paiement = await this.prisma.paiement.findUnique({
      where: { id },
      include: { loyer: true },
    });

    if (!paiement) {
      throw new NotFoundException('Paiement introuvable');
    }

    await this.prisma.$transaction(async (transaction) => {
      const montantRecu = Math.max(paiement.loyer.montantRecu - paiement.montant, 0);
      const statut = calculerStatutLoyer(
        paiement.loyer.montantDu,
        montantRecu,
        paiement.loyer.dateEcheance,
      );

      await transaction.loyer.update({
        where: { id: paiement.loyerId },
        data: {
          montantRecu,
          statut,
          datePaiement: montantRecu > 0 ? paiement.loyer.datePaiement : null,
        },
      });

      await transaction.paiement.delete({ where: { id } });
    });

    return { message: 'Paiement supprimé avec succès' };
  }
}
