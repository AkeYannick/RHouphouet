import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  Bell,
  Building2,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  ReceiptText,
  Users,
  Wallet,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import logoRH from '../assets/logoRH.png';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationsContext';

interface ElementNavigation {
  chemin: string;
  libelle: string;
  icone: LucideIcon;
  exact?: boolean;
}

interface GroupeNavigation {
  titre: string;
  elements: ElementNavigation[];
}

const GROUPES: GroupeNavigation[] = [
  {
    titre: 'Pilotage',
    elements: [
      { chemin: '/', libelle: 'Tableau de bord', icone: LayoutDashboard, exact: true },
      { chemin: '/Rapports', libelle: 'Rapports', icone: BarChart3 },
    ],
  },
  {
    titre: 'Gestion',
    elements: [
      { chemin: '/Apparts', libelle: 'Appartements', icone: Building2 },
      { chemin: '/Locataires', libelle: 'Locataires', icone: Users },
      { chemin: '/Loyers', libelle: 'Loyers', icone: Wallet },
      { chemin: '/Charges', libelle: 'Charges', icone: ReceiptText },
    ],
  },
  {
    titre: 'Communication',
    elements: [
      { chemin: '/Messagerie', libelle: 'Messagerie', icone: MessageSquare },
      { chemin: '/Notifications', libelle: 'Notifications', icone: Bell },
    ],
  },
];

export function SideBar({ onNaviguer }: { onNaviguer: () => void }) {
  const { administrateur, deconnexion } = useAuth();
  const { nonLues } = useNotifications();

  return (
    <aside className="flex h-full min-h-screen w-72 flex-col border-r border-base-300/70 bg-base-100">
      <div className="flex h-16 shrink-0 items-center bg-primary px-5">
        <img src={logoRH} alt="R. Houphouet" className="h-9 w-auto object-contain" />
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {GROUPES.map((groupe) => (
          <div key={groupe.titre}>
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-base-content/40">
              {groupe.titre}
            </p>

            <div className="space-y-1">
              {groupe.elements.map((element) => (
                <NavLink
                  key={element.chemin}
                  to={element.chemin}
                  end={element.exact}
                  onClick={onNaviguer}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-content shadow-sm'
                        : 'text-base-content/70 hover:bg-base-200 hover:text-base-content'
                    }`
                  }
                >
                  <element.icone size={18} />
                  <span className="flex-1">{element.libelle}</span>
                  {element.chemin === '/Notifications' && nonLues > 0 && (
                    <span className="badge badge-error badge-sm border-0 text-[10px] text-white">
                      {nonLues}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-base-300/60 p-3">
        <div className="rounded-xl bg-base-200/70 p-3">
          <p className="truncate text-xs font-semibold text-base-content/80">
            {administrateur?.email ?? 'Administration'}
          </p>
          <p className="mt-0.5 text-[11px] text-base-content/50">Administrateur</p>

          <button
            type="button"
            onClick={() => void deconnexion()}
            className="btn btn-ghost btn-sm mt-2 w-full justify-start gap-2 px-2 text-error"
          >
            <LogOut size={15} />
            Se déconnecter
          </button>
        </div>
      </div>
    </aside>
  );
}
