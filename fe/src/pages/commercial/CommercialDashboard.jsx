import React from 'react';
import '../../css/Dashboard.css';

function CommercialDashboard() {
  return (
    <div className="dashboard-container">
      <h1>Dashboard Commercial – Sprint 3</h1>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Mes Commandes en attente</h3>
          <p className="stat-number">5</p>
        </div>
        <div className="stat-card">
          <h3>Livraisons à préparer</h3>
          <p className="stat-number">3</p>
        </div>
      </div>
      <p>Bienvenue Commercial ! Gérez les commandes et créez les livraisons.</p>
    </div>
  );
}

export default CommercialDashboard;