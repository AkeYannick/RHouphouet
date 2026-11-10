import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreerAppartementDto, ModifierAppartementDto } from './dto/appartement.dto';

@Injectable()
export class AppartementsService {
  constructor(private readonly prisma: PrismaService) {}

  lister() {
    return this.prisma.appartement.findMany({
      include: {
        locataires: {
          where: { actif: true },
          select: {
            id: true,
            nom: true,
            telephone: true,
            loyerMensuel: true,
            caution: true,
            dateEntree: true,
          },
        },
        _count: { select: { charges: true } },
      },
      orderBy: { numero: 'asc' },
    });
  }

  async trouver(id: string) {
    const appartement = await this.prisma.appartement.findUnique({
      where: { id },
      include: {
        locataires: { where: { actif: true } },
        charges: { orderBy: { date: 'desc' }, take: 10 },
      },
    });

    if (!appartement) {
      throw new NotFoundException('Appartement introuvable');
    }

    return appartement;
  }

  async creer(donnees: CreerAppartementDto) {
    const numero = donnees.numero.trim();

    const doublon = await this.prisma.appartement.findUnique({ where: { numero } });
    if (doublon) {
      throw new ConflictException(`L'appartement « ${numero} » existe déjà`);
    }

    return this.prisma.appartement.create({
      data: {
        numero,
        designation: donnees.designation?.trim() || null,
        loyerMensuel: donnees.loyerMensuel,
        nombrePieces: donnees.nombrePieces ?? 1,
        statut: donnees.statut ?? 'LIBRE',
      },
    });
  }

  async modifier(id: string, donnees: ModifierAppartementDto) {
    await this.trouver(id);

    if (donnees.numero) {
      const numero = donnees.numero.trim();
      const doublon = await this.prisma.appartement.findFirst({
        where: { numero, id: { not: id } },
      });

      if (doublon) {
        throw new ConflictException(`L'appartement « ${numero} » existe déjà`);
      }
    }

    return this.prisma.appartement.update({
      where: { id },
      data: {
        numero: donnees.numero?.trim(),
        designation:
          donnees.designation === undefined ? undefined : donnees.designation.trim() || null,
        loyerMensuel: donnees.loyerMensuel,
        nombrePieces: donnees.nombrePieces,
        statut: donnees.statut,
      },
    });
  }

  async supprimer(id: string) {
    const appartement = await this.trouver(id);

    if (appartement.locataires.length > 0) {
      throw new BadRequestException(
        "Impossible de supprimer un appartement occupé. Retirez d'abord le locataire.",
      );
    }

    await this.prisma.appartement.delete({ where: { id } });

    return { message: 'Appartement supprimé avec succès' };
  }
}
