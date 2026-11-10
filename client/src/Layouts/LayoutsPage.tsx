import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { SideBar } from '../components/SideBar';
import { FournisseurNotifications } from '../contexts/NotificationsContext';

const LayoutsPage = () => {
  const [menuOuvert, setMenuOuvert] = useState(false);

  return (
    <FournisseurNotifications>
      <div className="drawer min-h-screen bg-base-200 lg:drawer-open">
        <input
          id="tiroir-navigation"
          type="checkbox"
          className="drawer-toggle"
          checked={menuOuvert}
          onChange={(evenement) => setMenuOuvert(evenement.target.checked)}
        />

        <div className="drawer-content flex min-h-screen flex-col">
          <Navbar onOuvrirMenu={() => setMenuOuvert(true)} />

          <main className="mx-auto w-full max-w-[1500px] flex-1 px-3 py-5 sm:px-5 sm:py-6 lg:px-8">
            <Outlet />
          </main>

          <footer className="px-4 py-5 text-center text-[11px] text-base-content/40">
            © {new Date().getFullYear()} R. Houphouet — Gestion locative
          </footer>
        </div>

        <div className="drawer-side z-50">
          <label
            htmlFor="tiroir-navigation"
            aria-label="Fermer le menu"
            className="drawer-overlay"
          />
          <SideBar onNaviguer={() => setMenuOuvert(false)} />
        </div>
      </div>
    </FournisseurNotifications>
  );
};

export default LayoutsPage;
