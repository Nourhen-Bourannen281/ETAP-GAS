// src/pages/Factures.jsx
import React, { useState, useEffect } from 'react';
import api from '../services/api';
//import './Factures.css';

const Factures = () => {
  const [factures, setFactures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    typeFacture: '',
    contrat: '',
    montantHT: '',
    dateEcheance: ''
  });
  const [typesFacture, setTypesFacture] = useState([]);
  const [contrats, setContrats] = useState([]);

  useEffect(() => {
    fetchFactures();
    fetchTypesFacture();
    fetchContrats();
  }, []);

  const fetchFactures = async () => {
    try {
      setLoading(true);
      const response = await api.get('/factures');
      setFactures(response.data);
    } catch (error) {
      console.error('Erreur chargement factures:', error);
      alert('Erreur lors du chargement des factures');
    } finally {
      setLoading(false);
    }
  };

  const fetchTypesFacture = async () => {
    try {
      const response = await api.get('/types-facture');
      setTypesFacture(response.data);
    } catch (error) {
      console.error('Erreur chargement types facture:', error);
    }
  };

  const fetchContrats = async () => {
    try {
      const response = await api.get('/contrats');
      setContrats(response.data);
    } catch (error) {
      console.error('Erreur chargement contrats:', error);
    }
  };

  const handleCreateFacture = async (e) => {
    e.preventDefault();
    try {
      await api.post('/factures', {
        ...formData,
        montantHT: parseFloat(formData.montantHT)
      });
      alert('Facture créée avec succès');
      setShowForm(false);
      setFormData({ typeFacture: '', contrat: '', montantHT: '', dateEcheance: '' });
      fetchFactures();
    } catch (error) {
      console.error('Erreur création facture:', error);
      alert(error.response?.data?.message || 'Erreur lors de la création');
    }
  };

  const handleUpdateStatut = async (id, newStatut) => {
    if (window.confirm(`Changer le statut de cette facture en "${newStatut}" ?`)) {
      try {
        await api.patch(`/factures/${id}/statut`, { statut: newStatut });
        alert('Statut mis à jour avec succès');
        fetchFactures();
      } catch (error) {
        console.error('Erreur mise à jour statut:', error);
        alert('Erreur lors de la mise à jour du statut');
      }
    }
  };

  const handleDeleteFacture = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette facture ?')) {
      try {
        await api.delete(`/factures/${id}`);
        alert('Facture supprimée avec succès');
        fetchFactures();
      } catch (error) {
        console.error('Erreur suppression facture:', error);
        alert('Erreur lors de la suppression');
      }
    }
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
      alert('PDF téléchargé avec succès');
    } catch (error) {
      console.error('Erreur export PDF:', error);
      alert('Erreur lors de l\'export PDF');
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

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Chargement des factures...</p>
      </div>
    );
  }

  return (
    <div className="factures-container">
      <div className="page-header">
        <h1 className="page-title">Gestion des Factures</h1>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Annuler' : '+ Nouvelle Facture'}
        </button>
      </div>

      {/* Formulaire de création */}
      {showForm && (
        <div className="form-container">
          <h2>Créer une nouvelle facture</h2>
          <form onSubmit={handleCreateFacture}>
            <div className="form-group">
              <label>Type de facture *</label>
              <select
                value={formData.typeFacture}
                onChange={(e) => setFormData({ ...formData, typeFacture: e.target.value })}
                required
              >
                <option value="">Sélectionner un type</option>
                {typesFacture.map(type => (
                  <option key={type._id} value={type._id}>
                    {type.nom} ({type.devise})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Contrat *</label>
              <select
                value={formData.contrat}
                onChange={(e) => setFormData({ ...formData, contrat: e.target.value })}
                required
              >
                <option value="">Sélectionner un contrat</option>
                {contrats.map(contrat => (
                  <option key={contrat._id} value={contrat._id}>
                    {contrat.numeroContrat}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Montant HT *</label>
              <input
                type="number"
                step="0.01"
                value={formData.montantHT}
                onChange={(e) => setFormData({ ...formData, montantHT: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Date d'échéance *</label>
              <input
                type="date"
                value={formData.dateEcheance}
                onChange={(e) => setFormData({ ...formData, dateEcheance: e.target.value })}
                required
              />
            </div>

            <button type="submit" className="btn-success">Créer la facture</button>
          </form>
        </div>
      )}

      {/* Tableau des factures */}
      <div className="table-container">
        <table className="factures-table">
          <thead>
            <tr>
              <th>N° Facture</th>
              <th>Type</th>
              <th>Contrat</th>
              <th>Montant TTC</th>
              <th>Devise</th>
              <th>Date échéance</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {factures.map((facture) => (
              <tr key={facture._id}>
                <td className="facture-number">{facture.numeroFacture}</td>
                <td>{facture.typeFacture?.nom}</td>
                <td>{facture.contrat?.numeroContrat || '-'}</td>
                <td className="montant">{facture.montantTTC?.toLocaleString()}</td>
                <td>{facture.devise}</td>
                <td>
                  {facture.dateEcheance ? new Date(facture.dateEcheance).toLocaleDateString('fr-FR') : '-'}
                </td>
                <td>
                  <span className={`status-badge ${getStatutClass(facture.statut)}`}>
                    {facture.statut}
                  </span>
                </td>
                <td className="actions">
                  <button
                    onClick={() => handleExportPDF(facture._id)}
                    className="btn-pdf"
                    title="PDF"
                  >
                    📄
                  </button>
                  {facture.statut !== 'Payée' && (
                    <>
                      <button
                        onClick={() => handleUpdateStatut(facture._id, 'Payée')}
                        className="btn-success"
                        title="Marquer payée"
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => handleUpdateStatut(facture._id, 'Annulée')}
                        className="btn-danger"
                        title="Annuler"
                      >
                        ✗
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleDeleteFacture(facture._id)}
                    className="btn-danger"
                    title="Supprimer"
                  >
                        🗑
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Factures;