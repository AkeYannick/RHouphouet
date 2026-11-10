export type StatutLoyer = 'EN_ATTENTE' | 'PARTIEL' | 'PAYE' | 'EN_RETARD';

export const STATUTS_LOYER: StatutLoyer[] = ['EN_ATTENTE', 'PARTIEL', 'PAYE', 'EN_RETARD'];

/**
 * Détermine le statut d'un loyer à partir des montants et de l'échéance.
 * Un loyer partiellement réglé reste « partiel » même après l'échéance
 * afin de conserver la trace du versement déjà reçu.
 */
export function calculerStatutLoyer(
  montantDu: number,
  montantRecu: number,
  echeance: Date,
): StatutLoyer {
  if (montantRecu >= montantDu) {
    return 'PAYE';
  }

  if (montantRecu > 0) {
    return 'PARTIEL';
  }

  return echeance.getTime() < Date.now() ? 'EN_RETARD' : 'EN_ATTENTE';
}

/** Génère une référence unique et lisible pour un paiement de loyer */
export function genererReference(mois: string): string {
  const identifiant = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `LOY-${mois.replace('-', '')}-${identifiant}`;
}
