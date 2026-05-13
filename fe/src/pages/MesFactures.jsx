// src/pages/MesFactures.jsx
import React, { useState, useEffect } from 'react';
import api from '../services/api';
//import './MesFactures.css';

const MesFactures = () => {
  const [factures, setFactures] = useState([]);
  const [filteredFactures, setFilteredFactures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchMesFactures();
  }, []);

  useEffect(() => {
    filterFactures();
  }, [searchTerm, statusFilter, factures]);

  const fetchMesFactures = async () => {
    try {
      setLoading(true);
      const response = await api.get('/factures');
      setFactures(response.data);
      setFilteredFactures(response.data);
      calculateStats(response.data);
    } catch (error) {
      console.error('Erreur chargement factures:', error);
      alert(error.response?.data?.message || 'Erreur lors du chargement de vos factures');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    const total = data.length;
    const enAttente = data.filter(f => f.statut === 'En attente').length;
    const payees = data.filter(f => f.statut === 'Payée').length;
    const totalMontant = data.reduce((sum, f) => sum + (f.montantTTC || 0), 0);
    
    setStats({ total, enAttente, payees, totalMontant });
  };

  const filterFactures = () => {
    let filtered = [...factures];

    if (searchTerm) {
      filtered = filtered.filter(f =>
        f.numeroFacture?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.contrat?.numeroContrat?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(f => f.statut === statusFilter);
    }

    setFilteredFactures(filtered);
  };

  const handleExportPDF = async (id) => {
    try {
      const response = await api.get(`/factures/${id}/pdf`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `facture_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      alert('Facture téléchargée avec succès');
    } catch (error) {
      console.error('Erreur export PDF:', error);
      alert('Erreur lors du téléchargement');
    }
  };

  const getStatutClass = (statut) => {
    switch(statut) {
      case 'En attente':
        return 'status-warning';
      case 'Payée':
        return 'status-success';
      case 'Annulée':
        return 'status-danger';
      default:
        return '';
    }
  };

  const getStatutText = (statut) => {
    switch(statut) {
      case 'En attente':
        return 'En attente de paiement';
      case 'Payée':
        return 'Payée';
      case 'Annulée':
        return 'Annulée';
      default:
        return statut;
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Chargement de vos factures...</p>
      </div>
    );
  }

  return (
    <div className="mes-factures-container">
      <h1 className="page-title">Mes Factures</h1>

      {/* Statistiques */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Factures</h3>
            <div className="stat-value">{stats.total}</div>
          </div>
          <div className="stat-card">
            <h3>En attente de paiement</h3>
            <div className="stat-value warning">{stats.enAttente}</div>
          </div>
          <div className="stat-card">
            <h3>Factures payées</h3>
            <div className="stat-value success">{stats.payees}</div>
          </div>
          <div className="stat-card">
            <h3>Montant total</h3>
            <div className="stat-value">{stats.totalMontant.toLocaleString()} TND</div>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="filters-container">
        <div className="search-box">
          <input
            type="text"
            placeholder="Rechercher par numéro de facture ou contrat..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filter-box">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">Tous les statuts</option>
            <option value="En attente">En attente</option>
            <option value="Payée">Payée</option>
            <option value="Annulée">Annulée</option>
          </select>
        </div>
      </div>

      {/* Tableau des factures */}
      {filteredFactures.length === 0 ? (
        <div className="no-data">
          <p>Aucune facture trouvée.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="factures-table">
            <thead>
              <tr>
                <th>N° Facture</th>
                <th>Type</th>
                <th>Contrat</th>
                <th>Montant TTC</th>
                <th>Date d'échéance</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFactures.map((facture) => (
                <tr key={facture._id}>
                  <td className="facture-number">{facture.numeroFacture}</td>
                  <td>
                    <span className="type-badge">
                      {facture.typeFacture?.nom} ({facture.devise})
                    </span>
                  </td>
                  <td>{facture.contrat?.numeroContrat || '-'}</td>
                  <td className="montant">
                    {facture.montantTTC?.toLocaleString()} {facture.devise}
                  </td>
                  <td>
                    {facture.dateEcheance ? new Date(facture.dateEcheance).toLocaleDateString('fr-FR') : '-'}
                  </td>
                  <td>
                    <span className={`status-badge ${getStatutClass(facture.statut)}`}>
                      {getStatutText(facture.statut)}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => handleExportPDF(facture._id)}
                      className="btn-pdf"
                      title="Télécharger PDF"
                    >
                      📄 PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MesFactures;