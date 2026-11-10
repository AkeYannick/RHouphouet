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
import type { Notification } from '../types';

interface ValeurContexteNotifications {
  notifications: Notification[];
  nonLues: number;
  chargement: boolean;
  erreur: string | null;
  recharger: (silencieux?: boolean) => Promise<void>;
  marquerLue: (id: string) => Promise<void>;
  marquerToutesLues: () => Promise<void>;
  supprimer: (id: string) => Promise<void>;
}

const ContexteNotifications = createContext<ValeurContexteNotifications | null>(null);

export function FournisseurNotifications({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  const recharger = useCallback(async (silencieux = false) => {
    if (!silencieux) {
      setChargement(true);
    }

    try {
      const donnees = await api.notifications.lister({ destinataire: 'ADMIN', limite: 30 });
      setNotifications(donnees);
      setErreur(null);
    } catch (probleme) {
      setErreur((probleme as Error).message);
    } finally {
      if (!silencieux) {
        setChargement(false);
      }
    }
  }, []);

  useEffect(() => {
    void recharger();

    const intervalle = window.setInterval(() => void recharger(true), 20000);
    return () => window.clearInterval(intervalle);
  }, [recharger]);

  const nonLues = useMemo(
    () => notifications.filter((notification) => !notification.lu).length,
    [notifications],
  );

  const marquerLue = useCallback(async (id: string) => {
    await api.notifications.marquerLue(id);
    setNotifications((liste) =>
      liste.map((notification) =>
        notification.id === id ? { ...notification, lu: true } : notification,
      ),
    );
  }, []);

  const marquerToutesLues = useCallback(async () => {
    await api.notifications.marquerToutesLues('ADMIN');
    setNotifications((liste) => liste.map((notification) => ({ ...notification, lu: true })));
  }, []);

  const supprimer = useCallback(async (id: string) => {
    await api.notifications.supprimer(id);
    setNotifications((liste) => liste.filter((notification) => notification.id !== id));
  }, []);

  const valeur = useMemo<ValeurContexteNotifications>(
    () => ({
      notifications,
      nonLues,
      chargement,
      erreur,
      recharger,
      marquerLue,
      marquerToutesLues,
      supprimer,
    }),
    [notifications, nonLues, chargement, erreur, recharger, marquerLue, marquerToutesLues, supprimer],
  );

  return (
    <ContexteNotifications.Provider value={valeur}>{children}</ContexteNotifications.Provider>
  );
}

export function useNotifications() {
  const contexte = useContext(ContexteNotifications);

  if (!contexte) {
    throw new Error(
      'useNotifications doit être utilisé à l’intérieur de FournisseurNotifications',
    );
  }

  return contexte;
}
