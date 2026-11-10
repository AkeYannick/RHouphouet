import { Injectable } from '@nestjs/common';
import {
  debutDuMois,
  debutMoisSuivant,
  derniersMois,
  moisCourant,
} from '../../common/dates';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TableauDeBordService {
  constructor(private readonly prisma: PrismaService) {}

  async obtenir() {
    const mois = moisCourant();
    const listeMois = derniersMois(6);
    const debutPeriode = debutDuMois(listeMois[0]);
    const finPeriode = debutMoisSuivant(mois);

    const [
      loyersDuMois,
      chargesDuMois,
      appartements,
      nombreLocatairesActifs,
      loyersEnRetard,
      prochainsPaiements,
      derniersPaiements,
      notificationsNonLues,
      loyersPeriode,
      chargesPeriode,
    ] = await Promise.all([
      this.prisma.loyer.findMany({
        where: { mois },
        select: { montantDu: true, montantRecu: true, statut: true },
      }),
      this.prisma.charge.findMany({
        where: { date: { gte: debutDuMois(mois), lt: finPeriode } },
        select: { montant: true },
      }),
      this.prisma.appartement.findMany({
        include: {
          locataires: {
            where: { actif: true },
            select: { id: true, nom: true },
          },
        },
        orderBy: { numero: 'asc' },
      }),
      this.prisma.locataire.count({ where: { actif: true } }),
      this.prisma.loyer.findMany({
        where: { statut: 'EN_RETARD' },
        select: { montantDu: true, montantRecu: true },
      }),
      this.prisma.loyer.findMany({
        where: { statut: { in: ['EN_ATTENTE', 'PARTIEL', 'EN_RETARD'] } },
        include: {
          locataire: {
            select: {
              nom: true,
              appartement: { select: { numero: true } },
            },
          },
        },
        orderBy: { dateEcheance: 'asc' },
        take: 6,
      }),
      this.prisma.loyer.findMany({
        where: { datePaiement: { not: null } },
        include: {
          locataire: {
            select: {
              nom: true,
              appartement: { select: { numero: true } },
            },
          },
        },
        orderBy: { datePaiement: 'desc' },
        take: 6,
      }),
      this.prisma.notification.count({ where: { destinataire: 'ADMIN', lu: false } }),
      this.prisma.loyer.findMany({
        where: { mois: { in: listeMois } },
        select: { mois: true, montantDu: true, montantRecu: true },
      }),
      this.prisma.charge.findMany({
        where: { date: { gte: debutPeriode, lt: finPeriode } },
        select: { date: true, montant: true },
      }),
    ]);

    const revenusMois = loyersDuMois.reduce((total, loyer) => total + loyer.montantRecu, 0);
    const chargesMois = chargesDuMois.reduce((total, charge) => total + charge.montant, 0);
    const montantAttendu = loyersDuMois.reduce(
      (total, loyer) => total + Math.max(loyer.montantDu - loyer.montantRecu, 0),
      0,
    );
    const montantEnRetard = loyersEnRetard.reduce(
      (total, loyer) => total + Math.max(loyer.montantDu - loyer.montantRecu, 0),
      0,
    );
    const loyersNonSoldes = loyersDuMois.filter((loyer) => loyer.statut !== 'PAYE').length;
    const appartementsOccupes = appartements.filter(
      (appartement) => appartement.locataires.length > 0 || appartement.statut === 'OCCUPE',
    ).length;

    const evolutionMensuelle = listeMois.map((moisCourantPeriode) => {
      const loyers = loyersPeriode.filter((loyer) => loyer.mois === moisCourantPeriode);
      const revenus = loyers.reduce((total, loyer) => total + loyer.montantRecu, 0);
      const attendu = loyers.reduce((total, loyer) => total + loyer.montantDu, 0);
      const charges = chargesPeriode
        .filter((charge) => {
          const cle = `${charge.date.getUTCFullYear()}-${String(charge.date.getUTCMonth() + 1).padStart(2, '0')}`;
          return cle === moisCourantPeriode;
        })
        .reduce((total, charge) => total + charge.montant, 0);

      return { mois: moisCourantPeriode, revenus, attendu, charges };
    });

    return {
      mois,
      revenusMois,
      chargesMois,
      beneficeMois: revenusMois - chargesMois,
      montantAttendu,
      montantEnRetard,
      tauxOccupation:
        appartements.length > 0
          ? Math.round((appartementsOccupes / appartements.length) * 100)
          : 0,
      nombreAppartements: appartements.length,
      appartementsOccupes,
      nombreLocatairesActifs,
      loyersNonSoldes,
      loyersEnRetard: loyersEnRetard.length,
      notificationsNonLues,
      evolutionMensuelle,
      prochainsPaiements,
      derniersPaiements,
      appartements: appartements.map((appartement) => ({
        id: appartement.id,
        numero: appartement.numero,
        statut: appartement.statut,
        locataire: appartement.locataires[0]?.nom ?? null,
      })),
    };
  }
}
