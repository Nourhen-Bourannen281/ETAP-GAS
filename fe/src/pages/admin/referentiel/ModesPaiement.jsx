import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../../css/Banques.css';

function ModesPaiement() {
  const [data, setData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ nom: '', description: '', actif: true });
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const role = user?.role;

  const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: { Authorization: `Bearer ${token}` }
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/modes-paiement');
      setData(res.data);
    } catch (error) {
      console.error('Erreur chargement modes de paiement:', error);
      alert('Erreur lors du chargement des modes de paiement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async () => {
    if (!form.nom.trim()) {
      alert('Le nom est obligatoire');
      return;
    }

    try {
      setLoading(true);
      if (editingId) {
        await api.put(`/modes-paiement/${editingId}`, {
          nom: form.nom.trim(),
          description: form.description,
          actif: form.actif
        });
        alert('Mode de paiement modifié avec succès');
      } else {
        await api.post('/modes-paiement', {
          nom: form.nom.trim(),
          description: form.description
        });
        alert('Mode de paiement ajouté avec succès');
      }

      setShowModal(false);
      setEditingId(null);
      setForm({ nom: '', description: '', actif: true });
      fetchData();
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      alert(error.response?.data?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    setForm({
      nom: item.nom,
      description: item.description || '',
      actif: item.actif !== undefined ? item.actif : true
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Supprimer ce mode de paiement ? Cette action est irréversible.')) {
      try {
        setLoading(true);
        await api.delete(`/modes-paiement/${id}`);
        alert('Mode de paiement supprimé avec succès');
        fetchData();
      } catch (error) {
        console.error('Erreur suppression:', error);
        alert(error.response?.data?.message || 'Erreur lors de la suppression');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      setLoading(true);
      const res = await api.patch(`/modes-paiement/${id}/toggle`);
      alert(res.data.message);
      fetchData();
    } catch (error) {
      console.error('Erreur changement statut:', error);
      alert('Erreur lors du changement de statut');
    } finally {
      setLoading(false);
    }
  };

  // Vérifier si l'utilisateur est admin
  if (role !== 'Admin') {
    return (
      <div className="page-contrats">
        <div className="header-contrats">
          <h2>Modes de Paiement</h2>
          <div className="access-denied">
            <p>⛔ Accès réservé aux administrateurs</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-contrats">
      <div className="header-contrats">
        <h2>Modes de Paiement</h2>
        <p>Gestion des modes de paiement disponibles pour les clients</p>
      </div>

      <button 
        className="btn-nouveau"
        onClick={() => {
          setEditingId(null);
          setForm({ nom: '', description: '', actif: true });
          setShowModal(true);
        }}
        disabled={loading}
      >
        + Nouveau Mode de Paiement
      </button>

      {loading && !showModal ? (
        <div className="loading-spinner">Chargement...</div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Nom du Mode</th>
              <th>Description</th>
              <th>Statut</th>
              <th>Date de création</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center">Aucun mode de paiement trouvé</td>
              </tr>
            ) : (
              data.map(item => (
                <tr key={item._id}>
                  <td className="font-medium">
                    <span className={`mode-badge ${item.actif ? 'active' : 'inactive'}`}>
                      {item.nom}
                    </span>
                  </td>
                  <td>{item.description || '-'}</td>
                  <td>
                    <span className={`status-badge ${item.actif ? 'status-active' : 'status-inactive'}`}>
                      {item.actif ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td>{new Date(item.dateCreation).toLocaleDateString('fr-FR')}</td>
                  <td className="actions">
                    <button 
                      onClick={() => handleToggleStatus(item._id, item.actif)} 
                      className={`btn-toggle ${item.actif ? 'btn-disable' : 'btn-enable'}`}
                      title={item.actif ? 'Désactiver' : 'Activer'}
                    >
                      {item.actif ? '🔴 Désactiver' : '🟢 Activer'}
                    </button>
                    <button onClick={() => handleEdit(item)} className="btn-edit">
                      ✏️ Modifier
                    </button>
                    <button onClick={() => handleDelete(item._id)} className="btn-delete">
                      🗑️ Supprimer
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingId ? 'Modifier Mode de Paiement' : 'Nouveau Mode de Paiement'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Nom du mode *</label>
                <input
                  type="text"
                  placeholder="Ex: Carte bancaire, Virement, Chèque, Espèces, PayPal..."
                  value={form.nom}
                  onChange={e => setForm({ ...form, nom: e.target.value })}
                  autoFocus
                />
                <small className="form-hint">Exemples courants: Carte bancaire, Virement bancaire, Chèque, Espèces</small>
              </div>

              <div className="form-group">
                <label>Description (optionnel)</label>
                <textarea
                  placeholder="Description du mode de paiement..."
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  rows="3"
                />
                <small className="form-hint">Information supplémentaire pour les clients</small>
              </div>

              {editingId && (
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={form.actif}
                      onChange={e => setForm({ ...form, actif: e.target.checked })}
                    />
                    <span>Actif (visible pour les clients)</span>
                  </label>
                  <small className="form-hint">Les modes inactifs ne seront pas affichés aux clients</small>
                </div>
              )}
            </div>

            <div className="modal-buttons">
              <button className="btn-cancel" onClick={() => setShowModal(false)} disabled={loading}>
                Annuler
              </button>
              <button className="btn-save" onClick={handleSave} disabled={loading}>
                {loading ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ModesPaiement;