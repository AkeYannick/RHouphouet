-- CreateEnum
CREATE TYPE "StatutAppartement" AS ENUM ('LIBRE', 'OCCUPE', 'EN_TRAVAUX');

-- CreateEnum
CREATE TYPE "ModePaiement" AS ENUM ('ESPECES', 'VIREMENT', 'MOBILE_MONEY', 'CARTE');

-- CreateEnum
CREATE TYPE "StatutLoyer" AS ENUM ('EN_ATTENTE', 'PARTIEL', 'PAYE', 'EN_RETARD');

-- CreateEnum
CREATE TYPE "CategorieCharge" AS ENUM ('ENTRETIEN', 'REPARATION', 'EAU_ELECTRICITE', 'TAXE_IMPOT', 'ASSURANCE', 'AUTRE');

-- CreateEnum
CREATE TYPE "TypeNotification" AS ENUM ('LOYER', 'PAIEMENT', 'MESSAGE', 'SYSTEME');

-- CreateEnum
CREATE TYPE "DestinataireNotification" AS ENUM ('ADMIN', 'LOCATAIRE');

-- CreateEnum
CREATE TYPE "ExpediteurMessage" AS ENUM ('ADMIN', 'LOCATAIRE');

-- CreateTable
CREATE TABLE "appartements" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "designation" TEXT,
    "loyerMensuel" INTEGER NOT NULL,
    "nombrePieces" INTEGER NOT NULL DEFAULT 1,
    "statut" "StatutAppartement" NOT NULL DEFAULT 'LIBRE',
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appartements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locataires" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "email" TEXT,
    "loyerMensuel" INTEGER NOT NULL,
    "caution" INTEGER NOT NULL DEFAULT 0,
    "dateEntree" TIMESTAMP(3) NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "appartementId" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "locataires_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loyers" (
    "id" TEXT NOT NULL,
    "locataireId" TEXT NOT NULL,
    "montantDu" INTEGER NOT NULL,
    "montantRecu" INTEGER NOT NULL DEFAULT 0,
    "mois" TEXT NOT NULL,
    "dateEcheance" TIMESTAMP(3) NOT NULL,
    "datePaiement" TIMESTAMP(3),
    "modePaiement" "ModePaiement" NOT NULL DEFAULT 'ESPECES',
    "statut" "StatutLoyer" NOT NULL DEFAULT 'EN_ATTENTE',
    "reference" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loyers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "charges" (
    "id" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "categorie" "CategorieCharge" NOT NULL DEFAULT 'AUTRE',
    "montant" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "appartementId" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "charges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "type" "TypeNotification" NOT NULL DEFAULT 'SYSTEME',
    "destinataire" "DestinataireNotification" NOT NULL DEFAULT 'ADMIN',
    "lu" BOOLEAN NOT NULL DEFAULT false,
    "lien" TEXT,
    "locataireId" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "locataireId" TEXT NOT NULL,
    "expediteur" "ExpediteurMessage" NOT NULL,
    "contenu" TEXT NOT NULL,
    "lu" BOOLEAN NOT NULL DEFAULT false,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "appartements_numero_key" ON "appartements"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "locataires_telephone_key" ON "locataires"("telephone");

-- CreateIndex
CREATE UNIQUE INDEX "locataires_email_key" ON "locataires"("email");

-- CreateIndex
CREATE INDEX "locataires_actif_idx" ON "locataires"("actif");

-- CreateIndex
CREATE UNIQUE INDEX "loyers_reference_key" ON "loyers"("reference");

-- CreateIndex
CREATE INDEX "loyers_mois_idx" ON "loyers"("mois");

-- CreateIndex
CREATE INDEX "loyers_statut_idx" ON "loyers"("statut");

-- CreateIndex
CREATE UNIQUE INDEX "loyers_locataireId_mois_key" ON "loyers"("locataireId", "mois");

-- CreateIndex
CREATE INDEX "charges_date_idx" ON "charges"("date");

-- CreateIndex
CREATE INDEX "notifications_destinataire_lu_idx" ON "notifications"("destinataire", "lu");

-- CreateIndex
CREATE INDEX "notifications_locataireId_idx" ON "notifications"("locataireId");

-- CreateIndex
CREATE INDEX "messages_locataireId_creeLe_idx" ON "messages"("locataireId", "creeLe");

-- AddForeignKey
ALTER TABLE "locataires" ADD CONSTRAINT "locataires_appartementId_fkey" FOREIGN KEY ("appartementId") REFERENCES "appartements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyers" ADD CONSTRAINT "loyers_locataireId_fkey" FOREIGN KEY ("locataireId") REFERENCES "locataires"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "charges" ADD CONSTRAINT "charges_appartementId_fkey" FOREIGN KEY ("appartementId") REFERENCES "appartements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_locataireId_fkey" FOREIGN KEY ("locataireId") REFERENCES "locataires"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_locataireId_fkey" FOREIGN KEY ("locataireId") REFERENCES "locataires"("id") ON DELETE CASCADE ON UPDATE CASCADE;
