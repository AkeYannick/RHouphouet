import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api } from '../services/api';
import { effacerSession, enregistrerSession, lireSession } from '../services/session';

interface ValeurContexteAuth {
  administrateur: { email: string } | null;
  connecte: boolean;
  connexion: (email: string, motDePasse: string) => Promise<void>;
  deconnexion: () => Promise<void>;
}

const ContexteAuth = createContext<ValeurContexteAuth | null>(null);

export function FournisseurAuth({ children }: { children: ReactNode }) {
  const [session, setSession] = useState(() => lireSession());

  useEffect(() => {
    function surSessionExpiree() {
      setSession(null);
    }

    window.addEventListener('rhouphouet:session-expiree', surSessionExpiree);
    return () => window.removeEventListener('rhouphouet:session-expiree', surSessionExpiree);
  }, []);

  const connexion = useCallback(async (email: string, motDePasse: string) => {
    const reponse = await api.auth.connexion({ email, motDePasse });
    const nouvelleSession = {
      jeton: reponse.jeton,
      email: reponse.administrateur.email,
      expireLe: reponse.expireLe,
    };

    enregistrerSession(nouvelleSession);
    setSession(nouvelleSession);
  }, []);

  const deconnexion = useCallback(async () => {
    try {
      await api.auth.deconnexion();
    } catch {
      // La session locale est effacée même si l'appel échoue
    }

    effacerSession();
    setSession(null);
  }, []);

  const valeur = useMemo<ValeurContexteAuth>(
    () => ({
      administrateur: session ? { email: session.email } : null,
      connecte: Boolean(session),
      connexion,
      deconnexion,
    }),
    [session, connexion, deconnexion],
  );

  return <ContexteAuth.Provider value={valeur}>{children}</ContexteAuth.Provider>;
}

export function useAuth() {
  const contexte = useContext(ContexteAuth);

  if (!contexte) {
    throw new Error('useAuth doit être utilisé à l’intérieur de FournisseurAuth');
  }

  return contexte;
}
