import type {
  Appartement,
  Charge,
  Conversation,
  DetailConversation,
  DonneesAppartement,
  DonneesCharge,
  DonneesConnexion,
  DonneesLocataire,
  DonneesLoyer,
  DonneesMessage,
  DonneesPaiement,
  Locataire,
  Loyer,
  Message,
  Notification,
  ReponseConnexion,
  ResultatGenerationLoyers,
  StatutLoyer,
  TableauDeBord,
} from '../types';
import { effacerSession, lireJeton } from './session';

// VITE_API_URL peut être fourni avec ou sans le préfixe /api.
function normaliserUrlApi(valeur: string): string {
  const base = valeur.trim().replace(/\/+$/, '');
  return base.endsWith('/api') ? base : `${base}/api`;
}

const urlConfiguree = (import.meta.env.VITE_API_URL ?? '').trim();
const URL_API = normaliserUrlApi(urlConfiguree || 'http://localhost:5000/api');

export class ErreurApi extends Error {
  readonly statut: number;

  constructor(message: string, statut = 0) {
    super(message);
    this.name = 'ErreurApi';
    this.statut = statut;
  }
}

function extraireMessage(donnees: unknown): string | null {
  if (typeof donnees === 'string') {
    return donnees;
  }

  if (donnees && typeof donnees === 'object' && 'message' in donnees) {
    const message = (donnees as { message: unknown }).message;

    if (Array.isArray(message)) {
      return message.join(' · ');
    }

    if (typeof message === 'string') {
      return message;
    }
  }

  return null;
}

function construireAdresse(
  chemin: string,
  parametres: Record<string, string | number | boolean | undefined> = {},
): string {
  const recherche = new URLSearchParams();

  Object.entries(parametres).forEach(([cle, valeur]) => {
    if (valeur !== undefined && valeur !== '') {
      recherche.set(cle, String(valeur));
    }
  });

  const suffixe = recherche.toString();
  return suffixe ? `${chemin}?${suffixe}` : chemin;
}

async function requete<T>(chemin: string, options: RequestInit = {}): Promise<T> {
  const entetes = new Headers(options.headers);

  if (!entetes.has('Content-Type')) {
    entetes.set('Content-Type', 'application/json');
  }

  const jeton = lireJeton();
  if (jeton && !entetes.has('Authorization')) {
    entetes.set('Authorization', `Bearer ${jeton}`);
  }

  let reponse: Response;

  try {
    reponse = await fetch(`${URL_API}${chemin}`, { ...options, headers: entetes });
  } catch {
    throw new ErreurApi(
      'Le service est momentanément indisponible. Veuillez réessayer dans un instant.',
    );
  }

  if (reponse.status === 204) {
    return undefined as T;
  }

  const texte = await reponse.text();
  let donnees: unknown = null;

  if (texte) {
    try {
      donnees = JSON.parse(texte);
    } catch {
      donnees = texte;
    }
  }

  if (!reponse.ok) {
    const estConnexion = chemin === '/auth/connexion';

    if (reponse.status === 401 && !estConnexion) {
      effacerSession();
      window.dispatchEvent(new Event('rhouphouet:session-expiree'));
    }

    let message: string;

    if (reponse.status === 401 && !estConnexion) {
      message = 'Votre session a expiré. Veuillez vous reconnecter.';
    } else if (reponse.status >= 500) {
      message = 'Le service est momentanément indisponible. Veuillez réessayer dans un instant.';
    } else {
      message =
        extraireMessage(donnees) ??
        'La demande n’a pas pu aboutir. Veuillez réessayer dans un instant.';
    }

    throw new ErreurApi(message, reponse.status);
  }

  return donnees as T;
}

export const api = {
  auth: {
    connexion: (donnees: DonneesConnexion) =>
      requete<ReponseConnexion>('/auth/connexion', {
        method: 'POST',
        body: JSON.stringify(donnees),
      }),
    deconnexion: () =>
      requete<{ message: string }>('/auth/deconnexion', { method: 'POST' }),
    profil: () =>
      requete<{ email: string | null; expireLe: string | null }>('/auth/profil'),
  },

  sante: () => requete<{ statut: string }>('/sante'),

  tableauDeBord: {
    obtenir: () => requete<TableauDeBord>('/tableau-de-bord'),
  },

  appartements: {
    lister: () => requete<Appartement[]>('/appartements'),
    creer: (donnees: DonneesAppartement) =>
      requete<Appartement>('/appartements', {
        method: 'POST',
        body: JSON.stringify(donnees),
      }),
    modifier: (id: string, donnees: Partial<DonneesAppartement>) =>
      requete<Appartement>(`/appartements/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(donnees),
      }),
    supprimer: (id: string) =>
      requete<{ message: string }>(`/appartements/${id}`, { method: 'DELETE' }),
  },

  locataires: {
    lister: (tous = false) =>
      requete<Locataire[]>(construireAdresse('/locataires', { tous: tous || undefined })),
    creer: (donnees: DonneesLocataire) =>
      requete<Locataire>('/locataires', {
        method: 'POST',
        body: JSON.stringify(donnees),
      }),
    modifier: (id: string, donnees: Partial<DonneesLocataire>) =>
      requete<Locataire>(`/locataires/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(donnees),
      }),
    supprimer: (id: string) =>
      requete<{ message: string }>(`/locataires/${id}`, { method: 'DELETE' }),
  },

  loyers: {
    lister: (filtres: { statut?: StatutLoyer; mois?: string; locataireId?: string } = {}) =>
      requete<Loyer[]>(construireAdresse('/loyers', filtres)),
    creer: (donnees: DonneesLoyer) =>
      requete<Loyer>('/loyers', {
        method: 'POST',
        body: JSON.stringify(donnees),
      }),
    payer: (id: string, donnees: DonneesPaiement) =>
      requete<Loyer>(`/loyers/${id}/payer`, {
        method: 'POST',
        body: JSON.stringify(donnees),
      }),
    generer: (mois: string) =>
      requete<ResultatGenerationLoyers>('/loyers/generer', {
        method: 'POST',
        body: JSON.stringify({ mois }),
      }),
    supprimer: (id: string) =>
      requete<{ message: string }>(`/loyers/${id}`, { method: 'DELETE' }),
  },

  charges: {
    lister: () => requete<Charge[]>('/charges'),
    creer: (donnees: DonneesCharge) =>
      requete<Charge>('/charges', {
        method: 'POST',
        body: JSON.stringify(donnees),
      }),
    supprimer: (id: string) =>
      requete<{ message: string }>(`/charges/${id}`, { method: 'DELETE' }),
  },

  notifications: {
    lister: (options: {
      destinataire?: 'ADMIN' | 'LOCATAIRE';
      nonLues?: boolean;
      locataireId?: string;
      limite?: number;
    } = {}) => requete<Notification[]>(construireAdresse('/notifications', options)),
    compterNonLues: (destinataire: 'ADMIN' | 'LOCATAIRE' = 'ADMIN', locataireId?: string) =>
      requete<{ nombre: number }>(
        construireAdresse('/notifications/nombre-non-lues', { destinataire, locataireId }),
      ),
    marquerLue: (id: string) =>
      requete<Notification>(`/notifications/${id}/lire`, { method: 'PATCH' }),
    marquerToutesLues: (
      destinataire: 'ADMIN' | 'LOCATAIRE' = 'ADMIN',
      locataireId?: string,
    ) =>
      requete<{ message: string; nombre: number }>(
        construireAdresse('/notifications/lire-tout', { destinataire, locataireId }),
        { method: 'PATCH' },
      ),
    supprimer: (id: string) =>
      requete<{ message: string }>(`/notifications/${id}`, { method: 'DELETE' }),
  },

  messages: {
    conversations: () => requete<Conversation[]>('/messages/conversations'),
    listerParLocataire: (locataireId: string) =>
      requete<DetailConversation>(`/messages/locataire/${locataireId}`),
    envoyer: (donnees: DonneesMessage) =>
      requete<Message>('/messages', {
        method: 'POST',
        body: JSON.stringify(donnees),
      }),
    marquerLus: (locataireId: string, lecteur: 'ADMIN' | 'LOCATAIRE' = 'ADMIN') =>
      requete<{ message: string; nombre: number }>(
        construireAdresse(`/messages/locataire/${locataireId}/lire`, { lecteur }),
        { method: 'PATCH' },
      ),
  },
};

export { URL_API };
