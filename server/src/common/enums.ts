export const STATUTS_APPARTEMENT = ['LIBRE', 'OCCUPE', 'EN_TRAVAUX'] as const;
export type StatutAppartement = (typeof STATUTS_APPARTEMENT)[number];

export const MODES_PAIEMENT = ['ESPECES', 'VIREMENT', 'MOBILE_MONEY', 'CARTE'] as const;
export type ModePaiement = (typeof MODES_PAIEMENT)[number];

export const CATEGORIES_CHARGE = [
  'ENTRETIEN',
  'REPARATION',
  'EAU_ELECTRICITE',
  'TAXE_IMPOT',
  'ASSURANCE',
  'AUTRE',
] as const;
export type CategorieCharge = (typeof CATEGORIES_CHARGE)[number];

export const TYPES_NOTIFICATION = ['LOYER', 'PAIEMENT', 'MESSAGE', 'SYSTEME'] as const;
export type TypeNotification = (typeof TYPES_NOTIFICATION)[number];

export const DESTINATAIRES_NOTIFICATION = ['ADMIN', 'LOCATAIRE'] as const;
export type DestinataireNotification = (typeof DESTINATAIRES_NOTIFICATION)[number];

export const EXPEDITEURS_MESSAGE = ['ADMIN', 'LOCATAIRE'] as const;
export type ExpediteurMessage = (typeof EXPEDITEURS_MESSAGE)[number];
