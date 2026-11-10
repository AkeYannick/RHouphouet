import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreerChargeDto } from './dto/charge.dto';

@Injectable()
export class ChargesService {
  constructor(private readonly prisma: PrismaService) {}

  lister() {
    return this.prisma.charge.findMany({
      include: { appartement: true },
      orderBy: { date: 'desc' },
    });
  }

  async creer(donnees: CreerChargeDto) {
    if (donnees.appartementId) {
      const appartement = await this.prisma.appartement.findUnique({
        where: { id: donnees.appartementId },
      });

      if (!appartement) {
        throw new NotFoundException('Appartement introuvable');
      }
    }

    return this.prisma.charge.create({
      data: {
        libelle: donnees.libelle.trim(),
        categorie: donnees.categorie ?? 'AUTRE',
        montant: donnees.montant,
        date: new Date(donnees.date),
        appartementId: donnees.appartementId ?? null,
      },
      include: { appartement: true },
    });
  }

  async supprimer(id: string) {
    const charge = await this.prisma.charge.findUnique({ where: { id } });

    if (!charge) {
      throw new NotFoundException('Charge introuvable');
    }

    await this.prisma.charge.delete({ where: { id } });
    return { message: 'Charge supprimée avec succès' };
  }
}
