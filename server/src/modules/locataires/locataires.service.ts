import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreerLocataireDto, ModifierLocataireDto } from './dto/locataire.dto';

@Injectable()
export class LocatairesService {
  constructor(private readonly prisma: PrismaService) {}

  lister(actifsSeulement = true) {
    return this.prisma.locataire.findMany({
      where: actifsSeulement ? { actif: true } : undefined,
      include: { appartement: true },
      orderBy: { nom: 'asc' },
    });
  }

  async trouver(id: string) {
    const locataire = await this.prisma.locataire.findUnique({
      where: { id },
      include: { appartement: true },
    });

    if (!locataire) {
      throw new NotFoundException('Locataire introuvable');
    }

    return locataire;
  }

  async creer(donnees: CreerLocataireDto) {
    const dateEntree = new Date(donnees.dateEntree);
    if (Number.isNaN(dateEntree.getTime())) {
      throw new BadRequestException("La date d'entrée est invalide");
    }

    const telephone = donnees.telephone.trim();
    const email = donnees.email?.trim().toLowerCase() || null;

    return this.prisma.$transaction(async (transaction) => {
      let appartement = null;

      if (donnees.appartementId) {
        appartement = await transaction.appartement.findUnique({
          where: { id: donnees.appartementId },
        });

        if (!appartement) {
          throw new NotFoundException('Appartement introuvable');
        }

        const occupant = await transaction.locataire.findFirst({
          where: { appartementId: appartement.id, actif: true },
        });

        if (occupant) {
          throw new ConflictException(
            `L'appartement « ${appartement.numero} » est déjà occupé par ${occupant.nom}`,
          );
        }
      }

      const loyerMensuel = donnees.loyerMensuel ?? appartement?.loyerMensuel;
      if (loyerMensuel === undefined) {
        throw new BadRequestException(
          'Le loyer mensuel est obligatoire lorsqu’aucun appartement n’est sélectionné',
        );
      }

      const doublon = await transaction.locataire.findUnique({ where: { telephone } });
      if (doublon) {
        throw new ConflictException(`Le numéro de téléphone ${telephone} est déjà utilisé`);
      }

      if (email) {
        const emailExistant = await transaction.locataire.findUnique({ where: { email } });
        if (emailExistant) {
          throw new ConflictException(`L'adresse e-mail ${email} est déjà utilisée`);
        }
      }

      const locataire = await transaction.locataire.create({
        data: {
          nom: donnees.nom.trim(),
          telephone,
          email,
          loyerMensuel,
          caution: donnees.caution ?? 0,
          dateEntree,
          appartementId: appartement?.id ?? null,
        },
        include: { appartement: true },
      });

      if (appartement) {
        await transaction.appartement.update({
          where: { id: appartement.id },
          data: { statut: 'OCCUPE' },
        });
      }

      await transaction.notification.create({
        data: {
          titre: 'Nouveau locataire',
          contenu: `${locataire.nom} a été ajouté${
            appartement ? ` à l'appartement ${appartement.numero}` : ''
          }.`,
          type: 'SYSTEME',
          destinataire: 'ADMIN',
          lien: '/Locataires',
        },
      });

      return locataire;
    });
  }

  async modifier(id: string, donnees: ModifierLocataireDto) {
    const existant = await this.trouver(id);

    const telephone = donnees.telephone?.trim();
    if (telephone) {
      const doublon = await this.prisma.locataire.findFirst({
        where: { telephone, id: { not: id } },
      });

      if (doublon) {
        throw new ConflictException(`Le numéro de téléphone ${telephone} est déjà utilisé`);
      }
    }

    const email = donnees.email === undefined ? undefined : donnees.email.trim().toLowerCase() || null;
    if (email) {
      const emailExistant = await this.prisma.locataire.findFirst({
        where: { email, id: { not: id } },
      });

      if (emailExistant) {
        throw new ConflictException(`L'adresse e-mail ${email} est déjà utilisée`);
      }
    }

    const dateEntree = donnees.dateEntree ? new Date(donnees.dateEntree) : undefined;
    if (dateEntree && Number.isNaN(dateEntree.getTime())) {
      throw new BadRequestException("La date d'entrée est invalide");
    }

    const ancienAppartementId = existant.appartementId;
    const nouvelAppartementId = donnees.appartementId ?? ancienAppartementId;
    const changementAppartement = nouvelAppartementId !== ancienAppartementId;

    return this.prisma.$transaction(async (transaction) => {
      if (changementAppartement && nouvelAppartementId) {
        const appartement = await transaction.appartement.findUnique({
          where: { id: nouvelAppartementId },
        });

        if (!appartement) {
          throw new NotFoundException('Appartement introuvable');
        }

        const occupant = await transaction.locataire.findFirst({
          where: { appartementId: nouvelAppartementId, actif: true, id: { not: id } },
        });

        if (occupant) {
          throw new ConflictException(
            `L'appartement « ${appartement.numero} » est déjà occupé par ${occupant.nom}`,
          );
        }
      }

      const locataire = await transaction.locataire.update({
        where: { id },
        data: {
          nom: donnees.nom?.trim(),
          telephone,
          email,
          loyerMensuel: donnees.loyerMensuel,
          caution: donnees.caution,
          dateEntree,
          appartementId: nouvelAppartementId,
        },
        include: { appartement: true },
      });

      if (changementAppartement && ancienAppartementId) {
        await transaction.appartement.update({
          where: { id: ancienAppartementId },
          data: { statut: 'LIBRE' },
        });
      }

      if (changementAppartement && nouvelAppartementId) {
        await transaction.appartement.update({
          where: { id: nouvelAppartementId },
          data: { statut: 'OCCUPE' },
        });
      }

      return locataire;
    });
  }

  /**
   * Le locataire est archivé plutôt que supprimé physiquement :
   * les loyers, messages et charges restent disponibles dans l'historique.
   */
  async supprimer(id: string) {
    const locataire = await this.trouver(id);
    const ancienAppartementId = locataire.appartementId;

    await this.prisma.$transaction(async (transaction) => {
      await transaction.locataire.update({
        where: { id },
        data: { actif: false, appartementId: null },
      });

      if (ancienAppartementId) {
        await transaction.appartement.update({
          where: { id: ancienAppartementId },
          data: { statut: 'LIBRE' },
        });
      }

      await transaction.notification.create({
        data: {
          titre: 'Locataire retiré',
          contenu: `${locataire.nom} a été retiré de la gestion locative. Son historique est conservé.`,
          type: 'SYSTEME',
          destinataire: 'ADMIN',
          lien: '/Locataires',
        },
      });
    });

    return { message: 'Locataire retiré avec succès' };
  }
}
