import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/admin/AdminDashboard';
import Users from './pages/Users';
import Products from './pages/admin/referentiel/Products';
import Referentiels from './pages/admin/referentiel/Referentiel';
import TransporteurLivraisons from "./pages/transporteur/TransporteurLivraions";
import TypeProduits from './pages/admin/referentiel/TypeProduits';
import SousProduits from './pages/admin/referentiel/SousProduits';
import Pays from './pages/admin/referentiel/Pays';
import Banques from './pages/admin/referentiel/Banques';
import Navires from './pages/admin/referentiel/Navires';
import ModesPaiement from './pages/admin/referentiel/ModesPaiement';
import TypesFacture from './pages/admin/referentiel/TypesFacture';
import Contrats from './pages/commercial/Contrats';
import Tiers from './pages/admin/Tiers';
import GestionStock from './pages/admin/GestionStock';
import Commandes from './pages/Commandes';
import Livraisons from './pages/Livraison';
import CommercialDashboard from './pages/commercial/CommercialDashboard';
import ClientDashboard from './pages/client/ClientDashboard';
import TransporteurDashboard from './pages/transporteur/TransporteurDashboard';

// Sprint 4
import Factures from './pages/Factures';
import ExportImport from './pages/ExportImport';
import Conformite from './pages/Conformite';
import Historique from './pages/Historique';

// Sprint 5
import Notifications from './pages/Notifications';
import Rapports from './pages/Rapports';
import Paiements from './pages/Paiements';
import ActionLogs from './pages/ActionLogs'; // Correction du nom d'import

function AppLayout() {
  const location = useLocation();
  const hideNavbarRoutes = ['/', '/login'];

  const showNavbar = !hideNavbarRoutes.includes(location.pathname);

  return (
    <div className={showNavbar ? "app-layout" : ""}>
      {showNavbar && <Navbar />}

      <div className="page-content">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />

          {/* Admin */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin-dashboard" element={<Dashboard />} />
          <Route path="/users" element={<Users />} />
          <Route path="/products" element={<Products />} />
          <Route path="/referentiels" element={<Referentiels />} />

          {/* Référentiels */}
          <Route path="/type-produits" element={<TypeProduits />} />
          <Route path="/sous-produits" element={<SousProduits />} />
          <Route path="/pays" element={<Pays />} />
          <Route path="/banques" element={<Banques />} />
          <Route path="/navires" element={<Navires />} />
          <Route path="/modes-paiement" element={<ModesPaiement />} />
          <Route path="/types-facture" element={<TypesFacture />} />

          {/* Gestion */}
          <Route path="/contrats" element={<Contrats />} />
          <Route path="/tiers" element={<Tiers />} />
          <Route path="/stock" element={<GestionStock />} />

          {/* Commercial */}
          <Route path="/commercial-dashboard" element={<CommercialDashboard />} />
          <Route path="/commandes" element={<Commandes />} />
          <Route path="/livraisons" element={<Livraisons />} />

          {/* Client */}
          <Route path="/client-dashboard" element={<ClientDashboard />} />
          <Route path="/mes-commandes" element={<Commandes />} />
          <Route path="/mes-factures" element={<Factures />} />

          {/* Transporteur */}
          <Route path="/transporteur-dashboard" element={<TransporteurDashboard />} />
          <Route path="/mes-livraisons" element={<TransporteurLivraisons />} />

          {/* Sprint 4 */}
          <Route path="/factures" element={<Factures />} />
          <Route path="/export-import" element={<ExportImport />} />
          <Route path="/conformite" element={<Conformite />} />
          <Route path="/historique" element={<Historique />} />

          {/* Sprint 5 */}
          <Route path="/paiements" element={<Paiements />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/rapports" element={<Rapports />} />
          <Route path="/action-logs" element={<ActionLogs />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}