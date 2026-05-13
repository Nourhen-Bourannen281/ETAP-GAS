import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../css/VenteLocale.css';

function VenteLocale() {
  const [ventes, setVentes] = useState([]);
  const [clients, setClients] = useState([]);
  const [produits, setProduits] = useState([]);
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

  const fetchVentes = async () => {
    try {
      setLoading(true);
      const res = await api.get('/ventes-locales');
      setVentes(res.data);
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
      // Filtrer les produits de type gaz naturel
      const gazNaturel = res.data.filter(p => 
        p.nom?.toLowerCase().includes('gaz') || 
        p.typeProduit?.nom?.toLowerCase().includes('gaz')
      );
      setProduits(gazNaturel.length > 0 ? gazNaturel : res.data);
    } catch (error) {
      console.error('Erreur chargement produits:', error);
    }
  };

  useEffect(() => {
    fetchVentes();
    if (isCommercial || isAdmin) {
      fetchClients();
      fetchProduits();
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
        await api.put(`/ventes-locales/${editingId}`, form);
        addToast('Vente modifiée avec succès', 'success');
      } else {
        await api.post('/ventes-locales', form);
        addToast('Vente créée avec succès', 'success');
      }
      
      setShowModal(false);
      setEditingId(null);
      resetForm();
      fetchVentes();
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
      dateLivraisonPrevue: '',
      commentaire: ''
    });
  };

  const handleEdit = (vente) => {
    setEditingId(vente._id);
    setForm({
      client: vente.client?._id || vente.client,
      produit: vente.produit?._id || vente.produit,
      quantite: vente.quantite,
      prixUnitaire: vente.prixUnitaire,
      devise: vente.devise,
      dateLivraisonPrevue: vente.dateLivraisonPrevue?.split('T')[0] || '',
      commentaire: vente.commentaire || ''
    });
    setShowModal(true);
  };

  const updateStatut = async (id, statut) => {
    try {
      setLoading(true);
      await api.patch(`/ventes-locales/${id}/statut`, { statut });
      addToast(`Statut mis à jour: ${statut}`, 'success');
      fetchVentes();
    } catch (error) {
      addToast('Erreur lors de la mise à jour', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, numero) => {
    if (window.confirm(`Supprimer la vente ${numero} ?`)) {
      try {
        await api.delete(`/ventes-locales/${id}`);
        addToast('Vente supprimée avec succès', 'success');
        fetchVentes();
      } catch (error) {
        addToast('Erreur lors de la suppression', 'error');
      }
    }
  };

  const exportExcel = async () => {
    try {
      const response = await api.get('/ventes-locales/export/excel', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'ventes_locales.xlsx');
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
      const response = await api.get('/ventes-locales/export/pdf', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'ventes_locales.pdf');
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
      case 'En livraison': return 'statut-livraison';
      case 'Livrée': return 'statut-livree';
      case 'Facturée': return 'statut-facturee';
      case 'Annulée': return 'statut-annulee';
      default: return '';
    }
  };

  const filteredVentes = ventes.filter(v => {
    const clientNom = v.client?.raisonSociale || v.client?.nom || '';
    const matchesSearch = v.numeroVente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          clientNom.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatut = !selectedStatut || v.statut === selectedStatut;
    return matchesSearch && matchesStatut;
  });

  const stats = {
    total: ventes.length,
    enAttente: ventes.filter(v => v.statut === 'En attente').length,
    livrees: ventes.filter(v => v.statut === 'Livrée').length,
    totalMontant: ventes.reduce((sum, v) => sum + (v.montantTotal || 0), 0)
  };

  return (
    <div className="vente-locale-page">
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
      <div className="vente-header">
        <div className="header-left">
          <h2>🏭 Ventes Locales - Gaz Naturel</h2>
          <p>Gestion des ventes de gaz naturel aux clients STEG et autres</p>
          <div className="info-banner">
            <span className="banner-icon">🌍</span>
            <span>Production nationale de gaz naturel - Livraison aux clients STEG</span>
          </div>
        </div>

        <div className="vente-stats">
          <div className="stat-card"><div className="stat-number">{stats.total}</div><div className="stat-label">Total ventes</div></div>
          <div className="stat-card warning"><div className="stat-number">{stats.enAttente}</div><div className="stat-label">En attente</div></div>
          <div className="stat-card success"><div className="stat-number">{stats.livrees}</div><div className="stat-label">Livrées</div></div>
          <div className="stat-card primary"><div className="stat-number">{stats.totalMontant.toLocaleString()} TND</div><div className="stat-label">Montant total</div></div>
        </div>

        <div className="header-buttons">
          <button className="btn-excel" onClick={exportExcel} disabled={loading}>📊 Excel</button>
          <button className="btn-pdf" onClick={exportPDF} disabled={loading}>📄 PDF</button>
          {(isCommercial || isAdmin) && (
            <button className="btn-nouveau" onClick={() => { resetForm(); setShowModal(true); }}>
              + Nouvelle Vente
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
          <button className={`filter-btn ${selectedStatut === 'En livraison' ? 'active' : ''}`} onClick={() => setSelectedStatut('En livraison')}>🚚 En livraison</button>
          <button className={`filter-btn ${selectedStatut === 'Livrée' ? 'active' : ''}`} onClick={() => setSelectedStatut('Livrée')}>📦 Livrée</button>
        </div>
      </div>

      {/* Tableau */}
      <div className="vente-table-wrapper">
        {loading ? (
          <div className="loading-block"><div className="spinner"></div><p>Chargement...</p></div>
        ) : filteredVentes.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">🏭</div><h4>Aucune vente locale</h4></div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>N° Vente</th>
                <th>Client</th>
                <th>Produit</th>
                <th>Quantité</th>
                <th>Montant</th>
                <th>Statut</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVentes.map(vente => (
                <tr key={vente._id}>
                  <td><strong>{vente.numeroVente}</strong></td>
                  <td>{vente.client?.raisonSociale || `${vente.client?.nom || ''} ${vente.client?.prenom || ''}`}</td>
                  <td>{vente.produit?.nom} ({vente.produit?.uniteMesure || 'm³'})</td>
                  <td>{vente.quantite?.toLocaleString()}</td>
                  <td className="montant">{vente.montantTotal?.toLocaleString()} {vente.devise}</td>
                  <td><span className={`status-badge ${getStatutClass(vente.statut)}`}>{vente.statut}</span></td>
                  <td>{new Date(vente.dateVente).toLocaleDateString()}</td>
                  <td className="actions-cell">
                    {(isCommercial || isAdmin) && vente.statut !== 'Facturée' && vente.statut !== 'Livrée' && (
                      <button className="btn-edit" onClick={() => handleEdit(vente)}>✏️</button>
                    )}
                    {vente.statut === 'En attente' && (isCommercial || isAdmin) && (
                      <button className="btn-validate" onClick={() => updateStatut(vente._id, 'Validée')}>✅</button>
                    )}
                    {vente.statut === 'Validée' && (isCommercial || isAdmin) && (
                      <button className="btn-shipping" onClick={() => updateStatut(vente._id, 'En livraison')}>🚚</button>
                    )}
                    {vente.statut === 'En livraison' && (isCommercial || isAdmin) && (
                      <button className="btn-delivered" onClick={() => updateStatut(vente._id, 'Livrée')}>📦</button>
                    )}
                    {isAdmin && vente.statut !== 'Facturée' && (
                      <button className="btn-delete" onClick={() => handleDelete(vente._id, vente.numeroVente)}>🗑️</button>
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
              <h3>{editingId ? 'Modifier la vente' : 'Nouvelle vente de gaz naturel'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Client *</label>
                <select value={form.client} onChange={e => setForm({...form, client: e.target.value})}>
                  <option value="">-- Choisir un client --</option>
                  {clients.map(c => <option key={c._id} value={c._id}>{c.raisonSociale || `${c.nom} ${c.prenom}`}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Produit (Gaz Naturel) *</label>
                <select value={form.produit} onChange={e => setForm({...form, produit: e.target.value})}>
                  <option value="">-- Choisir un produit --</option>
                  {produits.map(p => <option key={p._id} value={p._id}>{p.nom} - {p.prixUnitaire} TND/{p.uniteMesure || 'm³'}</option>)}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Quantité (m³) *</label>
                  <input type="number" placeholder="Quantité" value={form.quantite} onChange={e => setForm({...form, quantite: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Prix Unitaire (TND/m³) *</label>
                  <input type="number" placeholder="Prix unitaire" value={form.prixUnitaire} onChange={e => setForm({...form, prixUnitaire: e.target.value})} />
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

export default VenteLocale;