import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTachometerAlt,
  faUsers,
  faBoxOpen,
  faBuilding,
  faFileContract,
  faShoppingCart,
  faTruckFast,
  faFileInvoiceDollar,
  faGlobe,
  faCheckCircle,
  faHistory,
  faUserTie,
  faBars,
  faRightFromBracket,
  faExchangeAlt,
  faClipboardList,
  faChartLine,
  faCreditCard,
  faBell
} from '@fortawesome/free-solid-svg-icons';

import '../css/Navbar.css';

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const role = user?.role;

  if (!token || location.pathname === '/' || location.pathname === '/login') {
    return null;
  }

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const isActive = (path) => {
    if (location.pathname === path) {
      return 'active-link';
    }
    return '';
  };

  return (
    <>
      {/* TOPBAR */}
      <header className="topbar">
        <button className="burger-btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          <FontAwesomeIcon icon={faBars} />
        </button>

        <div className="topbar-right">
          <span className="topbar-role">{role || 'Invité'}</span>

          <button className="topbar-logout" onClick={handleLogout}>
            <FontAwesomeIcon icon={faRightFromBracket} />
          </button>
        </div>
      </header>

      {/* OVERLAY */}
      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* SIDEBAR */}
      <aside className={`sidebar ${isSidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">OFPPT Logistique</div>
          <small>{role}</small>
        </div>

        <nav className="sidebar-nav">
          {/* Dashboard - accessible à tous */}
          <Link to="/dashboard" className={`sidebar-link ${isActive('/dashboard')}`}>
            <FontAwesomeIcon icon={faTachometerAlt} />
            <span>Dashboard</span>
          </Link>

          {/* Admin Routes */}
          {role === 'Admin' && (
            <>
              <Link to="/users" className={`sidebar-link ${isActive('/users')}`}>
                <FontAwesomeIcon icon={faUsers} />
                <span>Utilisateurs</span>
              </Link>

              <Link to="/referentiels" className={`sidebar-link ${isActive('/referentiels')}`}>
                <FontAwesomeIcon icon={faBuilding} />
                <span>Référentiels</span>
              </Link>

              <Link to="/stock" className={`sidebar-link ${isActive('/stock')}`}>
                <FontAwesomeIcon icon={faBoxOpen} />
                <span>Stock</span>
              </Link>

              <Link to="/contrats" className={`sidebar-link ${isActive('/contrats')}`}>
                <FontAwesomeIcon icon={faFileContract} />
                <span>Contrats</span>
              </Link>

              <Link to="/commandes" className={`sidebar-link ${isActive('/commandes')}`}>
                <FontAwesomeIcon icon={faShoppingCart} />
                <span>Commandes</span>
              </Link>

              <Link to="/livraisons" className={`sidebar-link ${isActive('/livraisons')}`}>
                <FontAwesomeIcon icon={faTruckFast} />
                <span>Livraisons</span>
              </Link>

              <Link to="/factures" className={`sidebar-link ${isActive('/factures')}`}>
                <FontAwesomeIcon icon={faFileInvoiceDollar} />
                <span>Factures</span>
              </Link>

              <Link to="/export-import" className={`sidebar-link ${isActive('/export-import')}`}>
                <FontAwesomeIcon icon={faExchangeAlt} />
                <span>Export/Import</span>
              </Link>

              <Link to="/conformite" className={`sidebar-link ${isActive('/conformite')}`}>
                <FontAwesomeIcon icon={faCheckCircle} />
                <span>Conformité</span>
              </Link>

              <Link to="/historique" className={`sidebar-link ${isActive('/historique')}`}>
                <FontAwesomeIcon icon={faHistory} />
                <span>Historique</span>
              </Link>

              <Link to="/paiements" className={`sidebar-link ${isActive('/paiements')}`}>
                <FontAwesomeIcon icon={faCreditCard} />
                <span>Paiements</span>
              </Link>

              <Link to="/notifications" className={`sidebar-link ${isActive('/notifications')}`}>
                <FontAwesomeIcon icon={faBell} />
                <span>Notifications</span>
              </Link>

              <Link to="/rapports" className={`sidebar-link ${isActive('/rapports')}`}>
                <FontAwesomeIcon icon={faChartLine} />
                <span>Rapports</span>
              </Link>

              <Link to="/action-logs" className={`sidebar-link ${isActive('/action-logs')}`}>
                <FontAwesomeIcon icon={faHistory} />
                <span>Journal</span>
              </Link>
            </>
          )}

          {/* Commercial Routes */}
          {role === 'Commercial' && (
            <>
              <Link to="/commercial-dashboard" className={`sidebar-link ${isActive('/commercial-dashboard')}`}>
                <FontAwesomeIcon icon={faTachometerAlt} />
                <span>Dashboard</span>
              </Link>

              <Link to="/contrats" className={`sidebar-link ${isActive('/contrats')}`}>
                <FontAwesomeIcon icon={faFileContract} />
                <span>Contrats</span>
              </Link>

              <Link to="/commandes" className={`sidebar-link ${isActive('/commandes')}`}>
                <FontAwesomeIcon icon={faShoppingCart} />
                <span>Commandes</span>
              </Link>

              <Link to="/factures" className={`sidebar-link ${isActive('/factures')}`}>
                <FontAwesomeIcon icon={faFileInvoiceDollar} />
                <span>Factures</span>
              </Link>

              <Link to="/export-import" className={`sidebar-link ${isActive('/export-import')}`}>
                <FontAwesomeIcon icon={faExchangeAlt} />
                <span>Export/Import</span>
              </Link>

              <Link to="/conformite" className={`sidebar-link ${isActive('/conformite')}`}>
                <FontAwesomeIcon icon={faCheckCircle} />
                <span>Conformité</span>
              </Link>

              <Link to="/paiements" className={`sidebar-link ${isActive('/paiements')}`}>
                <FontAwesomeIcon icon={faCreditCard} />
                <span>Paiements</span>
              </Link>

              <Link to="/notifications" className={`sidebar-link ${isActive('/notifications')}`}>
                <FontAwesomeIcon icon={faBell} />
                <span>Notifications</span>
              </Link>
            </>
          )}

          {/* Fournisseur Routes */}
          {role === 'Fournisseur' && (
            <>
              <Link to="/fournisseur-dashboard" className={`sidebar-link ${isActive('/fournisseur-dashboard')}`}>
                <FontAwesomeIcon icon={faTachometerAlt} />
                <span>Dashboard</span>
              </Link>

              <Link to="/stock" className={`sidebar-link ${isActive('/stock')}`}>
                <FontAwesomeIcon icon={faBoxOpen} />
                <span>Stock</span>
              </Link>

              <Link to="/commandes" className={`sidebar-link ${isActive('/commandes')}`}>
                <FontAwesomeIcon icon={faShoppingCart} />
                <span>Commandes</span>
              </Link>

              <Link to="/livraisons" className={`sidebar-link ${isActive('/livraisons')}`}>
                <FontAwesomeIcon icon={faTruckFast} />
                <span>Livraisons</span>
              </Link>

              <Link to="/paiements" className={`sidebar-link ${isActive('/paiements')}`}>
                <FontAwesomeIcon icon={faCreditCard} />
                <span>Paiements</span>
              </Link>

              <Link to="/notifications" className={`sidebar-link ${isActive('/notifications')}`}>
                <FontAwesomeIcon icon={faBell} />
                <span>Notifications</span>
              </Link>
            </>
          )}

          {/* Client Routes */}
          {role === 'Client' && (
            <>
              <Link to="/client-dashboard" className={`sidebar-link ${isActive('/client-dashboard')}`}>
                <FontAwesomeIcon icon={faTachometerAlt} />
                <span>Dashboard</span>
              </Link>

              <Link to="/mes-commandes" className={`sidebar-link ${isActive('/mes-commandes')}`}>
                <FontAwesomeIcon icon={faShoppingCart} />
                <span>Mes Commandes</span>
              </Link>

              <Link to="/mes-livraisons" className={`sidebar-link ${isActive('/mes-livraisons')}`}>
                <FontAwesomeIcon icon={faTruckFast} />
                <span>Mes Livraisons</span>
              </Link>

              <Link to="/mes-factures" className={`sidebar-link ${isActive('/mes-factures')}`}>
                <FontAwesomeIcon icon={faFileInvoiceDollar} />
                <span>Mes Factures</span>
              </Link>

              <Link to="/paiements" className={`sidebar-link ${isActive('/paiements')}`}>
                <FontAwesomeIcon icon={faCreditCard} />
                <span>Paiements</span>
              </Link>

              <Link to="/notifications" className={`sidebar-link ${isActive('/notifications')}`}>
                <FontAwesomeIcon icon={faBell} />
                <span>Notifications</span>
              </Link>
            </>
          )}

          {/* Transporteur Routes */}
          {role === 'Transporteur' && (
            <>
              <Link to="/transporteur-dashboard" className={`sidebar-link ${isActive('/transporteur-dashboard')}`}>
                <FontAwesomeIcon icon={faTachometerAlt} />
                <span>Dashboard</span>
              </Link>

              <Link to="/mes-livraisons" className={`sidebar-link ${isActive('/mes-livraisons')}`}>
                <FontAwesomeIcon icon={faTruckFast} />
                <span>Mes Livraisons</span>
              </Link>

              <Link to="/paiements" className={`sidebar-link ${isActive('/paiements')}`}>
                <FontAwesomeIcon icon={faCreditCard} />
                <span>Paiements</span>
              </Link>

              <Link to="/notifications" className={`sidebar-link ${isActive('/notifications')}`}>
                <FontAwesomeIcon icon={faBell} />
                <span>Notifications</span>
              </Link>
            </>
          )}
        </nav>
      </aside>
    </>
  );
}

export default Navbar;