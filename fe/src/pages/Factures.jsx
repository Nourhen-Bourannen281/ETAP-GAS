import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../css/Factures.css';

function Factures() {
  const [factures, setFactures] = useState([]);
  const [contrats, setContrats] = useState([]);
  const [typesFacture, setTypesFacture] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    typeFacture: '',
    contrat: '',
    montantHT: '',
    dateEcheance: ''
  });
  const [toasts, setToasts] = useState([]);
  const [stats, setStats] = useState({});

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'Admin';
  const isCommercial = user.role === 'Commercial';

  const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: { Authorization: `Bearer ${token}` }
  });

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 5000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [facturesRes, contratsRes, typesRes, statsRes] = await Promise.all([
        api.get('/factures'),
        api.get('/contrats'),
        api.get('/types-facture'),
        api.get('/factures/stats')
      ]);
      setFactures(facturesRes.data);
      setContrats(contratsRes.data);
      setTypesFacture(typesRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Erreur:', error);
      addToast('Erreur de chargement', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Vérifier que seul le commercial peut créer une facture
    if (!isCommercial) {
      addToast('Vous n\'avez pas les droits pour créer une facture', 'error');
      setShowModal(false);
      return;
    }

    if (!formData.typeFacture) {
      addToast('Veuillez sélectionner un type de facture', 'error');
      return;
    }
    if (!formData.contrat) {
      addToast('Veuillez sélectionner un contrat', 'error');
      return;
    }
    if (!formData.montantHT || parseFloat(formData.montantHT) <= 0) {
      addToast('Veuillez entrer un montant valide', 'error');
      return;
    }
    if (!formData.dateEcheance) {
      addToast('Veuillez entrer une date d\'échéance', 'error');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        typeFacture: formData.typeFacture,
        contrat: formData.contrat,
        montantHT: parseFloat(formData.montantHT),
        dateEcheance: formData.dateEcheance
      };

      await api.post('/factures', payload);
      addToast('✅ Facture créée avec succès', 'success');
      setShowModal(false);
      setFormData({ typeFacture: '', contrat: '', montantHT: '', dateEcheance: '' });
      fetchData();
    } catch (error) {
      console.error('Erreur création facture:', error.response?.data);
      addToast(error.response?.data?.message || 'Erreur lors de la création', 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateStatut = async (id, statut) => {
    // L'admin peut modifier le statut, le commercial peut aussi
    if (!isAdmin && !isCommercial) {
      addToast('Vous n\'avez pas les droits pour modifier le statut', 'error');
      return;
    }

    try {
      await api.patch(`/factures/${id}/statut`, { statut });
      addToast('Statut mis à jour', 'success');
      fetchData();
    } catch (error) {
      addToast('Erreur lors de la mise à jour', 'error');
    }
  };

  const downloadPDF = async (id, numero) => {
    try {
      const response = await api.get(`/factures/${id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `facture_${numero}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      addToast('PDF téléchargé', 'success');
    } catch (error) {
      addToast('Erreur lors du téléchargement', 'error');
    }
  };

  const getDeviseIcon = (devise) => devise === 'USD' ? '💵' : '💰';

  return (
    <div className="factures-page">
      {/* Toasts */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <span>{toast.message}</span>
            <button onClick={() => removeToast(toast.id)}>×</button>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="factures-header">
        <div className="header-content">
          <h1>Gestion des Factures</h1>
          <p>Factures locales (TND) et export (USD)</p>
          {isAdmin && <span className="role-badge admin">👑 Admin</span>}
          {isCommercial && <span className="role-badge commercial">💼 Commercial</span>}
        </div>
      </div>

      {/* Stats */}
      <div className="factures-stats">
        <div className="stat-card">
          <div className="stat-value">{stats.total || 0}</div>
          <div className="stat-label">Total</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-value">{stats.enAttente || 0}</div>
          <div className="stat-label">En attente</div>
        </div>
        <div className="stat-card success">
          <div className="stat-value">{stats.payees || 0}</div>
          <div className="stat-label">Payées</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {stats.totalMontant?.toLocaleString() || 0} TND
          </div>
          <div className="stat-label">Montant total</div>
        </div>
      </div>

      {/* Bouton nouvelle facture - Seul le commercial peut créer */}
      {isCommercial && (
        <div className="factures-actions">
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            + Nouvelle Facture
          </button>
        </div>
      )}

      {/* Message pour l'admin qui n'a pas le droit de créer */}
      

      {/* Tableau */}
      {loading ? (
        <div className="loading">Chargement...</div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>N° Facture</th>
                <th>Type</th>
                <th>Contrat</th>
                <th>Montant TTC</th>
                <th>Devise</th>
                <th>Échéance</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {factures.map(f => (
                <tr key={f._id}>
                  <td><strong>{f.numeroFacture}</strong></td>
                  <td>{f.typeFacture?.nom || '-'}</td>
                  <td>{f.contrat?.numeroContrat || '-'}</td>
                  <td>{f.montantTTC?.toLocaleString()}</td>
                  <td>{getDeviseIcon(f.devise)} {f.devise}</td>
                  <td>{new Date(f.dateEcheance).toLocaleDateString()}</td>
                  <td>
                    {/* Admin et Commercial peuvent modifier le statut */}
                    {(isAdmin || isCommercial) ? (
                      <select
                        className={`status-select status-${f.statut}`}
                        value={f.statut}
                        onChange={(e) => updateStatut(f._id, e.target.value)}
                      >
                        <option value="En attente">En attente</option>
                        <option value="Payée">Payée</option>
                        <option value="Annulée">Annulée</option>
                      </select>
                    ) : (
                      <span className={`status-badge status-${f.statut}`}>
                        {f.statut}
                      </span>
                    )}
                  </td>
                  <td>
                    {/* Tous les utilisateurs peuvent télécharger le PDF */}
                    {f.pdfPath && (
                      <button
                        className="btn-pdf-small"
                        onClick={() => downloadPDF(f._id, f.numeroFacture)}
                      >
                        📄 PDF
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal création - Seul le commercial peut voir ce modal */}
      {showModal && isCommercial && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Nouvelle Facture</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Type de facture *</label>
                  <select
                    value={formData.typeFacture}
                    onChange={e => setFormData({ ...formData, typeFacture: e.target.value })}
                    required
                  >
                    <option value="">-- Sélectionner un type --</option>
                    {typesFacture.map(t => (
                      <option key={t._id} value={t._id}>{t.nom}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Contrat *</label>
                  <select
                    value={formData.contrat}
                    onChange={e => setFormData({ ...formData, contrat: e.target.value })}
                    required
                  >
                    <option value="">-- Sélectionner un contrat --</option>
                    {contrats.map(c => (
                      <option key={c._id} value={c._id}>{c.numeroContrat}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Montant HT *</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Montant hors taxes"
                    value={formData.montantHT}
                    onChange={e => setFormData({ ...formData, montantHT: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Date d'échéance *</label>
                  <input
                    type="date"
                    value={formData.dateEcheance}
                    onChange={e => setFormData({ ...formData, dateEcheance: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="modal-buttons">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowModal(false)}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn-save"
                  disabled={loading}
                >
                  {loading ? 'Création...' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Si l'admin essaie d'ouvrir le modal, afficher un message */}
      {showModal && !isCommercial && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Accès refusé</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="error-message">
                ⚠️ Vous n'avez pas les droits pour créer une facture.
                <br />
                <br />
                Seuls les utilisateurs avec le rôle "Commercial" peuvent créer des factures.
              </div>
            </div>
            <div className="modal-buttons">
              <button
                className="btn-cancel"
                onClick={() => setShowModal(false)}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Factures;