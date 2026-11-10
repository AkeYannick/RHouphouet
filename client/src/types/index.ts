export type StatutAppartement = 'LIBRE' | 'OCCUPE' | 'EN_TRAVAUX';
export type ModePaiement = 'ESPECES' | 'VIREMENT' | 'MOBILE_MONEY' | 'CARTE';
export type StatutLoyer = 'EN_ATTENTE' | 'PARTIEL' | 'PAYE' | 'EN_RETARD';
export type CategorieCharge =
  | 'ENTRETIEN'
  | 'REPARATION'
  | 'EAU_ELECTRICITE'
  | 'TAXE_IMPOT'
  | 'ASSURANCE'
  | 'AUTRE';
export type TypeNotification = 'LOYER' | 'PAIEMENT' | 'MESSAGE' | 'SYSTEME';
export type DestinataireNotification = 'ADMIN' | 'LOCATAIRE';
export type ExpediteurMessage = 'ADMIN' | 'LOCATAIRE';

export interface Appartement {
  id: string;
  numero: string;
  designation: string | null;
  loyerMensuel: number;
  nombrePieces: number;
  statut: StatutAppartement;
  locataires?: Locataire[];
  charges?: Charge[];
  _count?: { charges: number };
  creeLe: string;
  modifieLe: string;
}

export interface Locataire {
  id: string;
  nom: string;
  telephone: string;
  email: string | null;
  loyerMensuel: number;
  caution: number;
  dateEntree: string;
  actif: boolean;
  appartementId: string | null;
  appartement?: Appartement | null;
  creeLe?: string;
  modifieLe?: string;
}

export interface Loyer {
  id: string;
  locataireId: string;
  locataire?: Locataire;
  montantDu: number;
  montantRecu: number;
  mois: string;
  dateEcheance: string;
  datePaiement: string | null;
  modePaiement: ModePaiement;
  statut: StatutLoyer;
  reference: string | null;
  creeLe: string;
  modifieLe: string;
}

export interface Charge {
  id: string;
  libelle: string;
  categorie: CategorieCharge;
  montant: number;
  date: string;
  appartementId: string | null;
  appartement?: Appartement | null;
  creeLe: string;
}

export interface Notification {
  id: string;
  titre: string;
  contenu: string;
  type: TypeNotification;
  destinataire: DestinataireNotification;
  lu: boolean;
  lien: string | null;
  locataireId: string | null;
  locataire?: { id: string; nom: string } | null;
  creeLe: string;
}

export interface Message {
  id: string;
  locataireId: string;
  expediteur: ExpediteurMessage;
  contenu: string;
  lu: boolean;
  creeLe: string;
}

export interface LocataireResume {
  id: string;
  nom: string;
  telephone: string;
  appartement?: Appartement | null;
}

export interface Conversation {
  locataire: LocataireResume;
  dernierMessage: Message | null;
  nonLus: number;
}

export interface DetailConversation {
  locataire: Locataire;
  messages: Message[];
}

export interface EvolutionMensuelle {
  mois: string;
  revenus: number;
  attendu: number;
  charges: number;
}

export interface LoyerTableau {
  id: string;
  montantDu: number;
  montantRecu: number;
  mois: string;
  dateEcheance: string;
  datePaiement: string | null;
  statut: StatutLoyer;
  locataire: {
    nom: string;
    appartement: { numero: string } | null;
  };
}

export interface TableauDeBord {
  mois: string;
  revenusMois: number;
  chargesMois: number;
  beneficeMois: number;
  montantAttendu: number;
  montantEnRetard: number;
  tauxOccupation: number;
  nombreAppartements: number;
  appartementsOccupes: number;
  nombreLocatairesActifs: number;
  loyersNonSoldes: number;
  loyersEnRetard: number;
  notificationsNonLues: number;
  evolutionMensuelle: EvolutionMensuelle[];
  prochainsPaiements: LoyerTableau[];
  derniersPaiements: LoyerTableau[];
  appartements: Array<{
    id: string;
    numero: string;
    statut: StatutAppartement;
    locataire: string | null;
  }>;
}

export interface DonneesAppartement {
  numero: string;
  designation?: string;
  loyerMensuel: number;
  nombrePieces?: number;
  statut?: StatutAppartement;
}

export interface DonneesLocataire {
  nom: string;
  telephone: string;
  email?: string;
  appartementId?: string;
  loyerMensuel?: number;
  caution?: number;
  dateEntree: string;
}

export interface DonneesLoyer {
  locataireId: string;
  montantDu?: number;
  mois: string;
  dateEcheance?: string;
  montantRecu?: number;
  modePaiement?: ModePaiement;
  datePaiement?: string;
}

export interface DonneesPaiement {
  montantRecu: number;
  modePaiement?: ModePaiement;
  datePaiement?: string;
}

export interface DonneesCharge {
  libelle: string;
  categorie: CategorieCharge;
  montant: number;
  date: string;
  appartementId?: string;
}

export interface DonneesMessage {
  locataireId: string;
  expediteur: ExpediteurMessage;
  contenu: string;
}

export interface ResultatGenerationLoyers {
  mois: string;
  crees: number;
  ignores: number;
  total: number;
}

export interface DonneesConnexion {
  email: string;
  motDePasse: string;
}

export interface ReponseConnexion {
  jeton: string;
  administrateur: { email: string };
  expireLe: string;
}
