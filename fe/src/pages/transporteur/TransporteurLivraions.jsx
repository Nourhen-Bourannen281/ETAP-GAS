import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTruck, faCheckCircle, faPlay, faStop, faSync, faBoxOpen } from '@fortawesome/free-solid-svg-icons';
//import '../css/TransporteurLivraisons.css';

function TransporteurLivraisons() {
  const [livraisons, setLivraisons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('prete'); // 'prete', 'encours', 'livree'

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isTransporteur = user.role === 'Transporteur';

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
    if (!isTransporteur) {
      addToast('Accès non autorisé', 'error');
      return;
    }
    fetchMesLivraisons();
  }, []);

  const fetchMesLivraisons = async () => {
    try {
      setLoading(true);
      const res = await api.get('/livraisons');
      
      // Filtrer uniquement les livraisons assignées à ce transporteur
      const userId = user._id;
      const mesLivraisons = res.data.filter(l => l.transporteur?._id === userId);
      
      setLivraisons(mesLivraisons);
      console.log('Mes livraisons:', mesLivraisons);
    } catch (error) {
      console.error('Erreur chargement livraisons:', error);
      addToast('Erreur lors du chargement des livraisons', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Démarrer transport (Prête -> En cours)
  const demarrerTransport = async (livraisonId) => {
    try {
      setLoading(true);
      await api.patch(`/livraisons/${livraisonId}/etat`, { etat: 'En cours' });
      addToast('🚚 Transport démarré avec succès', 'success');
      fetchMesLivraisons();
    } catch (error) {
      console.error('Erreur démarrage transport:', error);
      addToast(error.response?.data?.message || 'Erreur lors du démarrage', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Terminer transport (En cours -> Livrée)
  const terminerTransport = async (livraisonId) => {
    try {
      setLoading(true);
      await api.patch(`/livraisons/${livraisonId}/etat`, { etat: 'Livrée' });
      addToast('📦 Transport terminé avec succès', 'success');
      fetchMesLivraisons();
    } catch (error) {
      console.error('Erreur terminaison transport:', error);
      addToast(error.response?.data?.message || 'Erreur lors de la terminaison', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getTransporteurNom = (transporteur) => {
    if (!transporteur) return 'Non assigné';
    return transporteur.raisonSociale || transporteur.nom || transporteur.name || transporteur.email || 'Transporteur';
  };

  const getEtatIcon = (etat) => {
    switch(etat) {
      case 'Prête': return '✅';
      case 'En cours': return '🚚';
      case 'Livrée': return '📦';
      default: return '📄';
    }
  };

  // Filtrer les livraisons par recherche
  const filterBySearch = (livraisonsList) => {
    if (!searchTerm) return livraisonsList;
    return livraisonsList.filter(l => 
      l.numeroLivraison?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.commande?.numeroCommande?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Séparer les livraisons par état
  const livraisonsPrete = livraisons.filter(l => l.etat === 'Prête');
  const livraisonsEnCours = livraisons.filter(l => l.etat === 'En cours');
  const livraisonsLivree = livraisons.filter(l => l.etat === 'Livrée');

  const filteredPrete = filterBySearch(livraisonsPrete);
  const filteredEnCours = filterBySearch(livraisonsEnCours);
  const filteredLivree = filterBySearch(livraisonsLivree);

  const stats = {
    prete: livraisonsPrete.length,
    enCours: livraisonsEnCours.length,
    livree: livraisonsLivree.length,
    total: livraisons.length
  };

  return (
    <div className="transporteur-container">
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

      {/* Header */}
      <div className="transporteur-header">
        <div className="header-left">
          <h2>
            <FontAwesomeIcon icon={faTruck} /> Mes Livraisons
          </h2>
          <p>Gérez vos livraisons assignées</p>
        </div>
        <div className="stats-cards">
          <div className="stat-card prete">
            <div className="stat-number">{stats.prete}</div>
            <div className="stat-label">À démarrer</div>
          </div>
          <div className="stat-card encours">
            <div className="stat-number">{stats.enCours}</div>
            <div className="stat-label">En cours</div>
          </div>
          <div className="stat-card livree">
            <div className="stat-number">{stats.livree}</div>
            <div className="stat-label">Terminées</div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="search-section">
        <input
          type="text"
          placeholder="🔍 Rechercher par numéro de livraison ou commande..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <button 
          className={`tab-btn ${activeTab === 'prete' ? 'active' : ''}`}
          onClick={() => setActiveTab('prete')}
        >
          <FontAwesomeIcon icon={faPlay} /> À démarrer ({filteredPrete.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'encours' ? 'active' : ''}`}
          onClick={() => setActiveTab('encours')}
        >
          <FontAwesomeIcon icon={faSync} /> En cours ({filteredEnCours.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'livree' ? 'active' : ''}`}
          onClick={() => setActiveTab('livree')}
        >
          <FontAwesomeIcon icon={faCheckCircle} /> Terminées ({filteredLivree.length})
        </button>
      </div>

      {/* Loading Spinner */}
      {loading && (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Chargement...</p>
        </div>
      )}

      {/* Section: À démarrer (Prête) */}
      {activeTab === 'prete' && (
        <div className="livraisons-section">
          <div className="section-header">
            <h3><FontAwesomeIcon icon={faPlay} /> Livraisons à démarrer</h3>
          </div>
          {filteredPrete.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">✅</div>
              <h4>Aucune livraison à démarrer</h4>
              <p>Toutes vos livraisons sont en cours ou terminées</p>
            </div>
          ) : (
            <div className="livraisons-grid">
              {filteredPrete.map(livraison => (
                <div key={livraison._id} className="livraison-card prete-card">
                  <div className="card-header">
                    <span className="livraison-num">{livraison.numeroLivraison}</span>
                    <span className="etat-badge prete">
                      {getEtatIcon(livraison.etat)} À démarrer
                    </span>
                  </div>
                  <div className="card-body">
                    <div className="info-row">
                      <span className="label">Commande:</span>
                      <span className="value">{livraison.commande?.numeroCommande}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Date création:</span>
                      <span className="value">{new Date(livraison.dateCreation).toLocaleDateString()}</span>
                    </div>
                    {livraison.dateArriveePrevue && (
                      <div className="info-row">
                        <span className="label">Arrivée prévue:</span>
                        <span className="value">{new Date(livraison.dateArriveePrevue).toLocaleDateString()}</span>
                      </div>
                    )}
                    <div className="info-row">
                      <span className="label">Transporteur:</span>
                      <span className="value">{getTransporteurNom(livraison.transporteur)}</span>
                    </div>
                  </div>
                  <div className="card-actions">
                    <button 
                      className="btn-start"
                      onClick={() => demarrerTransport(livraison._id)}
                      disabled={loading}
                    >
                      <FontAwesomeIcon icon={faPlay} /> Démarrer la livraison
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Section: En cours */}
      {activeTab === 'encours' && (
        <div className="livraisons-section">
          <div className="section-header">
            <h3><FontAwesomeIcon icon={faSync} /> Livraisons en cours</h3>
          </div>
          {filteredEnCours.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🚚</div>
              <h4>Aucune livraison en cours</h4>
              <p>Vous n'avez aucune livraison en cours pour le moment</p>
            </div>
          ) : (
            <div className="livraisons-grid">
              {filteredEnCours.map(livraison => (
                <div key={livraison._id} className="livraison-card encours-card">
                  <div className="card-header">
                    <span className="livraison-num">{livraison.numeroLivraison}</span>
                    <span className="etat-badge encours">
                      {getEtatIcon(livraison.etat)} En cours
                    </span>
                  </div>
                  <div className="card-body">
                    <div className="info-row">
                      <span className="label">Commande:</span>
                      <span className="value">{livraison.commande?.numeroCommande}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Date création:</span>
                      <span className="value">{new Date(livraison.dateCreation).toLocaleDateString()}</span>
                    </div>
                    {livraison.dateArriveePrevue && (
                      <div className="info-row">
                        <span className="label">Arrivée prévue:</span>
                        <span className="value">{new Date(livraison.dateArriveePrevue).toLocaleDateString()}</span>
                      </div>
                    )}
                    <div className="info-row">
                      <span className="label">Transporteur:</span>
                      <span className="value">{getTransporteurNom(livraison.transporteur)}</span>
                    </div>
                  </div>
                  <div className="card-actions">
                    <button 
                      className="btn-end"
                      onClick={() => terminerTransport(livraison._id)}
                      disabled={loading}
                    >
                      <FontAwesomeIcon icon={faCheckCircle} /> Terminer la livraison
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Section: Terminées (Livrée) */}
      {activeTab === 'livree' && (
        <div className="livraisons-section">
          <div className="section-header">
            <h3><FontAwesomeIcon icon={faCheckCircle} /> Livraisons terminées</h3>
          </div>
          {filteredLivree.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📦</div>
              <h4>Aucune livraison terminée</h4>
              <p>Les livraisons terminées apparaîtront ici</p>
            </div>
          ) : (
            <div className="livraisons-grid">
              {filteredLivree.map(livraison => (
                <div key={livraison._id} className="livraison-card livree-card">
                  <div className="card-header">
                    <span className="livraison-num">{livraison.numeroLivraison}</span>
                    <span className="etat-badge livree">
                      {getEtatIcon(livraison.etat)} Terminée
                    </span>
                  </div>
                  <div className="card-body">
                    <div className="info-row">
                      <span className="label">Commande:</span>
                      <span className="value">{livraison.commande?.numeroCommande}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Date création:</span>
                      <span className="value">{new Date(livraison.dateCreation).toLocaleDateString()}</span>
                    </div>
                    {livraison.dateLivraison && (
                      <div className="info-row">
                        <span className="label">Date livraison:</span>
                        <span className="value">{new Date(livraison.dateLivraison).toLocaleDateString()}</span>
                      </div>
                    )}
                    <div className="info-row">
                      <span className="label">Transporteur:</span>
                      <span className="value">{getTransporteurNom(livraison.transporteur)}</span>
                    </div>
                  </div>
                  <div className="card-actions">
                    <span className="completed-badge">
                      <FontAwesomeIcon icon={faCheckCircle} /> Livraison terminée
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default TransporteurLivraisons;