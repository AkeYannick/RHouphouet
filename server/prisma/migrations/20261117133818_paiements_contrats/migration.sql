-- CreateEnum
CREATE TYPE "StatutContrat" AS ENUM ('ACTIF', 'TERMINE', 'RESILIE');

-- CreateTable
CREATE TABLE "paiements" (
    "id" TEXT NOT NULL,
    "locataireId" TEXT NOT NULL,
    "loyerId" TEXT NOT NULL,
    "montant" INTEGER NOT NULL,
    "modePaiement" "ModePaiement" NOT NULL DEFAULT 'ESPECES',
    "datePaiement" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reference" TEXT NOT NULL,
    "note" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "paiements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contrats" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "locataireId" TEXT NOT NULL,
    "appartementId" TEXT,
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "dateFin" TIMESTAMP(3),
    "loyerMensuel" INTEGER NOT NULL,
    "caution" INTEGER NOT NULL DEFAULT 0,
    "chargesMensuelles" INTEGER NOT NULL DEFAULT 0,
    "statut" "StatutContrat" NOT NULL DEFAULT 'ACTIF',
    "clauses" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contrats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "paiements_reference_key" ON "paiements"("reference");

-- CreateIndex
CREATE INDEX "paiements_locataireId_datePaiement_idx" ON "paiements"("locataireId", "datePaiement");

-- CreateIndex
CREATE INDEX "paiements_loyerId_idx" ON "paiements"("loyerId");

-- CreateIndex
CREATE UNIQUE INDEX "contrats_numero_key" ON "contrats"("numero");

-- CreateIndex
CREATE INDEX "contrats_locataireId_statut_idx" ON "contrats"("locataireId", "statut");

-- AddForeignKey
ALTER TABLE "paiements" ADD CONSTRAINT "paiements_locataireId_fkey" FOREIGN KEY ("locataireId") REFERENCES "locataires"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paiements" ADD CONSTRAINT "paiements_loyerId_fkey" FOREIGN KEY ("loyerId") REFERENCES "loyers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contrats" ADD CONSTRAINT "contrats_locataireId_fkey" FOREIGN KEY ("locataireId") REFERENCES "locataires"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contrats" ADD CONSTRAINT "contrats_appartementId_fkey" FOREIGN KEY ("appartementId") REFERENCES "appartements"("id") ON DELETE SET NULL ON UPDATE CASCADE;
