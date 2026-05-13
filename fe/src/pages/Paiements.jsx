import React, { useState, useEffect } from 'react';
import axios from 'axios';
//import './Paiements.css';

function Paiements() {
  const [paiements, setPaiements] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const role = user?.role;
  
  const api = axios.create({ 
    baseURL: 'http://localhost:5000/api', 
    headers: { Authorization: `Bearer ${token}` } 
  });

  useEffect(() => {
    fetchPaiements();
  }, []);

  const fetchPaiements = async () => {
    try {
      setLoading(true);
      const res = await api.get('/paiements');
      setPaiements(res.data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const validerPaiement = async (id) => {
    if (role !== 'Admin') {
      alert("Seul l'Admin peut valider un paiement");
      return;
    }
    try {
      await api.patch(`/paiements/${id}/valider`);
      fetchPaiements();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la validation');
    }
  };

  const getStatusClass = (statut) => {
    switch(statut.toLowerCase()) {
      case 'payé':
      case 'validé':
        return 'status-success';
      case 'en attente':
        return 'status-warning';
      case 'annulé':
        return 'status-danger';
      default:
        return 'status-default';
    }
  };

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Gestion des Paiements</h2>
      </div>
      
      {paiements.length === 0 ? (
        <div className="no-data">Aucun paiement trouvé</div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Numéro</th>
              <th>Facture</th>
              <th>Montant</th>
              <th>Mode</th>
              <th>Statut</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paiements.map(p => (
              <tr key={p._id}>
                <td>{p.numeroPaiement || p._id}</td>
                <td>{p.facture?.numeroFacture || p.factureId || '-'}</td>
                <td>{p.montant} {p.devise || 'TND'}</td>
                <td>{p.modePaiement}</td>
                <td className={getStatusClass(p.statut)}>{p.statut}</td>
                <td>{new Date(p.datePaiement || p.createdAt).toLocaleDateString()}</td>
                <td>
                  {p.statut === 'En attente' && role === 'Admin' && (
                    <button className="btn-success" onClick={() => validerPaiement(p._id)}>
                      Valider
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Paiements;