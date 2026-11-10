import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { RouteProtegee } from '../components/RouteProtegee';
import LayoutsPage from '../Layouts/LayoutsPage';
import Apparts from '../Pages/Apparts';
import Charges from '../Pages/Charges';
import Connexion from '../Pages/Connexion';
import Dashboard from '../Pages/Dashboard';
import Locataires from '../Pages/Locataires';
import Loyers from '../Pages/Loyers';
import Messagerie from '../Pages/Messagerie';
import Notifications from '../Pages/Notifications';
import Rapports from '../Pages/Rapports';

const RoutersPage = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/Connexion" element={<Connexion />} />

        <Route element={<RouteProtegee />}>
          <Route element={<LayoutsPage />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/Locataires" element={<Locataires />} />
            <Route path="/Apparts" element={<Apparts />} />
            <Route path="/Loyers" element={<Loyers />} />
            <Route path="/Charges" element={<Charges />} />
            <Route path="/Rapports" element={<Rapports />} />
            <Route path="/Notifications" element={<Notifications />} />
            <Route path="/Messagerie" element={<Messagerie />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default RoutersPage;
