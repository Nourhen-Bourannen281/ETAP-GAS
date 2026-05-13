import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../../css/Ref.css';

function TypesFacture() {
  const [data, setData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);

  const [form, setForm] = useState({
    nom: '',
    devise: 'TND'
  });

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'Admin';

  const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: { Authorization: `Bearer ${token}` }
  });

  // Toast notifications
  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 3500);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/types-facture');
      setData(res.data);
    } catch (error) {
      console.error('Erreur chargement types facture:', error);
      addToast('Erreur lors du chargement des types de facture', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async () => {
    try {
      // Validation
      if (!form.nom.trim()) {
        addToast('Le nom du type de facture est obligatoire', 'error');
        return;
      }
      if (!form.devise) {
        addToast('Veuillez sélectionner une devise', 'error');
        return;
      }

      setLoading(true);

      if (editingId) {
        await api.put(`/types-facture/${editingId}`, form);
        addToast('Type de facture modifié avec succès', 'success');
      } else {
        await api.post('/types-facture', form);
        addToast('Type de facture ajouté avec succès', 'success');
      }

      setShowModal(false);
      setEditingId(null);
      setForm({ nom: '', devise: 'TND' });
      fetchData();
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      addToast(error.response?.data?.message || 'Erreur lors de la sauvegarde', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    setForm({
      nom: item.nom,
      devise: item.devise
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce type de facture ?\n\n⚠️ Attention: Cette action peut affecter les factures existantes.')) {
      try {
        setLoading(true);
        await api.delete(`/types-facture/${id}`);
        addToast('Type de facture supprimé avec succès', 'success');
        fetchData();
      } catch (error) {
        console.error('Erreur suppression:', error);
        addToast(error.response?.data?.message || 'Erreur lors de la suppression', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  const getDeviseIcon = (devise) => {
    return devise === 'USD' ? '💵' : '💰';
  };

  const getDeviseLabel = (devise) => {
    return devise === 'USD' ? 'Dollar US (USD)' : 'Dinar Tunisien (TND)';
  };

  return (
    <div className="page-contrats">
      {/* Toast Notifications */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            {toast.type === 'success' && '✓'}
            {toast.type === 'error' && '✗'}
            {toast.type === 'info' && 'ℹ'}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

      <div className="header-contrats">
        <div className="header-left">
          <h2>Types de Facture</h2>
          <p>Gérez les différents types de factures (local et export)</p>
        </div>
        
        {/* Statistiques */}
        <div className="stock-stats">
          <div className="stat-card">
            <div className="stat-number">{data.length}</div>
            <div className="stat-label">Total types</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">
              {data.filter(t => t.devise === 'TND').length}
            </div>
            <div className="stat-label">💰 TND</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">
              {data.filter(t => t.devise === 'USD').length}
            </div>
            <div className="stat-label">💵 USD</div>
          </div>
        </div>

        {/* Seul l'admin peut ajouter des types de facture */}
        {isAdmin && (
          <button 
            className="btn-nouveau"
            onClick={() => {
              setEditingId(null);
              setForm({ nom: '', devise: 'TND' });
              setShowModal(true);
            }}
            disabled={loading}
          >
            <span>+</span> Nouveau Type
          </button>
        )}
      </div>

      {/* Message pour les non-admins */}
      {!isAdmin && (
        <div className="info-message">
          ℹ️ En tant qu'utilisateur standard, vous pouvez consulter les types de facture. 
          La création, modification et suppression sont réservées à l'administrateur.
        </div>
      )}

      {loading && !data.length ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Chargement des types de facture...</p>
        </div>
      ) : data.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📄</div>
          <h4>Aucun type de facture</h4>
          <p>Commencez par ajouter des types de facture (local ou export)</p>
          {isAdmin && (
            <button className="btn-add-first" onClick={() => setShowModal(true)}>
              + Ajouter votre premier type
            </button>
          )}
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Devise</th>
                <th>Date de création</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {data.map(item => (
                <tr key={item._id}>
                  <td className="font-medium">
                    <strong>{item.nom}</strong>
                  </td>
                  <td>
                    <span className="devise-badge">
                      {getDeviseIcon(item.devise)} {getDeviseLabel(item.devise)}
                    </span>
                  </td>
                  <td>
                    {new Date(item.dateCreation).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </td>
                  {isAdmin && (
                    <td className="actions">
                      <button 
                        onClick={() => handleEdit(item)} 
                        className="btn-edit"
                        disabled={loading}
                      >
                        ✏️ Modifier
                      </button>
                      <button 
                        onClick={() => handleDelete(item._id)} 
                        className="btn-delete"
                        disabled={loading}
                      >
                        🗑️ Supprimer
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Ajout/Modification - Seul l'admin peut voir et utiliser ce modal */}
      {isAdmin && showModal && (
        <div className="modal-overlay" onClick={() => !loading && setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingId ? 'Modifier le Type de Facture' : 'Ajouter un Type de Facture'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Nom du type de facture *</label>
                <input
                  type="text"
                  placeholder="Ex: Facture Locale, Facture Export, Avoir, etc."
                  value={form.nom}
                  onChange={(e) => setForm({ ...form, nom: e.target.value })}
                  autoFocus
                />
                <small>Nom unique qui identifie ce type de facture</small>
              </div>

              <div className="form-group">
                <label>Devise *</label>
                <select
                  value={form.devise}
                  onChange={(e) => setForm({ ...form, devise: e.target.value })}
                >
                  <option value="TND">💰 Dinar Tunisien (TND) - Factures locales</option>
                  <option value="USD">💵 Dollar US (USD) - Factures export</option>
                </select>
                <small>
                  {form.devise === 'TND' 
                    ? 'Utilisé pour les factures locales en Tunisie' 
                    : 'Utilisé pour les factures d\'exportation internationales'}
                </small>
              </div>

              {editingId && (
                <div className="info-note">
                  <div className="info-icon">ℹ️</div>
                  <div className="info-text">
                    <strong>Note:</strong> La modification du type de facture n'affecte pas les factures existantes.
                  </div>
                </div>
              )}
            </div>

            <div className="modal-buttons">
              <button 
                className="btn-cancel" 
                onClick={() => { setShowModal(false); setForm({ nom: '', devise: 'TND' }); }}
                disabled={loading}
              >
                Annuler
              </button>
              <button 
                className="btn-save" 
                onClick={handleSave}
                disabled={loading}
              >
                {loading ? 'En cours...' : (editingId ? 'Mettre à jour' : 'Ajouter')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TypesFacture;