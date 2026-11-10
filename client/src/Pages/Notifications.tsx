import {
  Bell,
  Check,
  CheckCheck,
  CreditCard,
  Inbox,
  MessageSquare,
  Settings,
  Trash2,
  Wallet,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BadgeTypeNotification } from '../components/ui/Badges';
import { BandeauErreur } from '../components/ui/BandeauErreur';
import { Chargement } from '../components/ui/Chargement';
import { EnTetePage } from '../components/ui/EnTetePage';
import { EtatVide } from '../components/ui/EtatVide';
import { useNotifications } from '../contexts/NotificationsContext';
import type { TypeNotification } from '../types';
import { formaterDateRelative } from '../utils/format';
import { lienInterne } from '../utils/securite';

type FiltreNotification = 'TOUTES' | 'NON_LUES';

const ICONES: Record<TypeNotification, typeof Bell> = {
  LOYER: Wallet,
  PAIEMENT: CreditCard,
  MESSAGE: MessageSquare,
  SYSTEME: Settings,
};

const TEINTES: Record<TypeNotification, string> = {
  LOYER: 'bg-info/10 text-info',
  PAIEMENT: 'bg-success/10 text-success',
  MESSAGE: 'bg-primary/10 text-primary',
  SYSTEME: 'bg-base-200 text-base-content/60',
};

const Notifications = () => {
  const { notifications, nonLues, chargement, erreur, recharger, marquerLue, marquerToutesLues, supprimer } =
    useNotifications();
  const [filtre, setFiltre] = useState<FiltreNotification>('TOUTES');
  const [actionEnCours, setActionEnCours] = useState<string | null>(null);
  const [erreurAction, setErreurAction] = useState<string | null>(null);
  const naviguer = useNavigate();

  const notificationsAffichees = useMemo(
    () => (filtre === 'NON_LUES' ? notifications.filter((notification) => !notification.lu) : notifications),
    [notifications, filtre],
  );

  const executerAction = async (cle: string, action: () => Promise<void>) => {
    setActionEnCours(cle);
    setErreurAction(null);

    try {
      await action();
    } catch (probleme) {
      setErreurAction((probleme as Error).message);
    } finally {
      setActionEnCours(null);
    }
  };

  const ouvrirNotification = async (id: string, lien: string | null) => {
    await executerAction(`ouvrir-${id}`, async () => {
      await marquerLue(id);
      if (lien) {
        naviguer(lienInterne(lien));
      }
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <EnTetePage
        titre="Notifications"
        description="Restez informé des loyers, des paiements et des messages reçus."
        actions={
          <button
            type="button"
            className="btn btn-outline btn-sm sm:btn-md"
            onClick={() => void executerAction('tout', marquerToutesLues)}
            disabled={nonLues === 0 || actionEnCours !== null}
          >
            <CheckCheck size={18} />
            Tout marquer comme lu
          </button>
        }
      />

      {(erreur || erreurAction) && (
        <BandeauErreur message={erreurAction ?? erreur ?? ''} onReessayer={() => void recharger()} />
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className={`btn btn-sm ${filtre === 'TOUTES' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setFiltre('TOUTES')}
        >
          Toutes
          <span className="badge badge-sm badge-ghost">{notifications.length}</span>
        </button>
        <button
          type="button"
          className={`btn btn-sm ${filtre === 'NON_LUES' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setFiltre('NON_LUES')}
        >
          Non lues
          <span className={`badge badge-sm ${nonLues > 0 ? 'badge-error text-white' : 'badge-ghost'}`}>
            {nonLues}
          </span>
        </button>
      </div>

      <div className="card border border-base-300/70 bg-base-100 shadow-sm">
        <div className="card-body p-0">
          {chargement ? (
            <div className="p-5">
              <Chargement texte="Chargement des notifications…" />
            </div>
          ) : notificationsAffichees.length === 0 ? (
            <EtatVide
              icone={Inbox}
              titre={filtre === 'NON_LUES' ? 'Aucune notification non lue' : 'Aucune notification'}
              description={
                filtre === 'NON_LUES'
                  ? 'Toutes vos notifications ont été lues.'
                  : 'Les alertes de loyers, de paiements et de messages apparaîtront ici.'
              }
            />
          ) : (
            <ul className="divide-y divide-base-300/60">
              {notificationsAffichees.map((notification) => {
                const Icone = ICONES[notification.type];
                const enCours = actionEnCours !== null;

                return (
                  <li
                    key={notification.id}
                    className={`flex gap-3 px-4 py-4 transition sm:gap-4 sm:px-5 ${
                      notification.lu ? 'bg-base-100' : 'bg-primary/[0.04]'
                    }`}
                  >
                    <span
                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${TEINTES[notification.type]}`}
                    >
                      <Icone size={19} />
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-base-content">
                          {notification.titre}
                        </p>
                        <BadgeTypeNotification type={notification.type} />
                        {!notification.lu && (
                          <span className="h-2 w-2 rounded-full bg-primary" aria-label="Non lue" />
                        )}
                      </div>

                      <p className="mt-1 text-sm text-base-content/70">{notification.contenu}</p>

                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-base-content/50">
                        <span>{formaterDateRelative(notification.creeLe)}</span>
                        {notification.locataire && <span>Locataire : {notification.locataire.nom}</span>}
                        {notification.lien && (
                          <button
                            type="button"
                            className="link link-primary font-medium"
                            onClick={() => void ouvrirNotification(notification.id, notification.lien)}
                            disabled={enCours}
                          >
                            Consulter
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col gap-1 sm:flex-row sm:items-start">
                      {!notification.lu && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs text-primary"
                          title="Marquer comme lue"
                          aria-label="Marquer comme lue"
                          disabled={enCours}
                          onClick={() =>
                            void executerAction(`lire-${notification.id}`, () =>
                              marquerLue(notification.id),
                            )
                          }
                        >
                          <Check size={16} />
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs text-error"
                        title="Supprimer la notification"
                        aria-label="Supprimer la notification"
                        disabled={enCours}
                        onClick={() =>
                          void executerAction(`supprimer-${notification.id}`, () =>
                            supprimer(notification.id),
                          )
                        }
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
