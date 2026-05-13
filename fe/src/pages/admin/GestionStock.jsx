import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../css/GestionStock.css';

function GestionStock() {
  const [data, setData] = useState([]);
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statutFilter, setStatutFilter] = useState('all'); // 🆕 Filtre par statut
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);

  const [form, setForm] = useState({
    product: '',
    quantity: '',
    seuilMin: 10,
    alerteActive: true
  });

  const [alertes, setAlertes] = useState([]);

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'Admin';
  const isFournisseur = user.role === 'Fournisseur';

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
      const res = await api.get('/stock');
      setData(res.data);
      const stocksBas = res.data.filter(item => item.quantity < item.seuilMin && item.quantity > 0);
      setAlertes(stocksBas);
    } catch (error) {
      console.error('Erreur chargement stock:', error);
      addToast('Erreur lors du chargement du stock', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products');
      setProducts(res.data);
    } catch (error) {
      console.error('Erreur chargement produits:', error);
      addToast('Erreur lors du chargement des produits', 'error');
    }
  };

  useEffect(() => {
    fetchData();
    fetchProducts();
  }, []);

  const hasStock = (productId) => {
    return data.some(item => {
      const itemProductId = item.product?._id || item.product;
      return itemProductId === productId;
    });
  };

  const filteredProducts = products.filter(p =>
    p.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.typeProduit?.nom?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = async () => {
    try {
      if (!form.product && !editingId) {
        addToast('Veuillez sélectionner un produit', 'error');
        return;
      }
      if (!form.quantity || form.quantity <= 0) {
        addToast('Veuillez entrer une quantité valide', 'error');
        return;
      }

      setLoading(true);

      const payload = {
        quantity: parseInt(form.quantity),
        seuilMin: parseInt(form.seuilMin),
        alerteActive: form.alerteActive
      };

      if (editingId) {
        if (!isAdmin) {
          addToast('Vous n\'avez pas les droits pour modifier', 'error');
          return;
        }
        await api.put(`/stock/${editingId}`, payload);
        addToast('Stock modifié avec succès', 'success');
      } else {
        if (!isFournisseur) {
          addToast('Vous n\'avez pas les droits pour ajouter au stock', 'error');
          return;
        }
        await api.post('/stock', { ...payload, product: form.product });
        addToast('Stock ajouté avec succès', 'success');
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
      product: '',
      quantity: '',
      seuilMin: 10,
      alerteActive: true
    });
    setSearchTerm('');
  };

  const handleEdit = (item) => {
    if (!isAdmin) {
      addToast('Vous n\'avez pas les droits pour modifier', 'error');
      return;
    }
    setEditingId(item._id);
    setForm({
      product: item.product?._id || item.product,
      quantity: item.quantity,
      seuilMin: item.seuilMin,
      alerteActive: item.alerteActive
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!isAdmin) {
      addToast('Vous n\'avez pas les droits pour supprimer', 'error');
      return;
    }
    
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette entrée de stock ?')) {
      try {
        setLoading(true);
        await api.delete(`/stock/${id}`);
        addToast('Stock supprimé avec succès', 'success');
        fetchData();
      } catch (error) {
        console.error('Erreur suppression:', error);
        addToast('Erreur lors de la suppression', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleUpdateQuantity = async (id, newQuantity) => {
    if (!isAdmin) {
      addToast('Vous n\'avez pas les droits pour modifier la quantité', 'error');
      return;
    }
    
    if (newQuantity < 0) {
      addToast('La quantité ne peut pas être négative', 'error');
      return;
    }
    
    try {
      setLoading(true);
      await api.put(`/stock/${id}/quantity`, { 
        quantity: parseInt(newQuantity),
        operation: 'set'
      });
      addToast('Quantité mise à jour', 'success');
      fetchData();
    } catch (error) {
      console.error('Erreur mise à jour quantité:', error);
      addToast('Erreur lors de la mise à jour', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getSelectedProductName = () => {
    const selected = products.find(p => p._id === form.product);
    if (selected) {
      return `${selected.nom} (${selected.typeProduit?.nom || 'Sans catégorie'}) - ${selected.uniteMesure}`;
    }
    return '';
  };

  const getStockStatusText = (quantity, seuilMin) => {
    if (quantity <= 0) return 'Rupture';
    if (quantity < seuilMin) return 'Stock bas';
    return 'Stock OK';
  };

  const getStockStatusColor = (quantity, seuilMin) => {
    if (quantity <= 0) return '#dc3545';
    if (quantity < seuilMin) return '#ffc107';
    return '#28a745';
  };

  // Statistiques
  const totalProducts = data.length;
  const lowStockCount = data.filter(item => item.quantity > 0 && item.quantity < item.seuilMin).length;
  const outOfStockCount = data.filter(item => item.quantity <= 0).length;
  const normalStockCount = data.filter(item => item.quantity >= item.seuilMin && item.quantity > 0).length;

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
          <h2>Gestion du Stock</h2>
          <p>Suivez et gérez votre inventaire en temps réel</p>
        </div>
        
        {/* Statistiques */}
        <div className="stock-stats">
          <div className="stat-card">
            <div className="stat-number">{totalProducts}</div>
            <div className="stat-label">Total Produits</div>
          </div>
          <div className="stat-card success">
            <div className="stat-number">{normalStockCount}</div>
            <div className="stat-label">Stock OK</div>
          </div>
          <div className="stat-card warning">
            <div className="stat-number">{lowStockCount}</div>
            <div className="stat-label">Stock faible</div>
          </div>
          <div className="stat-card danger">
            <div className="stat-number">{outOfStockCount}</div>
            <div className="stat-label">Rupture</div>
          </div>
        </div>

        {isFournisseur && (
          <button 
            className="btn-nouveau"
            onClick={() => {
              setEditingId(null);
              resetForm();
              setShowModal(true);
            }}
            disabled={loading}
          >
            <span>+</span> Ajouter au Stock
          </button>
        )}
      </div>

      {/* Alertes Stock Bas */}
      {alertes.length > 0 && (
        <div className="alerte-stock">
          <div className="alerte-header">
            <h3>⚠️ Alertes - Stock Bas ({alertes.length})</h3>
            <button onClick={() => setAlertes([])} className="close-alerts">×</button>
          </div>
          <div className="alertes-list">
            {alertes.map(alerte => (
              <div key={alerte._id} className="alerte-item">
                <div className="alerte-icon">⚠️</div>
                <div className="alerte-content">
                  <strong>{alerte.product?.nom}</strong> - Stock actuel : {alerte.quantity} {alerte.product?.uniteMesure} 
                  (Seuil minimum : {alerte.seuilMin})
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Barre de recherche et filtres */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="🔍 Rechercher un produit..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {/* 🆕 Filtres par statut */}
      <div className="stock-filters">
        <button 
          className={`filter-btn ${statutFilter === 'all' ? 'active' : ''}`}
          onClick={() => setStatutFilter('all')}
        >
          📦 Tous ({totalProducts})
        </button>
        <button 
          className={`filter-btn success ${statutFilter === 'normal' ? 'active' : ''}`}
          onClick={() => setStatutFilter('normal')}
        >
          ✅ Stock OK ({normalStockCount})
        </button>
        <button 
          className={`filter-btn warning ${statutFilter === 'low' ? 'active' : ''}`}
          onClick={() => setStatutFilter('low')}
        >
          ⚠️ Stock bas ({lowStockCount})
        </button>
        <button 
          className={`filter-btn danger ${statutFilter === 'out' ? 'active' : ''}`}
          onClick={() => setStatutFilter('out')}
        >
          ❌ Rupture ({outOfStockCount})
        </button>
      </div>

      {loading && !data.length ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Chargement du stock...</p>
        </div>
      ) : data.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📦</div>
          <h4>Aucun stock enregistré</h4>
          <p>Commencez par ajouter des produits au stock</p>
          {isFournisseur && (
            <button className="btn-add-first" onClick={() => setShowModal(true)}>
              + Ajouter votre premier stock
            </button>
          )}
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Produit</th>
                <th>Type</th>
                <th>Quantité</th>
                <th>Unité</th>
                <th>Seuil Minimum</th>
                <th>Statut</th>
                <th>Dernière mise à jour</th>
                {(isAdmin || isFournisseur) && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {data
                .filter(item => {
                  // Filtre par recherche
                  const matchSearch = 
                    item.product?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    item.product?.typeProduit?.nom?.toLowerCase().includes(searchTerm.toLowerCase());
                  
                  // 🆕 Filtre par statut
                  let matchStatut = true;
                  if (statutFilter === 'normal') {
                    matchStatut = item.quantity >= item.seuilMin && item.quantity > 0;
                  } else if (statutFilter === 'low') {
                    matchStatut = item.quantity > 0 && item.quantity < item.seuilMin;
                  } else if (statutFilter === 'out') {
                    matchStatut = item.quantity <= 0;
                  }
                  
                  return matchSearch && matchStatut;
                })
                .map((item) => {
                  const isLowStock = item.quantity < item.seuilMin && item.quantity > 0;
                  const isOutOfStock = item.quantity <= 0;
                  return (
                    <tr key={item._id} className={isLowStock ? 'row-low-stock' : (isOutOfStock ? 'row-out-stock' : '')}>
                      <td>
                        <div className="product-name-cell">
                          <strong>{item.product?.nom || '-'}</strong>
                          {item.product?.code && (
                            <span className="product-code">{item.product.code}</span>
                          )}
                        </div>
                      </td>
                      <td>{item.product?.typeProduit?.nom || '-'}</td>
                      <td className="quantite-cell">
                        {isAdmin ? (
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleUpdateQuantity(item._id, parseInt(e.target.value) || 0)}
                            className="input-quantite"
                            disabled={loading}
                          />
                        ) : (
                          <span className={`quantity-value ${isOutOfStock ? 'out-of-stock' : ''}`}>
                            {item.quantity}
                          </span>
                        )}
                      </td>
                      <td>{item.product?.uniteMesure || '-'}</td>
                      <td className="text-center">{item.seuilMin}</td>
                      <td className="text-center">
                        <span 
                          className="stock-status-badge"
                          style={{ backgroundColor: getStockStatusColor(item.quantity, item.seuilMin) }}
                        >
                          {getStockStatusText(item.quantity, item.seuilMin)}
                        </span>
                      </td>
                      <td className="text-center">
                        {item.dateDerniereMiseAJour ? 
                          new Date(item.dateDerniereMiseAJour).toLocaleDateString() : 
                          '-'
                        }
                      </td>
                      {(isAdmin || isFournisseur) && (
                        <td className="actions">
                          {isAdmin && (
                            <>
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
                            </>
                          )}
                          {isFournisseur && !isAdmin && (
                            <span className="view-only-badge">Consultation seule</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {(isFournisseur || isAdmin) && showModal && (
        <div className="modal-overlay" onClick={() => !loading && setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingId ? 'Modifier le Stock' : 'Ajouter au Stock'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>

            <div className="modal-body">
              {editingId && !isAdmin && (
                <div className="error-message">
                  ⚠️ Vous n'avez pas les droits pour modifier le stock.
                </div>
              )}
              
              {!editingId && isFournisseur && (
                <>
                  <div className="form-group">
                    <label>Rechercher un produit</label>
                    <input
                      type="text"
                      placeholder="Nom du produit..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      autoFocus
                    />
                  </div>

                  <div className="form-group">
                    <label>Sélectionner un produit *</label>
                    <select
                      value={form.product}
                      onChange={(e) => setForm({ ...form, product: e.target.value })}
                    >
                      <option value="">-- Choisir un produit --</option>
                      {filteredProducts.map(p => {
                        const hasExisting = hasStock(p._id);
                        return (
                          <option 
                            key={p._id} 
                            value={p._id}
                            disabled={hasExisting}
                          >
                            {p.nom} - {p.typeProduit?.nom || 'Sans catégorie'} ({p.uniteMesure}) 
                            {hasExisting ? ' (Déjà en stock)' : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </>
              )}

              {editingId && isAdmin && (
                <div className="info-produit">
                  <label>Produit</label>
                  <div className="info-value">{getSelectedProductName()}</div>
                </div>
              )}

              {((!editingId && isFournisseur) || (editingId && isAdmin)) && (
                <>
                  <div className="form-group">
                    <label>Quantité *</label>
                    <input
                      type="number"
                      value={form.quantity}
                      onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                      placeholder="Quantité en stock"
                      min="0"
                      step="1"
                    />
                  </div>

                  <div className="form-group">
                    <label>Seuil Minimum d'alerte</label>
                    <input
                      type="number"
                      value={form.seuilMin}
                      onChange={(e) => setForm({ ...form, seuilMin: parseInt(e.target.value) || 0 })}
                      min="0"
                      step="1"
                    />
                    <small>Lorsque le stock sera inférieur à ce seuil, une alerte sera affichée</small>
                  </div>

                  <div className="form-group checkbox">
                    <label>
                      <input
                        type="checkbox"
                        checked={form.alerteActive}
                        onChange={(e) => setForm({ ...form, alerteActive: e.target.checked })}
                      />
                      Activer les alertes de stock bas
                    </label>
                  </div>
                </>
              )}
            </div>

            <div className="modal-buttons">
              <button 
                className="btn-cancel" 
                onClick={() => { setShowModal(false); resetForm(); }}
                disabled={loading}
              >
                Annuler
              </button>
              {((!editingId && isFournisseur) || (editingId && isAdmin)) && (
                <button 
                  className="btn-save" 
                  onClick={handleSave}
                  disabled={loading}
                >
                  {loading ? 'En cours...' : (editingId ? 'Mettre à jour' : 'Ajouter au stock')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GestionStock;