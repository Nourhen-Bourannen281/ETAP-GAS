import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../css/Commandes.css';

function Commandes() {
  const [commandes, setCommandes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);
  
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'Admin';
  const isCommercial = user.role === 'Commercial';

  const api = axios.create({ 
    baseURL: 'http://localhost:5000/api', 
    headers: { Authorization: `Bearer ${token}` } 
  });

  // Toast notifications
  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 5000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  useEffect(() => {
    fetchCommandes();
  }, []);

  const fetchCommandes = async () => {
    try {
      setLoading(true);
      const res = await api.get('/commandes');
      setCommandes(res.data);
    } catch (error) {
      console.error('Erreur chargement commandes:', error);
      addToast('Erreur lors du chargement des commandes', 'error');
    } finally {
      setLoading(false);
    }
  };

  const validerCommande = async (id, statut) => {
    try {
      setLoading(true);
      await api.patch(`/commandes/${id}/valider`, { statut });
      addToast(`Commande ${statut === 'Validée' ? 'validée' : 'refusée'} avec succès`, 'success');
      fetchCommandes();
    } catch (error) {
      console.error('Erreur validation commande:', error);
      addToast(error.response?.data?.message || 'Erreur lors de la validation', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour supprimer une commande
  const supprimerCommande = async (id, numeroCommande) => {
    if (!isAdmin && !isCommercial) {
      addToast('Accès non autorisé', 'error');
      return;
    }
    
    const confirmDelete = window.confirm(`Êtes-vous sûr de vouloir supprimer la commande ${numeroCommande} ?`);
    if (!confirmDelete) return;
    
    try {
      setLoading(true);
      await api.delete(`/commandes/${id}`);
      addToast(`✅ Commande ${numeroCommande} supprimée avec succès`, 'success');
      fetchCommandes();
    } catch (error) {
      console.error('Erreur suppression commande:', error);
      addToast(error.response?.data?.message || '❌ Erreur lors de la suppression', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusClass = (statut) => {
    switch(statut) {
      case 'Validée': return 'status-validated';
      case 'Attente': return 'status-pending';
      case 'Refusée': return 'status-refused';
      case 'Livrée': return 'status-delivered';
      default: return '';
    }
  };

  const getStatusText = (statut) => {
    switch(statut) {
      case 'Validée': return '✅ Validée';
      case 'Attente': return '⏳ En attente';
      case 'Refusée': return '❌ Refusée';
      case 'Livrée': return '📦 Livrée';
      default: return statut;
    }
  };

  return (
    <div className="page-container">
      {/* Toast Notifications */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <div className="toast-content">
              {toast.type === 'success' && <span className="toast-icon">✓</span>}
              {toast.type === 'error' && <span className="toast-icon">✗</span>}
              <span className="toast-message">{toast.message}</span>
            </div>
            <button className="toast-close" onClick={() => removeToast(toast.id)}>×</button>
          </div>
        ))}
      </div>

      <div className="header-section">
        <h2>Gestion des Commandes</h2>
        <p>Liste de toutes les commandes</p>
      </div>

      {loading && commandes.length === 0 ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Chargement des commandes...</p>
        </div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Numéro</th>
              <th>Client</th>
              <th>Montant</th>
              <th>Statut</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {commandes.map(cmd => (
              <tr key={cmd._id}>
                <td>{cmd.numeroCommande}</td>
                <td>{cmd.client?.raisonSociale || cmd.client?.nom || 'N/A'}</td>
                <td>{cmd.montantTotal?.toLocaleString()} TND</td>
                <td className={getStatusClass(cmd.statut)}>
                  {getStatusText(cmd.statut)}
                </td>
                <td>{new Date(cmd.dateCreation).toLocaleDateString()}</td>
                <td className="actions-cell">
                  {/* Boutons de validation/refus pour Commercial */}
                  {(isCommercial || isAdmin) && cmd.statut === 'Attente' && (
                    <>
                      <button 
                        className="btn-success" 
                        onClick={() => validerCommande(cmd._id, 'Validée')}
                        disabled={loading}
                      >
                        Valider
                      </button>
                      <button 
                        className="btn-danger" 
                        onClick={() => validerCommande(cmd._id, 'Refusée')}
                        disabled={loading}
                      >
                        Refuser
                      </button>
                    </>
                  )}
                  
                  {/* Bouton suppression pour Admin et Commercial */}
                  {(isAdmin || isCommercial) && (
                    <button 
                      className="btn-delete" 
                      onClick={() => supprimerCommande(cmd._id, cmd.numeroCommande)}
                      disabled={loading}
                    >
                      Supprimer
                    </button>
                  )}
                  
                  {/* Affichage si aucune action disponible */}
                  {!(isAdmin || isCommercial) && cmd.statut !== 'Attente' && (
                    <span className="no-actions">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {!loading && commandes.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <h4>Aucune commande trouvée</h4>
          <p>Commencez par créer une commande</p>
        </div>
      )}
    </div>
  );
}

export default Commandes;