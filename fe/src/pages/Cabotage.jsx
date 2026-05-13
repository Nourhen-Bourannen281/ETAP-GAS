import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../css/Cabotage.css';

function Cabotage() {
  const [cabotages, setCabotages] = useState([]);
  const [clients, setClients] = useState([]);
  const [produits, setProduits] = useState([]);
  const [transporteurs, setTransporteurs] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatut, setSelectedStatut] = useState('');

  const [form, setForm] = useState({
    client: '',
    produit: '',
    quantite: '',
    prixUnitaire: '',
    devise: 'TND',
    typeOperation: 'Vente',
    pointDepart: '',
    pointArrivee: '',
    transporteur: '',
    dateLivraisonPrevue: '',
    commentaire: ''
  });

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
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 3500);
  };

  const fetchCabotages = async () => {
    try {
      setLoading(true);
      const res = await api.get('/cabotage');
      setCabotages(res.data);
    } catch (error) {
      addToast('Erreur lors du chargement', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await api.get('/tiers?type=0');
      setClients(res.data);
    } catch (error) {
      console.error('Erreur chargement clients:', error);
    }
  };

  const fetchProduits = async () => {
    try {
      const res = await api.get('/products');
      // Filtrer les produits de type pétrole brut
      const petroleBrut = res.data.filter(p => 
        p.nom?.toLowerCase().includes('pétrole') || 
        p.nom?.toLowerCase().includes('brut') ||
        p.nom?.toLowerCase().includes('petrole') ||
        p.typeProduit?.nom?.toLowerCase().includes('pétrole')
      );
      setProduits(petroleBrut.length > 0 ? petroleBrut : res.data);
    } catch (error) {
      console.error('Erreur chargement produits:', error);
    }
  };

  const fetchTransporteurs = async () => {
    try {
      const res = await api.get('/cabotage/transporteurs');
      setTransporteurs(res.data);
    } catch (error) {
      console.error('Erreur chargement transporteurs:', error);
    }
  };

  useEffect(() => {
    fetchCabotages();
    if (isCommercial || isAdmin) {
      fetchClients();
      fetchProduits();
      fetchTransporteurs();
    }
  }, []);

  const handleSave = async () => {
    if (!form.client || !form.produit || !form.quantite || !form.prixUnitaire) {
      addToast('Veuillez remplir tous les champs obligatoires', 'error');
      return;
    }

    try {
      setLoading(true);
      
      if (editingId) {
        await api.put(`/cabotage/${editingId}`, form);
        addToast('Opération modifiée avec succès', 'success');
      } else {
        await api.post('/cabotage', form);
        addToast('Opération créée avec succès', 'success');
      }
      
      setShowModal(false);
      setEditingId(null);
      resetForm();
      fetchCabotages();
    } catch (error) {
      addToast(error.response?.data?.message || 'Erreur lors de la sauvegarde', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      client: '',
      produit: '',
      quantite: '',
      prixUnitaire: '',
      devise: 'TND',
      typeOperation: 'Vente',
      pointDepart: '',
      pointArrivee: '',
      transporteur: '',
      dateLivraisonPrevue: '',
      commentaire: ''
    });
  };

  const handleEdit = (cabotage) => {
    setEditingId(cabotage._id);
    setForm({
      client: cabotage.client?._id || cabotage.client,
      produit: cabotage.produit?._id || cabotage.produit,
      quantite: cabotage.quantite,
      prixUnitaire: cabotage.prixUnitaire,
      devise: cabotage.devise,
      typeOperation: cabotage.typeOperation,
      pointDepart: cabotage.pointDepart || '',
      pointArrivee: cabotage.pointArrivee || '',
      transporteur: cabotage.transporteur?._id || cabotage.transporteur || '',
      dateLivraisonPrevue: cabotage.dateLivraisonPrevue?.split('T')[0] || '',
      commentaire: cabotage.commentaire || ''
    });
    setShowModal(true);
  };

  const updateStatut = async (id, statut, bonLivraison = '', bonPesee = '') => {
    try {
      setLoading(true);
      await api.patch(`/cabotage/${id}/statut`, { statut, numeroBonLivraison: bonLivraison, numeroBonPesee: bonPesee });
      addToast(`Statut mis à jour: ${statut}`, 'success');
      fetchCabotages();
    } catch (error) {
      addToast('Erreur lors de la mise à jour', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, numero) => {
    if (window.confirm(`Supprimer l'opération ${numero} ?`)) {
      try {
        await api.delete(`/cabotage/${id}`);
        addToast('Opération supprimée avec succès', 'success');
        fetchCabotages();
      } catch (error) {
        addToast('Erreur lors de la suppression', 'error');
      }
    }
  };

  const exportExcel = async () => {
    try {
      const response = await api.get('/cabotage/export/excel', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'cabotage.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      addToast('Export Excel réussi', 'success');
    } catch (error) {
      addToast('Erreur export Excel', 'error');
    }
  };

  const exportPDF = async () => {
    try {
      const response = await api.get('/cabotage/export/pdf', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'cabotage.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      addToast('Export PDF réussi', 'success');
    } catch (error) {
      addToast('Erreur export PDF', 'error');
    }
  };

  const getStatutClass = (statut) => {
    switch(statut) {
      case 'En attente': return 'statut-attente';
      case 'Validée': return 'statut-validee';
      case 'En transit': return 'statut-transit';
      case 'Livrée': return 'statut-livree';
      case 'Facturée': return 'statut-facturee';
      case 'Annulée': return 'statut-annulee';
      default: return '';
    }
  };

  const filteredCabotages = cabotages.filter(c => {
    const clientNom = c.client?.raisonSociale || c.client?.nom || '';
    const matchesSearch = c.numeroCabotage?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          clientNom.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatut = !selectedStatut || c.statut === selectedStatut;
    return matchesSearch && matchesStatut;
  });

  const stats = {
    total: cabotages.length,
    enAttente: cabotages.filter(c => c.statut === 'En attente').length,
    enTransit: cabotages.filter(c => c.statut === 'En transit').length,
    livrees: cabotages.filter(c => c.statut === 'Livrée').length,
    totalMontant: cabotages.reduce((sum, c) => sum + (c.montantTotal || 0), 0)
  };

  return (
    <div className="cabotage-page">
      {/* Toasts */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <span>{toast.message}</span>
            <button onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}>×</button>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="cabotage-header">
        <div className="header-left">
          <h2>🛢️ Cabotage - Pétrole Brut</h2>
          <p>Gestion des opérations de cabotage (production nationale) - Livraison à STIR</p>
          <div className="info-banner">
            <span className="banner-icon">🛢️</span>
            <span>Production nationale de pétrole brut - Livraison aux clients STIR</span>
          </div>
        </div>

        <div className="cabotage-stats">
          <div className="stat-card"><div className="stat-number">{stats.total}</div><div className="stat-label">Total opérations</div></div>
          <div className="stat-card warning"><div className="stat-number">{stats.enAttente}</div><div className="stat-label">En attente</div></div>
          <div className="stat-card info"><div className="stat-number">{stats.enTransit}</div><div className="stat-label">En transit</div></div>
          <div className="stat-card success"><div className="stat-number">{stats.livrees}</div><div className="stat-label">Livrées</div></div>
          <div className="stat-card primary"><div className="stat-number">{stats.totalMontant.toLocaleString()} TND</div><div className="stat-label">Montant total</div></div>
        </div>

        <div className="header-buttons">
          <button className="btn-excel" onClick={exportExcel} disabled={loading}>📊 Excel</button>
          <button className="btn-pdf" onClick={exportPDF} disabled={loading}>📄 PDF</button>
          {(isCommercial || isAdmin) && (
            <button className="btn-nouveau" onClick={() => { resetForm(); setShowModal(true); }}>
              + Nouvelle Opération
            </button>
          )}
        </div>
      </div>

      {/* Filtres */}
      <div className="filters-section">
        <input type="text" placeholder="🔍 Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="search-input" />
        <div className="statut-filter">
          <button className={`filter-btn ${!selectedStatut ? 'active' : ''}`} onClick={() => setSelectedStatut('')}>Tous</button>
          <button className={`filter-btn ${selectedStatut === 'En attente' ? 'active' : ''}`} onClick={() => setSelectedStatut('En attente')}>⏳ En attente</button>
          <button className={`filter-btn ${selectedStatut === 'Validée' ? 'active' : ''}`} onClick={() => setSelectedStatut('Validée')}>✅ Validée</button>
          <button className={`filter-btn ${selectedStatut === 'En transit' ? 'active' : ''}`} onClick={() => setSelectedStatut('En transit')}>🚚 En transit</button>
          <button className={`filter-btn ${selectedStatut === 'Livrée' ? 'active' : ''}`} onClick={() => setSelectedStatut('Livrée')}>📦 Livrée</button>
        </div>
      </div>

      {/* Tableau */}
      <div className="cabotage-table-wrapper">
        {loading ? (
          <div className="loading-block"><div className="spinner"></div><p>Chargement...</p></div>
        ) : filteredCabotages.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">🛢️</div><h4>Aucune opération de cabotage</h4></div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>N° Cabotage</th>
                <th>Client</th>
                <th>Produit</th>
                <th>Quantité (bl)</th>
                <th>Montant</th>
                <th>Type</th>
                <th>Statut</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCabotages.map(cabotage => (
                <tr key={cabotage._id}>
                  <td><strong>{cabotage.numeroCabotage}</strong></td>
                  <td>{cabotage.client?.raisonSociale || `${cabotage.client?.nom || ''} ${cabotage.client?.prenom || ''}`}</td>
                  <td>{cabotage.produit?.nom} ({cabotage.produit?.uniteMesure || 'bl'})</td>
                  <td>{cabotage.quantite?.toLocaleString()}</td>
                  <td className="montant">{cabotage.montantTotal?.toLocaleString()} {cabotage.devise}</td>
                  <td>{cabotage.typeOperation}</td>
                  <td><span className={`status-badge ${getStatutClass(cabotage.statut)}`}>{cabotage.statut}</span></td>
                  <td>{new Date(cabotage.dateOperation).toLocaleDateString()}</td>
                  <td className="actions-cell">
                    {(isCommercial || isAdmin) && cabotage.statut !== 'Facturée' && cabotage.statut !== 'Livrée' && (
                      <button className="btn-edit" onClick={() => handleEdit(cabotage)}>✏️</button>
                    )}
                    {cabotage.statut === 'En attente' && (isCommercial || isAdmin) && (
                      <button className="btn-validate" onClick={() => updateStatut(cabotage._id, 'Validée')}>✅</button>
                    )}
                    {cabotage.statut === 'Validée' && (isCommercial || isAdmin) && (
                      <button className="btn-transit" onClick={() => updateStatut(cabotage._id, 'En transit')}>🚚</button>
                    )}
                    {cabotage.statut === 'En transit' && (isCommercial || isAdmin) && (
                      <button className="btn-delivered" onClick={() => {
                        const bonLivraison = prompt('Numéro du bon de livraison:');
                        const bonPesee = prompt('Numéro du bon de pesée:');
                        if (bonLivraison && bonPesee) {
                          updateStatut(cabotage._id, 'Livrée', bonLivraison, bonPesee);
                        } else {
                          updateStatut(cabotage._id, 'Livrée');
                        }
                      }}>📦</button>
                    )}
                    {isAdmin && cabotage.statut !== 'Facturée' && (
                      <button className="btn-delete" onClick={() => handleDelete(cabotage._id, cabotage.numeroCabotage)}>🗑️</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {(isCommercial || isAdmin) && showModal && (
        <div className="modal-overlay" onClick={() => !loading && setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingId ? 'Modifier l\'opération' : 'Nouvelle opération de cabotage'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Client (STIR) *</label>
                <select value={form.client} onChange={e => setForm({...form, client: e.target.value})}>
                  <option value="">-- Choisir un client --</option>
                  {clients.map(c => <option key={c._id} value={c._id}>{c.raisonSociale || `${c.nom} ${c.prenom}`}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Produit (Pétrole Brut) *</label>
                <select value={form.produit} onChange={e => setForm({...form, produit: e.target.value})}>
                  <option value="">-- Choisir un produit --</option>
                  {produits.map(p => <option key={p._id} value={p._id}>{p.nom} - {p.prixUnitaire} TND/{p.uniteMesure || 'bl'}</option>)}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Quantité (Barils) *</label>
                  <input type="number" placeholder="Quantité en barils" value={form.quantite} onChange={e => setForm({...form, quantite: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Prix Unitaire (TND/bl) *</label>
                  <input type="number" placeholder="Prix unitaire" value={form.prixUnitaire} onChange={e => setForm({...form, prixUnitaire: e.target.value})} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Point de départ</label>
                  <input type="text" placeholder="Ex: Plateforme A" value={form.pointDepart} onChange={e => setForm({...form, pointDepart: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Point d'arrivée</label>
                  <input type="text" placeholder="Ex: Raffinerie STIR" value={form.pointArrivee} onChange={e => setForm({...form, pointArrivee: e.target.value})} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Type d'opération</label>
                  <select value={form.typeOperation} onChange={e => setForm({...form, typeOperation: e.target.value})}>
                    <option value="Vente">Vente</option>
                    <option value="Transport">Transport</option>
                    <option value="Stockage">Stockage</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Transporteur</label>
                  <select value={form.transporteur} onChange={e => setForm({...form, transporteur: e.target.value})}>
                    <option value="">-- Choisir un transporteur --</option>
                    {transporteurs.map(t => <option key={t._id} value={t._id}>{t.nom} {t.prenom} - {t.email}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Date de livraison prévue</label>
                <input type="date" value={form.dateLivraisonPrevue} onChange={e => setForm({...form, dateLivraisonPrevue: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Commentaire</label>
                <textarea rows="3" placeholder="Notes..." value={form.commentaire} onChange={e => setForm({...form, commentaire: e.target.value})} />
              </div>
              <div className="total-preview">
                <strong>Montant total:</strong> {(parseFloat(form.quantite) || 0) * (parseFloat(form.prixUnitaire) || 0)} TND
              </div>
            </div>
            <div className="modal-buttons">
              <button className="btn-cancel" onClick={() => setShowModal(false)}>Annuler</button>
              <button className="btn-save" onClick={handleSave} disabled={loading}>{loading ? 'En cours...' : (editingId ? 'Modifier' : 'Créer')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Cabotage;