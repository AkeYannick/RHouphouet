import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import type { Prisma } from '../../generated/prisma/client';
import { STATUTS_CONTRAT, type StatutContrat } from '../../common/enums';
import { PrismaService } from '../../prisma/prisma.service';
import { CreerContratDto, ModifierContratDto } from './dto/contrat.dto';

function formaterMontant(montant: number): string {
  return `${new Intl.NumberFormat('fr-FR').format(montant)} FCFA`;
}

function genererNumeroContrat(dateDebut: Date): string {
  const suffixe = randomBytes(3).toString('hex').toUpperCase();
  return `CT-${dateDebut.getFullYear()}-${suffixe}`;
}

@Injectable()
export class ContratsService {
  constructor(private readonly prisma: PrismaService) {}

  async lister(filtres: { statut?: string; locataireId?: string } = {}) {
    const where: Prisma.ContratWhereInput = {};

    if (filtres.statut) {
      if (!STATUTS_CONTRAT.includes(filtres.statut as StatutContrat)) {
        throw new BadRequestException('Statut de contrat invalide');
      }
      where.statut = filtres.statut as StatutContrat;
    }

    if (filtres.locataireId) {
      where.locataireId = filtres.locataireId;
    }

    return this.prisma.contrat.findMany({
      where,
      include: { locataire: true, appartement: true },
      orderBy: [{ dateDebut: 'desc' }, { creeLe: 'desc' }],
    });
  }

  async trouver(id: string) {
    const contrat = await this.prisma.contrat.findUnique({
      where: { id },
      include: { locataire: true, appartement: true },
    });

    if (!contrat) {
      throw new NotFoundException('Contrat introuvable');
    }

    return contrat;
  }

  /** Contrat actif d'un locataire (utilisé par l'espace locataire) */
  trouverActif(locataireId: string) {
    return this.prisma.contrat.findFirst({
      where: { locataireId, statut: 'ACTIF' },
      include: { locataire: true, appartement: true },
      orderBy: { dateDebut: 'desc' },
    });
  }

  async creer(donnees: CreerContratDto) {
    const locataire = await this.prisma.locataire.findUnique({
      where: { id: donnees.locataireId },
      include: { appartement: true },
    });

    if (!locataire) {
      throw new NotFoundException('Locataire introuvable');
    }

    const statut = donnees.statut ?? 'ACTIF';
    const appartementId = donnees.appartementId ?? locataire.appartementId ?? null;

    if (appartementId) {
      const appartement = await this.prisma.appartement.findUnique({
        where: { id: appartementId },
      });

      if (!appartement) {
        throw new NotFoundException('Appartement introuvable');
      }
    }

    if (statut === 'ACTIF') {
      const contratActif = await this.prisma.contrat.findFirst({
        where: { locataireId: locataire.id, statut: 'ACTIF' },
      });

      if (contratActif) {
        throw new ConflictException(
          `${locataire.nom} dispose déjà d'un contrat actif (${contratActif.numero})`,
        );
      }
    }

    const dateDebut = donnees.dateDebut ? new Date(donnees.dateDebut) : new Date();
    const dateFin = donnees.dateFin ? new Date(donnees.dateFin) : null;

    if (dateFin && dateFin < dateDebut) {
      throw new BadRequestException('La date de fin doit être postérieure à la date de début');
    }

    const loyerMensuel = donnees.loyerMensuel ?? locataire.loyerMensuel;

    return this.prisma.$transaction(async (transaction) => {
      const contrat = await transaction.contrat.create({
        data: {
          numero: genererNumeroContrat(dateDebut),
          locataireId: locataire.id,
          appartementId,
          dateDebut,
          dateFin,
          loyerMensuel,
          caution: donnees.caution ?? locataire.caution,
          chargesMensuelles: donnees.chargesMensuelles ?? 0,
          statut,
          clauses: donnees.clauses?.trim() || null,
        },
        include: { locataire: true, appartement: true },
      });

      await transaction.notification.create({
        data: {
          titre: 'Nouveau contrat de location',
          contenu: `Le contrat ${contrat.numero} a été créé pour ${locataire.nom} (loyer ${formaterMontant(
            loyerMensuel,
          )}/mois).`,
          type: 'SYSTEME',
          destinataire: 'ADMIN',
          locataireId: locataire.id,
          lien: '/Contrats',
        },
      });

      if (statut === 'ACTIF') {
        await transaction.notification.create({
          data: {
            titre: 'Votre contrat de location',
            contenu: `Votre contrat ${contrat.numero} est actif depuis le ${dateDebut.toLocaleDateString(
              'fr-FR',
            )}. Loyer mensuel : ${formaterMontant(loyerMensuel)}.`,
            type: 'SYSTEME',
            destinataire: 'LOCATAIRE',
            locataireId: locataire.id,
            lien: '/Contrat',
          },
        });
      }

      return contrat;
    });
  }

  async modifier(id: string, donnees: ModifierContratDto) {
    const existant = await this.trouver(id);

    if (donnees.appartementId) {
      const appartement = await this.prisma.appartement.findUnique({
        where: { id: donnees.appartementId },
      });

      if (!appartement) {
        throw new NotFoundException('Appartement introuvable');
      }
    }

    if (donnees.statut === 'ACTIF' && existant.statut !== 'ACTIF') {
      const contratActif = await this.prisma.contrat.findFirst({
        where: { locataireId: existant.locataireId, statut: 'ACTIF', id: { not: id } },
      });

      if (contratActif) {
        throw new ConflictException(
          `${existant.locataire.nom} dispose déjà du contrat actif ${contratActif.numero}`,
        );
      }
    }

    const dateDebut = donnees.dateDebut ? new Date(donnees.dateDebut) : existant.dateDebut;
    let dateFin =
      donnees.dateFin === undefined
        ? existant.dateFin
        : donnees.dateFin
          ? new Date(donnees.dateFin)
          : null;

    if (
      donnees.statut &&
      donnees.statut !== 'ACTIF' &&
      !dateFin &&
      existant.statut === 'ACTIF'
    ) {
      dateFin = new Date();
    }

    if (dateFin && dateFin < dateDebut) {
      throw new BadRequestException('La date de fin doit être postérieure à la date de début');
    }

    return this.prisma.$transaction(async (transaction) => {
      const contrat = await transaction.contrat.update({
        where: { id },
        data: {
          appartementId: donnees.appartementId === undefined ? undefined : donnees.appartementId,
          dateDebut,
          dateFin,
          loyerMensuel: donnees.loyerMensuel,
          caution: donnees.caution,
          chargesMensuelles: donnees.chargesMensuelles,
          statut: donnees.statut,
          clauses:
            donnees.clauses === undefined ? undefined : donnees.clauses.trim() || null,
        },
        include: { locataire: true, appartement: true },
      });

      if (donnees.statut && donnees.statut !== existant.statut) {
        const libelleStatut =
          donnees.statut === 'ACTIF'
            ? 'activé'
            : donnees.statut === 'TERMINE'
              ? 'terminé'
              : 'résilié';

        await transaction.notification.create({
          data: {
            titre: 'Mise à jour de votre contrat',
            contenu: `Votre contrat ${contrat.numero} a été ${libelleStatut}.`,
            type: 'SYSTEME',
            destinataire: 'LOCATAIRE',
            locataireId: existant.locataireId,
            lien: '/Contrat',
          },
        });
      }

      return contrat;
    });
  }

  async supprimer(id: string) {
    await this.trouver(id);
    await this.prisma.contrat.delete({ where: { id } });
    return { message: 'Contrat supprimé avec succès' };
  }
}
