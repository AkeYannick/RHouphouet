import 'dotenv/config';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '../src/generated/prisma/client';

const adaptateur = new PrismaNeon({
  connectionString: process.env.DATABASE_URL ?? '',
});
const prisma = new PrismaClient({ adapter: adaptateur });

/* Retourne un mois au format AAAA-MM avec un décalage éventuel */
function obtenirMois(decalage = 0): string {
  const date = new Date();
  date.setDate(1);
  date.setMonth(date.getMonth() + decalage);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/* Construit une date au format ISO à partir d'un mois et d'un jour */
function dateDuMois(mois: string, jour: number): Date {
  const [annee, numeroMois] = mois.split('-').map(Number);
  return new Date(Date.UTC(annee, numeroMois - 1, jour));
}

async function principal() {
  console.log('Initialisation des données de démonstration...');

  const appartements = [
    {
      numero: 'Apt 01',
      designation: 'Appartement 2 pièces - Rez-de-chaussée',
      loyerMensuel: 150000,
      nombrePieces: 2,
      statut: 'OCCUPE' as const,
    },
    {
      numero: 'Apt 02',
      designation: 'Appartement 3 pièces - 1er étage',
      loyerMensuel: 220000,
      nombrePieces: 3,
      statut: 'OCCUPE' as const,
    },
    {
      numero: 'Apt 03',
      designation: 'Studio - 1er étage',
      loyerMensuel: 90000,
      nombrePieces: 1,
      statut: 'LIBRE' as const,
    },
  ];

  for (const appartement of appartements) {
    await prisma.appartement.upsert({
      where: { numero: appartement.numero },
      update: {
        designation: appartement.designation,
        loyerMensuel: appartement.loyerMensuel,
        nombrePieces: appartement.nombrePieces,
        statut: appartement.statut,
      },
      create: appartement,
    });
  }

  const apt01 = await prisma.appartement.findUniqueOrThrow({ where: { numero: 'Apt 01' } });
  const apt02 = await prisma.appartement.findUniqueOrThrow({ where: { numero: 'Apt 02' } });

  const locataires = [
    {
      nom: 'Awa Koné',
      telephone: '+225 07 08 09 10 11',
      email: 'awa.kone@example.com',
      loyerMensuel: apt01.loyerMensuel,
      caution: 300000,
      dateEntree: dateDuMois(obtenirMois(-8), 1),
      appartementId: apt01.id,
    },
    {
      nom: 'Yao Bamba',
      telephone: '+225 05 04 03 02 01',
      email: 'yao.bamba@example.com',
      loyerMensuel: apt02.loyerMensuel,
      caution: 440000,
      dateEntree: dateDuMois(obtenirMois(-5), 15),
      appartementId: apt02.id,
    },
  ];

  for (const locataire of locataires) {
    const enregistre = await prisma.locataire.upsert({
      where: { telephone: locataire.telephone },
      update: {
        nom: locataire.nom,
        email: locataire.email,
        loyerMensuel: locataire.loyerMensuel,
        caution: locataire.caution,
        dateEntree: locataire.dateEntree,
        appartementId: locataire.appartementId,
        actif: true,
      },
      create: locataire,
    });

    const moisPrecedent = obtenirMois(-1);
    const moisCourant = obtenirMois(0);

    await prisma.loyer.upsert({
      where: { locataireId_mois: { locataireId: enregistre.id, mois: moisPrecedent } },
      update: {},
      create: {
        locataireId: enregistre.id,
        montantDu: locataire.loyerMensuel,
        montantRecu: locataire.loyerMensuel,
        mois: moisPrecedent,
        dateEcheance: dateDuMois(moisPrecedent, 5),
        datePaiement: dateDuMois(moisPrecedent, 4),
        modePaiement: 'MOBILE_MONEY',
        statut: 'PAYE',
        reference: `LOY-${moisPrecedent.replace('-', '')}-${enregistre.id.slice(0, 4).toUpperCase()}`,
      },
    });

    await prisma.loyer.upsert({
      where: { locataireId_mois: { locataireId: enregistre.id, mois: moisCourant } },
      update: {},
      create: {
        locataireId: enregistre.id,
        montantDu: locataire.loyerMensuel,
        montantRecu: 0,
        mois: moisCourant,
        dateEcheance: dateDuMois(moisCourant, 5),
        statut: 'EN_ATTENTE',
        reference: `LOY-${moisCourant.replace('-', '')}-${enregistre.id.slice(0, 4).toUpperCase()}`,
      },
    });

    const nombreMessages = await prisma.message.count({ where: { locataireId: enregistre.id } });
    if (nombreMessages === 0) {
      await prisma.message.createMany({
        data: [
          {
            locataireId: enregistre.id,
            expediteur: 'LOCATAIRE',
            contenu: 'Bonjour, je souhaite signaler une petite fuite sous l’évier de la cuisine.',
            creeLe: new Date(Date.now() - 1000 * 60 * 60 * 26),
          },
          {
            locataireId: enregistre.id,
            expediteur: 'ADMIN',
            contenu: 'Bonjour, merci pour l’information. Un plombier passera demain matin.',
            lu: true,
            creeLe: new Date(Date.now() - 1000 * 60 * 60 * 25),
          },
        ],
      });
    }
  }

  const charges = [
    { libelle: 'Facture d’eau et électricité', categorie: 'EAU_ELECTRICITE' as const, montant: 45000, appartementId: null },
    { libelle: 'Réparation de la plomberie', categorie: 'REPARATION' as const, montant: 60000, appartementId: apt01.id },
    { libelle: 'Entretien des parties communes', categorie: 'ENTRETIEN' as const, montant: 25000, appartementId: null },
  ];

  for (const charge of charges) {
    const existante = await prisma.charge.findFirst({ where: { libelle: charge.libelle } });
    if (!existante) {
      await prisma.charge.create({
        data: { ...charge, date: dateDuMois(obtenirMois(0), 3) },
      });
    }
  }

  const notificationExistante = await prisma.notification.findFirst({
    where: { destinataire: 'ADMIN', type: 'SYSTEME' },
  });
  if (!notificationExistante) {
    await prisma.notification.create({
      data: {
        titre: 'Bienvenue sur R. Houphouet',
        contenu:
          'Votre espace de gestion locative est prêt. Pensez à générer les loyers du mois depuis la page Loyers.',
        type: 'SYSTEME',
        destinataire: 'ADMIN',
        lien: '/Loyers',
      },
    });
  }

  console.log('Données de démonstration créées avec succès.');
}

principal()
  .catch((erreur) => {
    console.error('Échec du remplissage de la base :', erreur);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
