import { Bell, CheckCheck, ChevronDown, LogOut, Menu, MessageSquare } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import logoRH from '../assets/logoRH.png';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationsContext';
import { formaterDateRelative } from '../utils/format';
import { lienInterne } from '../utils/securite';

const TITRES_PAGES: Record<string, string> = {
  '/': 'Tableau de bord',
  '/Apparts': 'Appartements',
  '/Locataires': 'Locataires',
  '/Loyers': 'Loyers',
  '/Charges': 'Charges & dépenses',
  '/Rapports': 'Rapports financiers',
  '/Notifications': 'Notifications',
  '/Messagerie': 'Messagerie',
};

export function Navbar({ onOuvrirMenu }: { onOuvrirMenu: () => void }) {
  const emplacement = useLocation();
  const naviguer = useNavigate();
  const { administrateur, deconnexion } = useAuth();
  const { notifications, nonLues, marquerLue, marquerToutesLues, erreur } = useNotifications();
  const [deconnexionEnCours, setDeconnexionEnCours] = useState(false);
  const titrePage = TITRES_PAGES[emplacement.pathname] ?? 'R. Houphouet';

  async function seDeconnecter() {
    setDeconnexionEnCours(true);
    await deconnexion();
    naviguer('/Connexion', { replace: true });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-base-300/70 bg-base-100/90 backdrop-blur">
      <div className="flex h-16 items-center gap-2 px-3 sm:gap-3 sm:px-5">
        <button
          type="button"
          onClick={onOuvrirMenu}
          className="btn btn-ghost btn-circle btn-sm lg:hidden"
          aria-label="Ouvrir le menu de navigation"
        >
          <Menu size={20} />
        </button>

        <Link
          to="/"
          className="flex items-center rounded-xl bg-primary px-2.5 py-1.5 lg:hidden"
          aria-label="Accueil R. Houphouet"
        >
          <img src={logoRH} alt="R. Houphouet" className="h-7 w-auto object-contain" />
        </Link>

        <div className="hidden flex-col lg:flex">
          <span className="text-[11px] uppercase tracking-wide text-base-content/45">
            Espace gestion locative
          </span>
          <span className="text-sm font-semibold text-base-content">{titrePage}</span>
        </div>

        <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
          <Link to="/Messagerie" className="btn btn-ghost btn-circle btn-sm" aria-label="Messagerie">
            <MessageSquare size={19} />
          </Link>

          <div className="dropdown dropdown-end">
            <button
              type="button"
              tabIndex={0}
              className="btn btn-ghost btn-circle btn-sm"
              aria-label={`Notifications${nonLues > 0 ? ` (${nonLues} non lues)` : ''}`}
            >
              <span className="indicator">
                <Bell size={19} />
                {nonLues > 0 && (
                  <span className="badge badge-error badge-xs indicator-item border-0 text-[10px] text-white">
                    {nonLues > 9 ? '9+' : nonLues}
                  </span>
                )}
              </span>
            </button>

            <div
              tabIndex={0}
              className="dropdown-content z-[90] mt-2 w-[min(20rem,calc(100vw-1.5rem))] overflow-hidden rounded-xl border border-base-300 bg-base-100 shadow-xl"
            >
              <div className="flex items-center justify-between border-b border-base-300/60 px-4 py-3">
                <span className="text-sm font-semibold">Notifications</span>
                {nonLues > 0 && (
                  <button
                    type="button"
                    onClick={() => void marquerToutesLues()}
                    className="btn btn-ghost btn-xs gap-1 text-primary"
                  >
                    <CheckCheck size={14} />
                    Tout lire
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto">
                {erreur && <p className="px-4 py-3 text-xs text-error">{erreur}</p>}

                {notifications.slice(0, 6).map((notification) => (
                  <Link
                    key={notification.id}
                    to={lienInterne(notification.lien)}
                    onClick={() => void marquerLue(notification.id)}
                    className={`flex gap-3 px-4 py-3 text-left transition hover:bg-base-200 ${
                      notification.lu ? '' : 'bg-primary/5'
                    }`}
                  >
                    <span
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                        notification.lu ? 'bg-base-300' : 'bg-primary'
                      }`}
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-base-content">
                        {notification.titre}
                      </span>
                      <span className="mt-0.5 line-clamp-2 block text-xs text-base-content/60">
                        {notification.contenu}
                      </span>
                      <span className="mt-1 block text-[11px] text-base-content/40">
                        {formaterDateRelative(notification.creeLe)}
                      </span>
                    </span>
                  </Link>
                ))}

                {notifications.length === 0 && !erreur && (
                  <p className="px-4 py-8 text-center text-sm text-base-content/50">
                    Aucune notification pour le moment
                  </p>
                )}
              </div>

              <Link
                to="/Notifications"
                className="block border-t border-base-300/60 px-4 py-2.5 text-center text-xs font-semibold text-primary hover:bg-base-200"
              >
                Voir toutes les notifications
              </Link>
            </div>
          </div>

          <div className="dropdown dropdown-end ml-1 hidden sm:block">
            <button
              type="button"
              tabIndex={0}
              className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition hover:bg-base-200"
              aria-label="Menu administrateur"
            >
              <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-content">
                RH
              </span>
              <span className="hidden max-w-40 truncate text-xs font-medium text-base-content/70 md:block">
                {administrateur?.email ?? 'Administration'}
              </span>
              <ChevronDown size={14} className="text-base-content/40" />
            </button>

            <div
              tabIndex={0}
              className="dropdown-content z-[90] mt-2 w-64 overflow-hidden rounded-xl border border-base-300 bg-base-100 shadow-xl"
            >
              <div className="border-b border-base-300/60 px-4 py-3">
                <p className="text-[11px] uppercase tracking-wide text-base-content/45">
                  Administrateur
                </p>
                <p className="mt-0.5 truncate text-sm font-medium text-base-content">
                  {administrateur?.email}
                </p>
              </div>

              <button
                type="button"
                onClick={() => void seDeconnecter()}
                disabled={deconnexionEnCours}
                className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-sm font-medium text-error transition hover:bg-error/5 disabled:opacity-60"
              >
                <LogOut size={16} />
                {deconnexionEnCours ? 'Déconnexion…' : 'Se déconnecter'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
