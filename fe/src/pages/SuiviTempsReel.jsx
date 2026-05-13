import React, { useState, useEffect } from 'react';
import axios from 'axios';

function SuiviTempsReel() {
  const [livraisons, setLivraisons] = useState([]);
  const [historique, setHistorique] = useState([]);
  const [selectedLivraison, setSelectedLivraison] = useState(null);
  const [activeTab, setActiveTab] = useState('suivi');
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);

  const token = localStorage.getItem('token');
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
    fetchLivraisons();
  }, []);

  const fetchLivraisons = async () => {
    try {
      setLoading(true);
      const res = await api.get('/livraisons');
      setLivraisons(res.data);
    } catch (error) {
      addToast('Erreur de chargement', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistorique = async (livraisonId) => {
    try {
      setLoading(true);
      const res = await api.get(`/historique/entity/Livraison/${livraisonId}`);
      setHistorique(res.data);
    } catch (error) {
      addToast('Erreur chargement historique', 'error');
    } finally {
      setLoading(false);
    }
  };

  const selectLivraison = (livraison) => {
    setSelectedLivraison(livraison);
    fetchHistorique(livraison._id);
    setActiveTab('historique');
  };

  const getEtatClass = (etat) => {
    switch(etat) {
      case 'À préparer': return 'status-preparer';
      case 'Prête': return 'status-prete';
      case 'En cours': return 'status-encours';
      case 'Livrée': return 'status-livree';
      default: return '';
    }
  };

  const getEtatIcon = (etat) => {
    switch(etat) {
      case 'À préparer': return '⏳';
      case 'Prête': return '✅';
      case 'En cours': return '🚚';
      case 'Livrée': return '📦';
      default: return '📄';
    }
  };

  return (
    <div className="suivi-container">
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast ${toast.type}`}>
            <span>{toast.message}</span>
            <button onClick={() => removeToast(toast.id)}>×</button>
          </div>
        ))}
      </div>

      <div className="header">
        <h1>🚚 Suivi des Livraisons</h1>
        <p>Suivi en temps réel et historique des actions</p>
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === 'suivi' ? 'active' : ''}`} onClick={() => setActiveTab('suivi')}>
          📍 Suivi en direct
        </button>
        <button className={`tab ${activeTab === 'historique' ? 'active' : ''}`} onClick={() => setActiveTab('historique')}>
          📜 Historique des actions
        </button>
      </div>

      {activeTab === 'suivi' && (
        <div className="suivi-grid">
          {loading ? (
            <div className="loading">Chargement...</div>
          ) : livraisons.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🚚</div>
              <h3>Aucune livraison</h3>
              <p>Aucune livraison en cours</p>
            </div>
          ) : (
            livraisons.map(liv => (
              <div key={liv._id} className="suivi-card" onClick={() => selectLivraison(liv)}>
                <div className="card-header">
                  <span className="livraison-num">{liv.numeroLivraison}</span>
                  <span className={`status-badge ${getEtatClass(liv.etat)}`}>
                    {getEtatIcon(liv.etat)} {liv.etat}
                  </span>
                </div>
                <div className="card-body">
                  <div className="info-row"><label>Commande:</label><span>{liv.commande?.numeroCommande}</span></div>
                  <div className="info-row"><label>Transporteur:</label><span>{liv.transporteur?.raisonSociale || 'Non assigné'}</span></div>
                  <div className="info-row"><label>Date création:</label><span>{new Date(liv.dateCreation).toLocaleDateString()}</span></div>
                </div>
                <div className="progress-bar">
                  <div className={`progress-step ${liv.etat === 'À préparer' ? 'active' : liv.etat === 'Prête' || liv.etat === 'En cours' || liv.etat === 'Livrée' ? 'completed' : ''}`}>📝</div>
                  <div className={`progress-line ${liv.etat === 'Prête' || liv.etat === 'En cours' || liv.etat === 'Livrée' ? 'active' : ''}`}></div>
                  <div className={`progress-step ${liv.etat === 'Prête' ? 'active' : liv.etat === 'En cours' || liv.etat === 'Livrée' ? 'completed' : ''}`}>✅</div>
                  <div className={`progress-line ${liv.etat === 'En cours' || liv.etat === 'Livrée' ? 'active' : ''}`}></div>
                  <div className={`progress-step ${liv.etat === 'En cours' ? 'active' : liv.etat === 'Livrée' ? 'completed' : ''}`}>🚚</div>
                  <div className={`progress-line ${liv.etat === 'Livrée' ? 'active' : ''}`}></div>
                  <div className={`progress-step ${liv.etat === 'Livrée' ? 'active completed' : ''}`}>📦</div>
                </div>
                <div className="progress-labels">
                  <span>À préparer</span><span>Prête</span><span>En cours</span><span>Livrée</span>
                </div>
                <button className="btn-details" onClick={(e) => { e.stopPropagation(); selectLivraison(liv); }}>Voir historique →</button>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'historique' && selectedLivraison && (
        <div className="historique-section">
          <div className="historique-header">
            <h2>Historique - {selectedLivraison.numeroLivraison}</h2>
            <button className="btn-back" onClick={() => setActiveTab('suivi')}>← Retour</button>
          </div>
          <div className="timeline">
            {historique.length === 0 ? (
              <div className="empty-timeline">Aucun historique disponible</div>
            ) : (
              historique.map((h, index) => (
                <div key={h._id} className="timeline-item">
                  <div className="timeline-dot"></div>
                  <div className="timeline-content">
                    <div className="timeline-date">{new Date(h.dateAction).toLocaleString()}</div>
                    <div className="timeline-action">
                      <span className="action-badge">{h.action}</span>
                      {h.ancienStatut && <span> de <strong>{h.ancienStatut}</strong> → <strong>{h.nouveauStatut}</strong></span>}
                    </div>
                    <div className="timeline-user">Par: {h.utilisateur?.nom || 'Système'}</div>
                    {h.details && <div className="timeline-details">{h.details}</div>}
                  </div>
                  {index < historique.length - 1 && <div className="timeline-line"></div>}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <style>{`
        .suivi-container { padding: 20px; max-width: 1200px; margin: 0 auto; }
        .header { margin-bottom: 30px; }
        .tabs { display: flex; gap: 10px; margin-bottom: 20px; border-bottom: 2px solid #e0e0e0; }
        .tab { padding: 10px 20px; background: none; border: none; cursor: pointer; font-size: 16px; }
        .tab.active { color: #3498db; border-bottom: 3px solid #3498db; }
        .suivi-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 20px; }
        .suivi-card { background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); cursor: pointer; transition: transform 0.2s; }
        .suivi-card:hover { transform: translateY(-5px); }
        .card-header { display: flex; justify-content: space-between; margin-bottom: 15px; }
        .livraison-num { font-weight: bold; font-size: 16px; }
        .status-badge { padding: 4px 8px; border-radius: 20px; font-size: 12px; }
        .status-preparer { background: #fef3e2; color: #f39c12; }
        .status-prete { background: #e3f2fd; color: #3498db; }
        .status-encours { background: #e8f5e9; color: #27ae60; }
        .status-livree { background: #e8f5e9; color: #27ae60; }
        .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
        .info-row label { color: #7f8c8d; }
        .progress-bar { display: flex; align-items: center; margin: 20px 0 10px; }
        .progress-step { width: 30px; height: 30px; background: #ecf0f1; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; }
        .progress-step.active { background: #3498db; color: white; }
        .progress-step.completed { background: #27ae60; color: white; }
        .progress-line { flex: 1; height: 3px; background: #ecf0f1; margin: 0 5px; }
        .progress-line.active { background: #27ae60; }
        .progress-labels { display: flex; justify-content: space-between; font-size: 10px; color: #7f8c8d; margin-bottom: 15px; }
        .btn-details { width: 100%; padding: 8px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer; }
        .historique-section { background: white; border-radius: 12px; padding: 20px; }
        .historique-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .timeline { position: relative; padding-left: 30px; }
        .timeline-item { position: relative; margin-bottom: 20px; }
        .timeline-dot { position: absolute; left: -25px; top: 5px; width: 12px; height: 12px; background: #3498db; border-radius: 50%; }
        .timeline-line { position: absolute; left: -19px; top: 20px; width: 2px; height: calc(100% - 10px); background: #e0e0e0; }
        .timeline-content { background: #f8f9fa; padding: 15px; border-radius: 8px; }
        .timeline-date { font-size: 12px; color: #7f8c8d; margin-bottom: 5px; }
        .timeline-action { font-size: 14px; margin-bottom: 5px; }
        .action-badge { background: #3498db; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; margin-right: 8px; }
        .toast-container { position: fixed; top: 20px; right: 20px; z-index: 1100; }
        .toast { background: white; padding: 10px 15px; margin: 5px; border-radius: 5px; display: flex; justify-content: space-between; gap: 20px; }
        .toast.success { border-left: 4px solid #27ae60; }
        .toast.error { border-left: 4px solid #e74c3c; }
      `}</style>
    </div>
  );
}

export default SuiviTempsReel;