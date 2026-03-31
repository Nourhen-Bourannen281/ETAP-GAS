import React from 'react';
import '../../css/Dashboard.css';

function AdminDashboard() {
  return (
    <div className="dashboard">
      <h1>Dashboard Administrateur - Sprint 2</h1>
      <div className="stats-grid">
        <div className="stat-card">Utilisateurs : 12</div>
        <div className="stat-card">Contrats actifs : 8</div>
        <div className="stat-card">Stock total : 45 230 L</div>
      </div>
      <p>Bienvenue Admin ! Vous gérez tout le système.</p>
    </div>
  );
}

export default AdminDashboard;