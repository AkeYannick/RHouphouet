import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client';
import {
  STATUTS_LOYER,
  calculerStatutLoyer,
  genererReference,
  type StatutLoyer,
} from '../../common/statuts';
import { dateEcheanceDuMois, estMoisValide, libelleMois } from '../../common/dates';
import { PrismaService } from '../../prisma/prisma.service';
import { CreerLoyerDto, GenererLoyersDto, PayerLoyerDto } from './dto/loyer.dto';

function formaterMontant(montant: number): string {
  return `${new Intl.NumberFormat('fr-FR').format(montant)} FCFA`;
}

@Injectable()
export class LoyersService {
  constructor(private readonly prisma: PrismaService) {}

  async lister(filtres: { statut?: string; mois?: string; locataireId?: string }) {
    // Les loyers impayés dont l'échéance est passée passent automatiquement en retard
    await this.marquerLoyersEnRetard();

    const where: Prisma.LoyerWhereInput = {};

    if (filtres.statut) {
      if (!STATUTS_LOYER.includes(filtres.statut as StatutLoyer)) {
        throw new BadRequestException('Statut de loyer invalide');
      }
      where.statut = filtres.statut as StatutLoyer;
    }

    if (filtres.mois) {
      if (!estMoisValide(filtres.mois)) {
        throw new BadRequestException('Le mois doit être au format AAAA-MM');
      }
      where.mois = filtres.mois;
    }

    if (filtres.locataireId) {
      where.locataireId = filtres.locataireId;
    }

    return this.prisma.loyer.findMany({
      where,
      include: {
        locataire: {
          include: { appartement: true },
        },
      },
      orderBy: [{ mois: 'desc' }, { creeLe: 'desc' }],
    });
  }

  async trouver(id: string) {
    const loyer = await this.prisma.loyer.findUnique({
      where: { id },
      include: { locataire: { include: { appartement: true } } },
    });

    if (!loyer) {
      throw new NotFoundException('Loyer introuvable');
    }

    return loyer;
  }

  async creer(donnees: CreerLoyerDto) {
    const locataire = await this.prisma.locataire.findUnique({
      where: { id: donnees.locataireId },
      include: { appartement: true },
    });

    if (!locataire || !locataire.actif) {
      throw new NotFoundException('Locataire introuvable ou inactif');
    }

    const existant = await this.prisma.loyer.findUnique({
      where: {
        locataireId_mois: { locataireId: locataire.id, mois: donnees.mois },
      },
    });

    if (existant) {
      throw new ConflictException(
        `Un loyer existe déjà pour ${locataire.nom} sur ${libelleMois(donnees.mois)}`,
      );
    }

    const montantDu = donnees.montantDu ?? locataire.loyerMensuel;
    const montantRecu = donnees.montantRecu ?? 0;
    const dateEcheance = donnees.dateEcheance
      ? new Date(donnees.dateEcheance)
      : dateEcheanceDuMois(donnees.mois);
    const statut = calculerStatutLoyer(montantDu, montantRecu, dateEcheance);
    const datePaiement =
      montantRecu > 0
        ? donnees.datePaiement
          ? new Date(donnees.datePaiement)
          : new Date()
        : null;

    return this.prisma.$transaction(async (transaction) => {
      const loyer = await transaction.loyer.create({
        data: {
          locataireId: locataire.id,
          montantDu,
          montantRecu,
          mois: donnees.mois,
          dateEcheance,
          datePaiement,
          modePaiement: donnees.modePaiement ?? 'ESPECES',
          statut,
          reference: genererReference(donnees.mois),
        },
        include: { locataire: { include: { appartement: true } } },
      });

      await transaction.notification.create({
        data: {
          titre: 'Nouveau loyer enregistré',
          contenu: `Le loyer de ${libelleMois(donnees.mois)} est de ${formaterMontant(
            montantDu,
          )}. Échéance le ${dateEcheance.toLocaleDateString('fr-FR')}.`,
          type: 'LOYER',
          destinataire: 'LOCATAIRE',
          locataireId: locataire.id,
          lien: '/Loyers',
        },
      });

      return loyer;
    });
  }

  /** Enregistre un encaissement supplémentaire sur un loyer existant */
  async payer(id: string, donnees: PayerLoyerDto) {
    const loyer = await this.trouver(id);

    if (loyer.statut === 'PAYE') {
      throw new BadRequestException('Ce loyer est déjà entièrement payé');
    }

    const montantRecu = loyer.montantRecu + donnees.montantRecu;
    const statut = calculerStatutLoyer(loyer.montantDu, montantRecu, loyer.dateEcheance);
    const datePaiement = donnees.datePaiement ? new Date(donnees.datePaiement) : new Date();
    const montantVerse = donnees.montantRecu;

    return this.prisma.$transaction(async (transaction) => {
      const loyerMisAJour = await transaction.loyer.update({
        where: { id },
        data: {
          montantRecu,
          statut,
          datePaiement,
          modePaiement: donnees.modePaiement ?? loyer.modePaiement,
        },
        include: { locataire: { include: { appartement: true } } },
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
          lien: '/Loyers',
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

  /** Crée les loyers manquants de tous les locataires actifs pour un mois */
  async generer(donnees: GenererLoyersDto) {
    const { mois } = donnees;

    const locataires = await this.prisma.locataire.findMany({
      where: { actif: true, appartementId: { not: null } },
      include: { appartement: true },
      orderBy: { nom: 'asc' },
    });

    if (locataires.length === 0) {
      throw new BadRequestException(
        'Aucun locataire actif avec appartement : impossible de générer les loyers',
      );
    }

    const loyersExistants = await this.prisma.loyer.findMany({
      where: { mois, locataireId: { in: locataires.map((locataire) => locataire.id) } },
      select: { locataireId: true },
    });

    const dejaGeneres = new Set(loyersExistants.map((loyer) => loyer.locataireId));
    const aGenerer = locataires.filter((locataire) => !dejaGeneres.has(locataire.id));

    const resultat = await this.prisma.$transaction(async (transaction) => {
      for (const locataire of aGenerer) {
        const dateEcheance = dateEcheanceDuMois(mois);

        await transaction.loyer.create({
          data: {
            locataireId: locataire.id,
            montantDu: locataire.loyerMensuel,
            montantRecu: 0,
            mois,
            dateEcheance,
            statut: calculerStatutLoyer(locataire.loyerMensuel, 0, dateEcheance),
            reference: genererReference(mois),
          },
        });

        await transaction.notification.create({
          data: {
            titre: 'Loyer du mois disponible',
            contenu: `Votre loyer de ${libelleMois(mois)} est de ${formaterMontant(
              locataire.loyerMensuel,
            )}. Échéance le ${dateEcheance.toLocaleDateString('fr-FR')}.`,
            type: 'LOYER',
            destinataire: 'LOCATAIRE',
            locataireId: locataire.id,
            lien: '/Loyers',
          },
        });
      }

      await transaction.notification.create({
        data: {
          titre: 'Génération des loyers',
          contenu: `${aGenerer.length} loyer(s) créé(s) pour ${libelleMois(mois)}. ${
            locataires.length - aGenerer.length
          } loyer(s) existaient déjà.`,
          type: 'SYSTEME',
          destinataire: 'ADMIN',
          lien: '/Loyers',
        },
      });

      return {
        mois,
        crees: aGenerer.length,
        ignores: locataires.length - aGenerer.length,
        total: locataires.length,
      };
    });

    return resultat;
  }

  async supprimer(id: string) {
    await this.trouver(id);
    await this.prisma.loyer.delete({ where: { id } });
    return { message: 'Loyer supprimé avec succès' };
  }

  private async marquerLoyersEnRetard() {
    await this.prisma.loyer.updateMany({
      where: {
        statut: 'EN_ATTENTE',
        dateEcheance: { lt: new Date() },
      },
      data: { statut: 'EN_RETARD' },
    });
  }
}
