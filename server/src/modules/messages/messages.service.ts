import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  EXPEDITEURS_MESSAGE,
  type ExpediteurMessage,
} from '../../common/enums';
import { PrismaService } from '../../prisma/prisma.service';
import { EnvoyerMessageDto } from './dto/message.dto';

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Liste des conversations avec le dernier message et le nombre de non-lus */
  async conversations() {
    const [locataires, compteurs] = await Promise.all([
      this.prisma.locataire.findMany({
        where: { actif: true },
        include: {
          appartement: true,
          messages: { orderBy: { creeLe: 'desc' }, take: 1 },
        },
      }),
      this.prisma.message.groupBy({
        by: ['locataireId'],
        where: { lu: false, expediteur: 'LOCATAIRE' },
        _count: { _all: true },
      }),
    ]);

    const nonLus = new Map(compteurs.map((compteur) => [compteur.locataireId, compteur._count._all]));

    return locataires
      .map((locataire) => ({
        locataire: {
          id: locataire.id,
          nom: locataire.nom,
          telephone: locataire.telephone,
          appartement: locataire.appartement,
        },
        dernierMessage: locataire.messages[0] ?? null,
        nonLus: nonLus.get(locataire.id) ?? 0,
      }))
      .sort((a, b) => {
        const dateA = a.dernierMessage?.creeLe.getTime() ?? 0;
        const dateB = b.dernierMessage?.creeLe.getTime() ?? 0;
        return dateB - dateA;
      });
  }

  async listerParLocataire(locataireId: string) {
    const locataire = await this.prisma.locataire.findUnique({
      where: { id: locataireId },
      include: { appartement: true },
    });

    if (!locataire) {
      throw new NotFoundException('Locataire introuvable');
    }

    const messages = await this.prisma.message.findMany({
      where: { locataireId },
      orderBy: { creeLe: 'asc' },
    });

    return { locataire, messages };
  }

  async envoyer(donnees: EnvoyerMessageDto) {
    const locataire = await this.prisma.locataire.findUnique({
      where: { id: donnees.locataireId },
    });

    if (!locataire) {
      throw new NotFoundException('Locataire introuvable');
    }

    const contenu = donnees.contenu.trim();
    if (!contenu) {
      throw new BadRequestException('Le message ne peut pas être vide');
    }

    return this.prisma.$transaction(async (transaction) => {
      const message = await transaction.message.create({
        data: {
          locataireId: locataire.id,
          expediteur: donnees.expediteur,
          contenu,
        },
      });

      if (donnees.expediteur === 'LOCATAIRE') {
        await transaction.notification.create({
          data: {
            titre: `Nouveau message de ${locataire.nom}`,
            contenu: contenu.length > 120 ? `${contenu.slice(0, 120)}…` : contenu,
            type: 'MESSAGE',
            destinataire: 'ADMIN',
            locataireId: locataire.id,
            lien: '/Messagerie',
          },
        });
      } else {
        await transaction.notification.create({
          data: {
            titre: 'Nouveau message de la gestion',
            contenu: contenu.length > 120 ? `${contenu.slice(0, 120)}…` : contenu,
            type: 'MESSAGE',
            destinataire: 'LOCATAIRE',
            locataireId: locataire.id,
            lien: '/Messagerie',
          },
        });
      }

      return message;
    });
  }

  /** Marque comme lus les messages reçus par le lecteur indiqué */
  async marquerLus(locataireId: string, lecteur: string) {
    if (!EXPEDITEURS_MESSAGE.includes(lecteur as ExpediteurMessage)) {
      throw new BadRequestException('Lecteur invalide');
    }

    const expediteurAMarquer: ExpediteurMessage = lecteur === 'ADMIN' ? 'LOCATAIRE' : 'ADMIN';

    const resultat = await this.prisma.message.updateMany({
      where: { locataireId, expediteur: expediteurAMarquer, lu: false },
      data: { lu: true },
    });

    return { message: 'Messages marqués comme lus', nombre: resultat.count };
  }
}
