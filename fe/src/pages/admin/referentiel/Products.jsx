import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../../css/Ref.css';

function Products() {
  const [products, setProducts] = useState([]);
  const [sousProduits, setSousProduits] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ 
    code: '', 
    nom: '', 
    prixUnitaire: '', 
    abreviation: '', 
    qualite: '', 
    description: '', 
    uniteMesure: 'Litre',
    sousProduit: '',
    seuilMin: 10,
    stock: 0 
  });
  const [confirmDialog, setConfirmDialog] = useState({ show: false, productId: null });

  const token = localStorage.getItem('token');
  const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: { Authorization: `Bearer ${token}` },
  });

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products');
      setProducts(res.data);
    } catch (error) {
      console.error('Erreur chargement produits:', error);
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
    fetchProducts(); 
    fetchSousProduits();
  }, []);

  const handleSave = async () => {
    try {
      if (!form.nom) {
        alert('Le nom du produit est requis');
        return;
      }
      if (!form.prixUnitaire || form.prixUnitaire <= 0) {
        alert('Le prix unitaire doit être supérieur à 0');
        return;
      }
      if (!form.sousProduit) {
        alert('Veuillez sélectionner un sous-produit');
        return;
      }

      const productData = {
        code: form.code,
        nom: form.nom,
        abreviation: form.abreviation,
        qualite: form.qualite,
        description: form.description,
        uniteMesure: form.uniteMesure,
        sousProduit: form.sousProduit,
        seuilMin: Number(form.seuilMin) || 10,
        prixUnitaire: Number(form.prixUnitaire),
        stock: Number(form.stock) || 0
      };

      if (editing) {
        await api.put(`/products/${editing._id}`, productData);
        alert('Produit modifié avec succès');
      } else {
        await api.post('/products', productData);
        alert('Produit créé avec succès');
      }
      setShowModal(false);
      resetForm();
      fetchProducts();
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      alert('Erreur lors de la sauvegarde');
    }
  };

  const resetForm = () => {
    setForm({ 
      code: '', 
      nom: '', 
      prixUnitaire: '', 
      abreviation: '', 
      qualite: '', 
      description: '', 
      uniteMesure: 'Litre',
      sousProduit: '',
      seuilMin: 10,
      stock: 0 
    });
    setEditing(null);
  };

  const handleEdit = (product) => {
    setEditing(product);
    setForm({ 
      code: product.code || '', 
      nom: product.nom || '', 
      prixUnitaire: product.prixUnitaire || '', 
      abreviation: product.abreviation || '', 
      qualite: product.qualite || '', 
      description: product.description || '', 
      uniteMesure: product.uniteMesure || 'Litre',
      sousProduit: product.sousProduit?._id || product.sousProduit || '',
      seuilMin: product.seuilMin || 10,
      stock: Number(product.stock) || 0
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/products/${id}`);
      alert('Produit supprimé avec succès');
      fetchProducts();
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('Erreur lors de la suppression');
    }
    setConfirmDialog({ show: false, productId: null });
  };

  const getSousProduitNom = (sousProduitId) => {
    const sp = sousProduits.find(s => s._id === sousProduitId);
    return sp ? sp.nom : '-';
  };

  const totalProducts = products.length;
  const lowStockCount = products.filter(p => {
    const stock = Number(p.stock);
    return !isNaN(stock) && stock > 0 && stock < 10;
  }).length;
  const outOfStockCount = products.filter(p => {
    const stock = Number(p.stock);
    return isNaN(stock) || stock <= 0;
  }).length;

  return (
    <main className="page-products">
      {/* Header avec stats */}
      <div className="page-header">
        <div className="page-header-content">
          <h1>Gestion des Produits</h1>
          <p className="page-subtitle">Catalogue complet avec suivi des stocks</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="page-actions">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">{totalProducts}</div>
            <div className="stat-label">Total Produits</div>
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
        
        <button className="btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
          + Nouveau Produit
        </button>
      </div>

      {/* Tableau */}
      <div className="table-container">
        <div className="table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Code</th>
                <th>Prix (TND)</th>
                <th>Unité</th>
                <th>Sous-produit</th>
                <th>Stock</th>
                <th>Seuil Min</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product._id}>
                  <td className="cell-text">
                    <strong>{product.nom}</strong>
                    {product.abreviation && (
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        {product.abreviation}
                      </div>
                    )}
                  </td>
                  <td className="cell-code">
                    <strong>{product.code || '-'}</strong>
                  </td>
                  <td>
                    <div className="price-cell">
                      {Number(product.prixUnitaire).toLocaleString()} TND
                    </div>
                  </td>
                  <td>{product.uniteMesure || 'Litre'}</td>
                  <td className="cell-text">{getSousProduitNom(product.sousProduit)}</td>
                  <td>
                    <span className={`stock-badge stock-${product.stock <= 0 ? 'out' : product.stock < 10 ? 'low' : 'ok'}`}>
                      {product.stock || 0}
                    </span>
                  </td>
                  <td>{product.seuilMin || 10}</td>
                  <td className="cell-actions">
                    <button className="btn-edit" onClick={() => handleEdit(product)} title="Modifier">
                      ✏️
                    </button>
                    <button 
                      className="btn-delete" 
                      onClick={() => setConfirmDialog({ show: true, productId: product._id })}
                      title="Supprimer"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {products.length === 0 && (
            <div className="empty-state">
              <p>Aucun produit enregistré</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? 'Modifier Produit' : 'Nouveau Produit'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>Code produit</label>
                <input
                  placeholder="Ex: PRD-001"
                  value={form.code}
                  onChange={e => setForm({ ...form, code: e.target.value })}
                />
              </div>
              
              <div className="form-group">
                <label>Nom *</label>
                <input
                  placeholder="Nom du produit"
                  value={form.nom}
                  onChange={e => setForm({ ...form, nom: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Sous-produit *</label>
                <select
                  value={form.sousProduit}
                  onChange={e => setForm({ ...form, sousProduit: e.target.value })}
                >
                  <option value="">Sélectionner...</option>
                  {sousProduits.map(sp => (
                    <option key={sp._id} value={sp._id}>
                      {sp.nom}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Prix unitaire (TND) *</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={form.prixUnitaire}
                  onChange={e => setForm({ ...form, prixUnitaire: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Unité de mesure</label>
                <select
                  value={form.uniteMesure}
                  onChange={e => setForm({ ...form, uniteMesure: e.target.value })}
                >
                  <option value="Litre">Litre</option>
                  <option value="KG">KG</option>
                  <option value="Tonne">Tonne</option>
                  <option value="Unité">Unité</option>
                </select>
              </div>

              <div className="form-group">
                <label>Stock actuel</label>
                <input
                  type="number"
                  placeholder="0"
                  value={form.stock}
                  onChange={e => setForm({ ...form, stock: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="form-group">
                <label>Seuil minimum</label>
                <input
                  type="number"
                  placeholder="10"
                  value={form.seuilMin}
                  onChange={e => setForm({ ...form, seuilMin: parseInt(e.target.value) || 10 })}
                />
              </div>

              <div className="form-group full-width">
                <label>Description</label>
                <textarea
                  placeholder="Description du produit"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  rows="3"
                />
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => { setShowModal(false); resetForm(); }}>
                Annuler
              </button>
              <button className="btn-primary" onClick={handleSave}>
                {editing ? 'Mettre à jour' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      {confirmDialog.show && (
        <div className="modal-overlay" onClick={() => setConfirmDialog({ show: false, productId: null })}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3>Confirmer suppression</h3>
              <button className="modal-close" onClick={() => setConfirmDialog({ show: false, productId: null })}>×</button>
            </div>
            <div className="form-grid">
              <p>Êtes-vous sûr de vouloir supprimer ce produit ? Cette action est irréversible.</p>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setConfirmDialog({ show: false, productId: null })}>
                Annuler
              </button>
              <button className="btn-delete danger-btn" onClick={() => handleDelete(confirmDialog.productId)}>
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default Products;