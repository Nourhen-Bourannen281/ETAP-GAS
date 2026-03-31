import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../css/Livraison.css';

function Livraisons() {
  const [livraisons, setLivraisons] = useState([]);
  const [commandes, setCommandes] = useState([]);
  const [transporteurs, setTransporteurs] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedCommande, setSelectedCommande] = useState(null);
  const [selectedLivraison, setSelectedLivraison] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEtat, setSelectedEtat] = useState('');

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
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  useEffect(() => {
    fetchLivraisons();
    if (isCommercial) {
      fetchCommandesValidees();
      fetchTransporteurs();
    }
    if (isAdmin) {
      fetchTransporteurs();
    }
  }, []);

  const fetchLivraisons = async () => {
    try {
      setLoading(true);
      const res = await api.get('/livraisons');
      setLivraisons(res.data);
    } catch (error) {
      console.error('Erreur chargement livraisons:', error);
      addToast('Erreur lors du chargement des livraisons', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchCommandesValidees = async () => {
    try {
      const res = await api.get('/commandes?statut=Validée');
      setCommandes(res.data);
    } catch (error) {
      console.error('Erreur chargement commandes:', error);
    }
  };

  const fetchTransporteurs = async () => {
    try {
      const res = await api.get('/users/transporteurs');
      setTransporteurs(res.data);
      console.log('Transporteurs chargés:', res.data);
    } catch (error) {
      console.error('Erreur chargement transporteurs:', error);
      addToast('Erreur lors du chargement des transporteurs', 'error');
      setTransporteurs([]);
    }
  };

  const getTransporteurNom = (transporteur) => {
    if (!transporteur) return 'Non assigné';
    return transporteur.raisonSociale || transporteur.nom || transporteur.name || transporteur.email || 'Transporteur';
  };

  // ==================== COMMERCIAL ====================
  const createLivraison = async () => {
    if (!isCommercial) {
      addToast('Accès non autorisé.', 'error');
      return;
    }
    
    if (!selectedCommande) {
      addToast('Veuillez sélectionner une commande', 'error');
      return;
    }
    
    try {
      setLoading(true);
      await api.post(`/livraisons/from-commande/${selectedCommande._id}`);
      addToast('✅ Livraison créée avec succès !', 'success');
      setShowModal(false);
      setSelectedCommande(null);
      fetchLivraisons();
      fetchCommandesValidees();
    } catch (error) {
      console.error('Erreur création livraison:', error);
      addToast(error.response?.data?.message || '❌ Erreur lors de la création', 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateEtat = async (livraisonId, nouvelEtat, commentaire = '') => {
    if (!isCommercial) {
      addToast('Accès non autorisé.', 'error');
      return;
    }
    
    try {
      setLoading(true);
      await api.patch(`/livraisons/${livraisonId}/etat`, { etat: nouvelEtat, commentaire });
      
      let message = '';
      switch(nouvelEtat) {
        case 'Prête': message = '✅ Livraison marquée comme prête'; break;
        case 'En cours': message = '🚚 Livraison en cours'; break;
        case 'Livrée': message = '📦 Livraison marquée comme livrée'; break;
        case 'Annulée': message = '❌ Livraison annulée'; break;
        default: message = `État mis à jour: ${nouvelEtat}`;
      }
      addToast(message, 'success');
      fetchLivraisons();
    } catch (error) {
      console.error('Erreur mise à jour état:', error);
      addToast(error.response?.data?.message || 'Erreur lors de la mise à jour', 'error');
    } finally {
      setLoading(false);
    }
  };

  const downloadBonLivraison = async (livraisonId, numeroLivraison) => {
    if (!isCommercial) {
      addToast('Accès non autorisé.', 'error');
      return;
    }
    
    try {
      setLoading(true);
      const response = await api.get(`/livraisons/${livraisonId}/pdf`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `bon_livraison_${numeroLivraison}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      addToast('📄 Bon de livraison téléchargé', 'success');
    } catch (error) {
      console.error('Erreur téléchargement PDF:', error);
      addToast('❌ Erreur lors du téléchargement', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ==================== ADMIN ====================
  const assignTransporteur = async (livraisonId, transporteurId) => {
    if (!isAdmin) {
      addToast('Accès non autorisé.', 'error');
      return;
    }
    
    try {
      setLoading(true);
      await api.patch(`/livraisons/${livraisonId}/assign-transporteur`, { transporteurId });
      const transporteur = transporteurs.find(t => t._id === transporteurId);
      const transporteurNom = getTransporteurNom(transporteur);
      addToast(`✅ Transporteur "${transporteurNom}" assigné avec succès`, 'success');
      setShowAssignModal(false);
      fetchLivraisons();
    } catch (error) {
      console.error('Erreur assignation transporteur:', error);
      addToast(error.response?.data?.message || '❌ Erreur lors de l\'assignation', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ==================== FONCTIONS UTILITAIRES ====================
  const getEtatClass = (etat) => {
    switch(etat) {
      case 'À préparer': return 'etat-preparer';
      case 'Prête': return 'etat-prete';
      case 'En cours': return 'etat-cours';
      case 'Livrée': return 'etat-livree';
      case 'Annulée': return 'etat-annulee';
      default: return '';
    }
  };

  const getEtatIcon = (etat) => {
    switch(etat) {
      case 'À préparer': return '⏳';
      case 'Prête': return '✅';
      case 'En cours': return '🚚';
      case 'Livrée': return '📦';
      case 'Annulée': return '❌';
      default: return '📄';
    }
  };

  // Fonction getEtatsPossibles pour le commercial
  const getEtatsPossibles = (etatActuel) => {
    switch(etatActuel) {
      case 'À préparer': return ['Prête', 'Annulée'];
      case 'Prête': return ['En cours', 'Annulée'];
      case 'En cours': return ['Livrée', 'Annulée'];
      default: return [];
    }
  };

  const filteredLivraisons = livraisons.filter(l => {
    const transporteurNom = getTransporteurNom(l.transporteur);
    const matchesSearch = l.numeroLivraison?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          l.commande?.numeroCommande?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          transporteurNom.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEtat = !selectedEtat || l.etat === selectedEtat;
    return matchesSearch && matchesEtat;
  });

  const stats = {
    total: livraisons.length,
    aPreparer: livraisons.filter(l => l.etat === 'À préparer').length,
    prete: livraisons.filter(l => l.etat === 'Prête').length,
    enCours: livraisons.filter(l => l.etat === 'En cours').length,
    livrees: livraisons.filter(l => l.etat === 'Livrée').length
  };

  return (
    <div className="livraisons-page">
      {/* Toast Notifications */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <div className="toast-content">
              {toast.type === 'success' && <span className="toast-icon">✓</span>}
              {toast.type === 'error' && <span className="toast-icon">✗</span>}
              <span className="toast-message">{toast.message}</span>
            </div>
            <button 
              className="toast-close" 
              onClick={() => removeToast(toast.id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div className="livraisons-header">
        <div className="header-left">
          <h2>Gestion des Livraisons</h2>
          <p>Suivez et gérez vos livraisons</p>
          <div className="role-badges">
            {isAdmin && <span className="role-badge admin">👑 Admin (Supervision + Signature livreur)</span>}
            {isCommercial && <span className="role-badge commercial">💼 Commercial (Gestion complète)</span>}
          </div>
        </div>

        <div className="livraisons-stats">
          <div className="stat-card">
            <div className="stat-number">{stats.total}</div>
            <div className="stat-label">Total</div>
          </div>
          <div className="stat-card warning">
            <div className="stat-number">{stats.aPreparer}</div>
            <div className="stat-label">À préparer</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.prete}</div>
            <div className="stat-label">Prête</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.enCours}</div>
            <div className="stat-label">En cours</div>
          </div>
          <div className="stat-card success">
            <div className="stat-number">{stats.livrees}</div>
            <div className="stat-label">Livrées</div>
          </div>
        </div>

        {isCommercial && (
          <button className="btn-nouveau" onClick={() => setShowModal(true)} disabled={loading}>
            <span>+</span> Nouvelle Livraison
          </button>
        )}
      </div>

      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="🔍 Rechercher par n° livraison, commande ou transporteur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="etat-filter">
          <button className={`filter-btn ${!selectedEtat ? 'active' : ''}`} onClick={() => setSelectedEtat('')}>
            Tous
          </button>
          <button className={`filter-btn ${selectedEtat === 'À préparer' ? 'active' : ''}`} onClick={() => setSelectedEtat('À préparer')}>
            ⏳ À préparer
          </button>
          <button className={`filter-btn ${selectedEtat === 'Prête' ? 'active' : ''}`} onClick={() => setSelectedEtat('Prête')}>
            ✅ Prête
          </button>
          <button className={`filter-btn ${selectedEtat === 'En cours' ? 'active' : ''}`} onClick={() => setSelectedEtat('En cours')}>
            🚚 En cours
          </button>
          <button className={`filter-btn ${selectedEtat === 'Livrée' ? 'active' : ''}`} onClick={() => setSelectedEtat('Livrée')}>
            📦 Livrée
          </button>
        </div>
      </div>

      {loading && !livraisons.length ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Chargement des livraisons...</p>
        </div>
      ) : filteredLivraisons.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🚚</div>
          <h4>Aucune livraison trouvée</h4>
          <p>{searchTerm || selectedEtat ? 'Aucune livraison ne correspond à vos critères' : 'Commencez par créer une livraison'}</p>
          {isCommercial && !searchTerm && !selectedEtat && (
            <button className="btn-add-first" onClick={() => setShowModal(true)}>
              + Créer une livraison
            </button>
          )}
        </div>
      ) : (
        <div className="livraisons-grid">
          {filteredLivraisons.map(livraison => (
            <div key={livraison._id} className="livraison-card">
              <div className="livraison-header">
                <div>
                  <span className="livraison-num">{livraison.numeroLivraison}</span>
                  <span className="commande-ref">Commande: {livraison.commande?.numeroCommande}</span>
                </div>
                <div className={`livraison-etat ${getEtatClass(livraison.etat)}`}>
                  {getEtatIcon(livraison.etat)} {livraison.etat}
                </div>
              </div>

              <div className="livraison-body">
                <div className="info-row">
                  <span className="info-label">Transporteur:</span>
                  <span className="info-value">
                    {getTransporteurNom(livraison.transporteur)}
                    {isAdmin && !livraison.transporteur && (
                      <button className="btn-assign" onClick={() => {
                        setSelectedLivraison(livraison);
                        setShowAssignModal(true);
                      }}>
                        ✍️ Signer un livreur
                      </button>
                    )}
                    {isAdmin && livraison.transporteur && (
                      <button className="btn-change" onClick={() => {
                        setSelectedLivraison(livraison);
                        setShowAssignModal(true);
                      }}>
                        🔄 Changer livreur
                      </button>
                    )}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Date création:</span>
                  <span className="info-value">{new Date(livraison.dateCreation).toLocaleDateString()}</span>
                </div>
                {livraison.dateArriveePrevue && (
                  <div className="info-row">
                    <span className="info-label">Arrivée prévue:</span>
                    <span className="info-value">{new Date(livraison.dateArriveePrevue).toLocaleDateString()}</span>
                  </div>
                )}
                {livraison.commentaire && (
                  <div className="info-row">
                    <span className="info-label">Commentaire:</span>
                    <span className="info-value">{livraison.commentaire}</span>
                  </div>
                )}
              </div>

              <div className="livraison-actions">
                {isCommercial && (
                  <button 
                    className="btn-pdf" 
                    onClick={() => downloadBonLivraison(livraison._id, livraison.numeroLivraison)}
                    disabled={loading}
                  >
                    📄 Bon de livraison
                  </button>
                )}
                
                {isCommercial && (
                  getEtatsPossibles(livraison.etat).map(etat => (
                    <button 
                      key={etat} 
                      className="btn-etat" 
                      onClick={() => updateEtat(livraison._id, etat)}
                      disabled={loading}
                    >
                      {etat === 'Prête' && '✅ Marquer prête'}
                      {etat === 'En cours' && '🚚 Mettre en cours'}
                      {etat === 'Livrée' && '📦 Marquer livrée'}
                      {etat === 'Annulée' && '❌ Annuler'}
                    </button>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal création livraison */}
      {isCommercial && showModal && (
        <div className="modal-overlay" onClick={() => !loading && setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Nouvelle Livraison</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Sélectionner une commande validée *</label>
                <select 
                  value={selectedCommande?._id || ''} 
                  onChange={e => {
                    const cmd = commandes.find(c => c._id === e.target.value);
                    setSelectedCommande(cmd);
                  }}
                >
                  <option value="">-- Choisir une commande --</option>
                  {commandes.map(cmd => (
                    <option key={cmd._id} value={cmd._id}>
                      {cmd.numeroCommande} - {cmd.montantTotal?.toLocaleString()} TND
                    </option>
                  ))}
                </select>
                {commandes.length === 0 && (
                  <small className="info-text">Aucune commande validée disponible</small>
                )}
              </div>
            </div>
            <div className="modal-buttons">
              <button className="btn-cancel" onClick={() => setShowModal(false)} disabled={loading}>
                Annuler
              </button>
              <button className="btn-save" onClick={createLivraison} disabled={loading}>
                {loading ? 'Création...' : 'Créer la livraison'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal assignation transporteur */}
      {isAdmin && showAssignModal && selectedLivraison && (
        <div className="modal-overlay" onClick={() => !loading && setShowAssignModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Signer un livreur</h3>
              <button className="modal-close" onClick={() => setShowAssignModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Sélectionner un transporteur / livreur *</label>
                <select id="transporteurSelect" defaultValue="">
                  <option value="">-- Choisir un transporteur --</option>
                  {transporteurs.map(t => (
                    <option key={t._id} value={t._id}>
                      {getTransporteurNom(t)} - {t.email || t.telephone || 'Sans contact'}
                    </option>
                  ))}
                </select>
                {transporteurs.length === 0 && (
                  <small className="info-text">Aucun transporteur disponible</small>
                )}
              </div>
            </div>
            <div className="modal-buttons">
              <button className="btn-cancel" onClick={() => setShowAssignModal(false)} disabled={loading}>
                Annuler
              </button>
              <button 
                className="btn-save" 
                onClick={() => {
                  const select = document.getElementById('transporteurSelect');
                  const transporteurId = select.value;
                  if (transporteurId) {
                    assignTransporteur(selectedLivraison._id, transporteurId);
                  } else {
                    addToast('Veuillez sélectionner un transporteur', 'error');
                  }
                }}
                disabled={loading}
              >
                {loading ? 'Assignation...' : 'Signer le livreur'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Livraisons;