export interface SessionAdministrateur {
  jeton: string;
  email: string;
  expireLe: string;
}

const CLE_SESSION = 'rhouphouet.session';

function stockageDisponible(): boolean {
  try {
    const essai = '__rhouphouet_test__';
    window.localStorage.setItem(essai, '1');
    window.localStorage.removeItem(essai);
    return true;
  } catch {
    return false;
  }
}

export function lireSession(): SessionAdministrateur | null {
  if (!stockageDisponible()) {
    return null;
  }

  const brut = window.localStorage.getItem(CLE_SESSION);
  if (!brut) {
    return null;
  }

  try {
    const session = JSON.parse(brut) as Partial<SessionAdministrateur>;

    if (
      typeof session.jeton !== 'string' ||
      typeof session.email !== 'string' ||
      typeof session.expireLe !== 'string'
    ) {
      effacerSession();
      return null;
    }

    if (new Date(session.expireLe).getTime() <= Date.now()) {
      effacerSession();
      return null;
    }

    return session as SessionAdministrateur;
  } catch {
    effacerSession();
    return null;
  }
}

export function enregistrerSession(session: SessionAdministrateur): void {
  if (!stockageDisponible()) {
    return;
  }

  window.localStorage.setItem(CLE_SESSION, JSON.stringify(session));
}

export function effacerSession(): void {
  try {
    window.localStorage.removeItem(CLE_SESSION);
  } catch {
    // Le stockage peut être indisponible sur certains navigateurs
  }
}

export function lireJeton(): string | null {
  return lireSession()?.jeton ?? null;
}
