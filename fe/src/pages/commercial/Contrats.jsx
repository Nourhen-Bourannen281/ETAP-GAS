import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../css/Contrats.css';

function Contrats() {
  const [data, setData] = useState([]);
  const [tiers, setTiers] = useState([]);
  const [sousProduits, setSousProduits] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatut, setSelectedStatut] = useState('');

  const [form, setForm] = useState({
    numeroContrat: '',
    type: 'Vente',
    dateDebut: new Date().toISOString().split('T')[0],
    dateFin: '',
    tiers: '',
    produits: [{ sousProduit: '', quantite: 1, prixUnitaire: '' }],
    devise: 'TND',
    statut: 'En cours'
  });

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'Admin';
  const isCommercial = user.role === 'Commercial';
  const isClient = user.role === 'Client';
  const isFournisseur = user.role === 'Fournisseur';

  // Le commercial peut tout faire
  const canEdit = isCommercial;
  const canCreate = isCommercial;
  const canDelete = isCommercial;
  const canValidate = isCommercial;

  const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: { Authorization: `Bearer ${token}` }
  });

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
      const res = await api.get('/contrats');
      setData(res.data);
    } catch (error) {
      console.error('Erreur chargement contrats:', error);
      addToast('Erreur lors du chargement des contrats', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchTiers = async () => {
    try {
      const res = await api.get('/tiers');
      setTiers(res.data);
    } catch (error) {
      console.error('Erreur chargement tiers:', error);
    }
  };

  const fetchSousProduits = async () => {
    try {
      const res = await api.get('/sous-produits');
      setSousProduits(res.data);
    } catch (error) {
      console.error('Erreur chargement sous-produits:', error);
    }
  };

  useEffect(() => {
    fetchData();
    fetchTiers();
    if (canCreate) {
      fetchSousProduits();
    }
  }, []);

  const handleAddProductLine = () => {
    setForm({
      ...form,
      produits: [...form.produits, { sousProduit: '', quantite: 1, prixUnitaire: '' }]
    });
  };

  const handleRemoveProductLine = (index) => {
    const newProduits = form.produits.filter((_, i) => i !== index);
    setForm({ ...form, produits: newProduits });
  };

  const handleProductChange = (index, field, value) => {
    const newProduits = [...form.produits];
    newProduits[index][field] = value;
    
    if (field === 'sousProduit' && value) {
      const selectedProduct = sousProduits.find(sp => sp._id === value);
      if (selectedProduct && selectedProduct.prixUnitaire) {
        newProduits[index].prixUnitaire = selectedProduct.prixUnitaire;
      }
    }
    
    setForm({ ...form, produits: newProduits });
  };

  const calculateTotal = () => {
    return form.produits.reduce((total, item) => {
      return total + (parseFloat(item.quantite) || 0) * (parseFloat(item.prixUnitaire) || 0);
    }, 0);
  };

  const handleSave = async () => {
    try {
      if (!form.numeroContrat.trim()) {
        addToast('Le numéro de contrat est requis', 'error');
        return;
      }
      if (!form.tiers) {
        addToast('Veuillez sélectionner un tiers', 'error');
        return;
      }
      if (form.produits.length === 0 || !form.produits[0].sousProduit) {
        addToast('Veuillez ajouter au moins un produit', 'error');
        return;
      }

      setLoading(true);
      const contratData = { ...form };

      if (editingId) {
        await api.put(`/contrats/${editingId}`, contratData);
        addToast('Contrat modifié avec succès', 'success');
      } else {
        await api.post('/contrats', contratData);
        addToast('Contrat créé avec succès', 'success');
      }

      setShowModal(false);
      setEditingId(null);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      addToast(error.response?.data?.message || 'Erreur lors de la sauvegarde', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      numeroContrat: '',
      type: 'Vente',
      dateDebut: new Date().toISOString().split('T')[0],
      dateFin: '',
      tiers: '',
      produits: [{ sousProduit: '', quantite: 1, prixUnitaire: '' }],
      devise: 'TND',
      statut: 'En cours'
    });
  };

  const handleEdit = (item) => {
    if (!canEdit) {
      addToast('Seuls les commerciaux peuvent modifier les contrats', 'error');
      return;
    }
    setEditingId(item._id);
    setForm({
      numeroContrat: item.numeroContrat,
      type: item.type,
      dateDebut: item.dateDebut?.split('T')[0] || '',
      dateFin: item.dateFin?.split('T')[0] || '',
      tiers: item.tiers?._id || item.tiers,
      produits: item.produits.map(p => ({
        sousProduit: p.sousProduit?._id || p.sousProduit,
        quantite: p.quantite,
        prixUnitaire: p.prixUnitaire
      })),
      devise: item.devise,
      statut: item.statut
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!canDelete) {
      addToast('Seuls les commerciaux peuvent supprimer les contrats', 'error');
      return;
    }
    if (window.confirm('Supprimer ce contrat ?')) {
      try {
        setLoading(true);
        await api.delete(`/contrats/${id}`);
        addToast('Contrat supprimé avec succès', 'success');
        fetchData();
      } catch (error) {
        console.error('Erreur suppression:', error);
        addToast(error.response?.data?.message || 'Erreur lors de la suppression', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  const validerContrat = async (id, numeroContrat) => {
    if (!canValidate) {
      addToast('Seuls les commerciaux peuvent valider les contrats', 'error');
      return;
    }
    
    try {
      setLoading(true);
      await api.patch(`/contrats/${id}/valider`);
      addToast(`✅ Contrat ${numeroContrat} validé avec succès`, 'success');
      fetchData();
    } catch (error) {
      console.error('Erreur validation contrat:', error);
      addToast(error.response?.data?.message || 'Erreur lors de la validation', 'error');
    } finally {
      setLoading(false);
    }
  };

  const exportContratPDF = async (contratId, numeroContrat) => {
    try {
      setLoading(true);
      const response = await api.get(`/contrats/${contratId}/pdf`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `contrat_${numeroContrat}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      addToast('PDF téléchargé avec succès', 'success');
    } catch (error) {
      console.error('Erreur export PDF:', error);
      addToast(error.response?.data?.message || 'Erreur lors du téléchargement du PDF', 'error');
    } finally {
      setLoading(false);
    }
  };

  const exportAllContratsPDF = async () => {
    if (!isAdmin) {
      addToast('Seul l\'administrateur peut exporter tous les contrats', 'error');
      return;
    }
    
    try {
      setLoading(true);
      const response = await api.get('/contrats/export/all/pdf', {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'tous_les_contrats.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      addToast('Tous les contrats exportés avec succès', 'success');
    } catch (error) {
      console.error('Erreur export tous contrats:', error);
      addToast('Erreur lors de l\'export des contrats', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatutColor = (statut) => {
    switch (statut) {
      case 'En cours': return 'statut-en-cours';
      case 'Validé': return 'statut-valide';
      case 'Terminé': return 'statut-termine';
      case 'Renouvelé': return 'statut-renouvele';
      default: return 'statut-defaut';
    }
  };

  const getStatutIcon = (statut) => {
    switch (statut) {
      case 'En cours': return '⏳';
      case 'Validé': return '✅';
      case 'Terminé': return '🏁';
      case 'Renouvelé': return '🔄';
      default: return '📄';
    }
  };

  const getTypeIcon = (type) => {
    return type === 'Vente' ? '📝' : '💰';
  };

  const filteredData = data.filter(item => {
    const matchesSearch = item.numeroContrat?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.tiers?.raisonSociale?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatut = !selectedStatut || item.statut === selectedStatut;
    return matchesSearch && matchesStatut;
  });

  const totalContrats = data.length;
  const contratsEnCours = data.filter(item => item.statut === 'En cours').length;
  const contratsValides = data.filter(item => item.statut === 'Validé').length;
  const montantTotal = data.reduce((total, item) => total + (item.montantTotal || 0), 0);

  return (
    <div className="page-contrats">
      {/* Toast Notifications */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

      <div className="header-contrats">
        <div className="header-left">
          <h2>Contrats</h2>
          <p>Gérez vos contrats de vente et d'achat</p>
          {isAdmin && <span className="role-badge admin">👑 Admin (Lecture seule)</span>}
          {isCommercial && <span className="role-badge commercial">💼 Commercial (CRUD complet)</span>}
          {(isClient || isFournisseur) && (
            <span className="role-badge client">👤 {isClient ? 'Client' : 'Fournisseur'} (Consultation)</span>
          )}
        </div>

        <div className="contrats-stats">
          <div className="stat-card">
            <div className="stat-number">{totalContrats}</div>
            <div className="stat-label">Total</div>
          </div>
          <div className="stat-card warning">
            <div className="stat-number">{contratsEnCours}</div>
            <div className="stat-label">En cours</div>
          </div>
          <div className="stat-card success">
            <div className="stat-number">{contratsValides}</div>
            <div className="stat-label">Validés</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{montantTotal.toLocaleString()} TND</div>
            <div className="stat-label">Montant total</div>
          </div>
        </div>

        <div className="header-buttons">
          {isAdmin && (
            <button className="btn-export-all" onClick={exportAllContratsPDF} disabled={loading}>
              📄 Exporter tous
            </button>
          )}
          {canCreate && (
            <button className="btn-nouveau" onClick={() => { resetForm(); setShowModal(true); }} disabled={loading}>
              + Nouveau Contrat
            </button>
          )}
        </div>
      </div>

      {/* Filtres */}
      <div className="filters-section">
        <input
          type="text"
          placeholder="🔍 Rechercher..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <div className="statut-filter">
          <button className={`filter-btn ${!selectedStatut ? 'active' : ''}`} onClick={() => setSelectedStatut('')}>
            Tous
          </button>
          <button className={`filter-btn ${selectedStatut === 'En cours' ? 'active' : ''}`} onClick={() => setSelectedStatut('En cours')}>
            ⏳ En cours
          </button>
          <button className={`filter-btn ${selectedStatut === 'Validé' ? 'active' : ''}`} onClick={() => setSelectedStatut('Validé')}>
            ✅ Validés
          </button>
        </div>
      </div>

      {loading && !data.length ? (
        <div className="loading-spinner">Chargement...</div>
      ) : filteredData.length === 0 ? (
        <div className="empty-state">
          <h4>Aucun contrat</h4>
          {canCreate && <button onClick={() => setShowModal(true)}>+ Créer un contrat</button>}
        </div>
      ) : (
        <div className="contrats-grid">
          {filteredData.map(item => (
            <div key={item._id} className="contrat-card">
              <div className="contrat-card-header">
                <div className="contrat-number">
                  <span>{getTypeIcon(item.type)}</span>
                  <strong>{item.numeroContrat}</strong>
                </div>
                <div className={`contrat-status ${getStatutColor(item.statut)}`}>
                  {getStatutIcon(item.statut)} {item.statut}
                </div>
              </div>
              
              <div className="contrat-card-body">
                <p><strong>Tiers:</strong> {item.tiers?.raisonSociale || '-'}</p>
                <p><strong>Montant:</strong> {item.montantTotal?.toLocaleString()} {item.devise}</p>
                <p><strong>Produits:</strong> {item.produits?.length || 0}</p>
              </div>

              <div className="contrat-card-actions">
                <button onClick={() => exportContratPDF(item._id, item.numeroContrat)} className="btn-pdf">
                  📄 PDF
                </button>
                {canValidate && item.statut !== 'Validé' && (
                  <button onClick={() => validerContrat(item._id, item.numeroContrat)} className="btn-valider">
                    ✅ Valider
                  </button>
                )}
                {canEdit && item.statut !== 'Validé' && (
                  <>
                    <button onClick={() => handleEdit(item)} className="btn-edit">✏️</button>
                    <button onClick={() => handleDelete(item._id)} className="btn-delete">🗑️</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {canCreate && showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingId ? 'Modifier' : 'Nouveau Contrat'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>

            <div className="modal-body">
              <input type="text" placeholder="Numéro contrat" value={form.numeroContrat} onChange={e => setForm({...form, numeroContrat: e.target.value})} />
              
              <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                <option value="Vente">Vente</option>
                <option value="Achat">Achat</option>
              </select>
              
              <select value={form.tiers} onChange={e => setForm({...form, tiers: e.target.value})}>
                <option value="">Sélectionner un tiers</option>
                {tiers.map(t => <option key={t._id} value={t._id}>{t.raisonSociale}</option>)}
              </select>

              <h4>Produits</h4>
              {form.produits.map((prod, idx) => (
                <div key={idx} className="produit-ligne">
                  <select value={prod.sousProduit} onChange={e => handleProductChange(idx, 'sousProduit', e.target.value)}>
                    <option value="">Sélectionner</option>
                    {sousProduits.map(sp => <option key={sp._id} value={sp._id}>{sp.nom}</option>)}
                  </select>
                  <input type="number" placeholder="Qté" value={prod.quantite} onChange={e => handleProductChange(idx, 'quantite', e.target.value)} />
                  <input type="number" placeholder="Prix" value={prod.prixUnitaire} onChange={e => handleProductChange(idx, 'prixUnitaire', e.target.value)} />
                  {form.produits.length > 1 && <button onClick={() => handleRemoveProductLine(idx)}>🗑️</button>}
                </div>
              ))}
              <button onClick={handleAddProductLine}>+ Ajouter</button>
              <div className="total">Total: {calculateTotal().toLocaleString()} {form.devise}</div>
            </div>

            <div className="modal-buttons">
              <button onClick={() => setShowModal(false)}>Annuler</button>
              <button onClick={handleSave} disabled={loading}>{loading ? 'En cours...' : 'Enregistrer'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Contrats;