import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client';
import {
  DESTINATAIRES_NOTIFICATION,
  type DestinataireNotification,
} from '../../common/enums';
import { PrismaService } from '../../prisma/prisma.service';

export interface FiltresNotifications {
  destinataire?: string;
  nonLues?: string | boolean;
  locataireId?: string;
  limite?: number;
}

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  lister(filtres: FiltresNotifications) {
    const where: Prisma.NotificationWhereInput = {};

    if (filtres.destinataire) {
      this.verifierDestinataire(filtres.destinataire);
      where.destinataire = filtres.destinataire as DestinataireNotification;
    }

    if (filtres.nonLues === true || filtres.nonLues === 'true') {
      where.lu = false;
    }

    if (filtres.locataireId) {
      where.locataireId = filtres.locataireId;
    }

    return this.prisma.notification.findMany({
      where,
      include: { locataire: { select: { id: true, nom: true } } },
      orderBy: { creeLe: 'desc' },
      take: filtres.limite && filtres.limite > 0 ? filtres.limite : 100,
    });
  }

  async compterNonLues(destinataire: string, locataireId?: string) {
    this.verifierDestinataire(destinataire);

    const nombre = await this.prisma.notification.count({
      where: {
        destinataire: destinataire as DestinataireNotification,
        lu: false,
        ...(locataireId ? { locataireId } : {}),
      },
    });

    return { nombre };
  }

  async marquerLue(id: string) {
    const notification = await this.prisma.notification.findUnique({ where: { id } });

    if (!notification) {
      throw new NotFoundException('Notification introuvable');
    }

    return this.prisma.notification.update({
      where: { id },
      data: { lu: true },
    });
  }

  async marquerToutesLues(destinataire: string, locataireId?: string) {
    this.verifierDestinataire(destinataire);

    const resultat = await this.prisma.notification.updateMany({
      where: {
        destinataire: destinataire as DestinataireNotification,
        lu: false,
        ...(locataireId ? { locataireId } : {}),
      },
      data: { lu: true },
    });

    return { message: 'Notifications marquées comme lues', nombre: resultat.count };
  }

  async supprimer(id: string) {
    const notification = await this.prisma.notification.findUnique({ where: { id } });

    if (!notification) {
      throw new NotFoundException('Notification introuvable');
    }

    await this.prisma.notification.delete({ where: { id } });
    return { message: 'Notification supprimée avec succès' };
  }

  private verifierDestinataire(destinataire: string) {
    if (!DESTINATAIRES_NOTIFICATION.includes(destinataire as DestinataireNotification)) {
      throw new BadRequestException('Destinataire de notification invalide');
    }
  }
}
