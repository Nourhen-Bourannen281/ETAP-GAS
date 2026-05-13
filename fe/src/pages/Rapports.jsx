import React, { useState, useEffect } from 'react';
import axios from 'axios';
//import './Rapports.css';

function Rapports() {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');
  const api = axios.create({ 
    baseURL: 'http://localhost:5000/api', 
    headers: { Authorization: `Bearer ${token}` } 
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/rapports/stats');
      setStats(res.data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = async () => {
    try {
      const response = await api.get('/rapports/export-pdf', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'rapport.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la génération du PDF');
    }
  };

  const exportExcel = async () => {
    try {
      const response = await api.get('/rapports/export-excel', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'rapport.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la génération du Excel');
    }
  };

  if (loading) return <div className="loading">Chargement des statistiques...</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Tableau de Bord Reporting</h2>
      </div>
      
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Factures</h3>
          <p className="big-number">{stats.totalFactures || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Total Commandes</h3>
          <p className="big-number">{stats.totalCommandes || 0}</p>
        </div>
        <div className="stat-card">
          <h3>CA du Mois</h3>
          <p className="big-number">{stats.caMois || 0} TND</p>
        </div>
        <div className="stat-card">
          <h3>CA Total</h3>
          <p className="big-number">{stats.caTotal || 0} TND</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Paiements en attente</h3>
          <p className="big-number">{stats.paiementsEnAttente || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Livraisons en cours</h3>
          <p className="big-number">{stats.livraisonsEnCours || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Clients actifs</h3>
          <p className="big-number">{stats.clientsActifs || 0}</p>
        </div>
      </div>

      <div className="export-buttons">
        <button onClick={exportPDF} className="btn-export btn-pdf">
          📄 Exporter PDF
        </button>
        <button onClick={exportExcel} className="btn-export btn-excel">
          📊 Exporter Excel
        </button>
      </div>
    </div>
  );
}

export default Rapports;