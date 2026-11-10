import type {
  CategorieCharge,
  ModePaiement,
  StatutAppartement,
  StatutLoyer,
  TypeNotification,
} from '../types';

export const LIBELLES_STATUT_LOYER: Record<StatutLoyer, string> = {
  EN_ATTENTE: 'En attente',
  PARTIEL: 'Partiel',
  PAYE: 'Payé',
  EN_RETARD: 'En retard',
};

export const CLASSES_STATUT_LOYER: Record<StatutLoyer, string> = {
  EN_ATTENTE: 'badge-info',
  PARTIEL: 'badge-warning',
  PAYE: 'badge-success',
  EN_RETARD: 'badge-error',
};

export const LIBELLES_STATUT_APPARTEMENT: Record<StatutAppartement, string> = {
  LIBRE: 'Libre',
  OCCUPE: 'Occupé',
  EN_TRAVAUX: 'En travaux',
};

export const CLASSES_STATUT_APPARTEMENT: Record<StatutAppartement, string> = {
  LIBRE: 'badge-ghost',
  OCCUPE: 'badge-success',
  EN_TRAVAUX: 'badge-warning',
};

export const LIBELLES_MODE_PAIEMENT: Record<ModePaiement, string> = {
  ESPECES: 'Espèces',
  VIREMENT: 'Virement',
  MOBILE_MONEY: 'Mobile Money',
  CARTE: 'Carte bancaire',
};

export const LIBELLES_CATEGORIE_CHARGE: Record<CategorieCharge, string> = {
  ENTRETIEN: 'Entretien',
  REPARATION: 'Réparation',
  EAU_ELECTRICITE: 'Eau / Électricité',
  TAXE_IMPOT: 'Taxe / Impôt',
  ASSURANCE: 'Assurance',
  AUTRE: 'Autre',
};

export const LIBELLES_TYPE_NOTIFICATION: Record<TypeNotification, string> = {
  LOYER: 'Loyer',
  PAIEMENT: 'Paiement',
  MESSAGE: 'Message',
  SYSTEME: 'Système',
};
