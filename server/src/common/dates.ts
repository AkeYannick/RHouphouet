/** Format attendu pour un mois : AAAA-MM (exemple : 2026-11) */
export const MOTIF_MOIS = /^\d{4}-(0[1-9]|1[0-2])$/;

export function estMoisValide(mois: string): boolean {
  return MOTIF_MOIS.test(mois);
}

/** Retourne le mois courant au format AAAA-MM */
export function moisCourant(base: Date = new Date()): string {
  return `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, '0')}`;
}

/** Retourne un mois décalé de N mois par rapport à une date de référence */
export function moisDecale(decalage: number, base: Date = new Date()): string {
  const date = new Date(base.getFullYear(), base.getMonth() + decalage, 1);
  return moisCourant(date);
}

/** Liste les N derniers mois, du plus ancien au plus récent */
export function derniersMois(nombre: number, base: Date = new Date()): string[] {
  return Array.from({ length: nombre }, (_, index) => moisDecale(index - (nombre - 1), base));
}

/** Date d'échéance d'un loyer (le 5 du mois par défaut) */
export function dateEcheanceDuMois(mois: string, jour = 5): Date {
  const [annee, numeroMois] = mois.split('-').map(Number);
  return new Date(Date.UTC(annee, numeroMois - 1, jour));
}

/** Premier instant du mois (inclus) */
export function debutDuMois(mois: string): Date {
  const [annee, numeroMois] = mois.split('-').map(Number);
  return new Date(Date.UTC(annee, numeroMois - 1, 1));
}

/** Premier instant du mois suivant (exclu) */
export function debutMoisSuivant(mois: string): Date {
  const [annee, numeroMois] = mois.split('-').map(Number);
  return new Date(Date.UTC(annee, numeroMois, 1));
}

/** Libellé français d'un mois (exemple : novembre 2026) */
export function libelleMois(mois: string): string {
  const [annee, numeroMois] = mois.split('-').map(Number);
  return new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(
    new Date(Date.UTC(annee, numeroMois - 1, 1)),
  );
}
