import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PaymentForm from './PaymentForm';
import '../../css/ClientDashboard.css';

function ClientDashboard() {
  const [products, setProducts] = useState([]);
  const [stockData, setStockData] = useState([]);
  const [cart, setCart] = useState([]);
  const [commandes, setCommandes] = useState([]);
  const [modesPaiement, setModesPaiement] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showCommandes, setShowCommandes] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

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

  useEffect(() => {
    fetchProducts();
    fetchStock();
    fetchCommandes();
    fetchModesPaiement();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products');
      setProducts(res.data);
    } catch (error) {
      console.error('Erreur chargement produits:', error);
      addToast('Erreur lors du chargement des produits', 'error');
    }
  };

  const fetchStock = async () => {
    try {
      const res = await api.get('/stock');
      setStockData(res.data);
    } catch (error) {
      console.error('Erreur chargement stock:', error);
      addToast('Erreur lors du chargement du stock', 'error');
    }
  };

  const fetchCommandes = async () => {
    try {
      const res = await api.get('/commandes/client');
      setCommandes(res.data);
    } catch (error) {
      console.error('Erreur chargement commandes:', error);
      addToast('Erreur lors du chargement des commandes', 'error');
    }
  };

  const fetchModesPaiement = async () => {
    try {
      const res = await api.get('/modes-paiement');
      console.log('Modes paiement reçus:', res.data);
      
      let activeModes = [];
      
      if (res.data && Array.isArray(res.data)) {
        activeModes = res.data;
        
        // Si le champ actif existe, filtrer
        if (res.data.length > 0 && res.data[0].hasOwnProperty('actif')) {
          activeModes = res.data.filter(mode => mode.actif === true);
        }
      }
      
      setModesPaiement(activeModes);
      console.log(`${activeModes.length} mode(s) de paiement chargé(s)`);
      
    } catch (error) {
      console.error('Erreur chargement modes paiement:', error);
      setModesPaiement([
        { _id: '1', nom: 'Carte bancaire', description: 'Paiement sécurisé par carte', actif: true },
        { _id: '2', nom: 'Virement', description: 'Virement bancaire', actif: true },
        { _id: '3', nom: 'Chèque', description: 'Chèque bancaire', actif: true },
        { _id: '4', nom: 'Espèces', description: 'Paiement en espèces', actif: true }
      ]);
      addToast('Utilisation des modes de paiement par défaut', 'info');
    }
  };

  const getStockQuantity = (product) => {
    const stockEntry = stockData.find(s => {
      const productId = s.product?._id || s.product;
      return productId === product._id;
    });
    
    if (stockEntry) {
      return stockEntry.quantity || 0;
    }
    
    if (product.stockActuel !== undefined) {
      return product.stockActuel;
    }
    
    return 0;
  };

  const getSeuilMin = (product) => {
    const stockEntry = stockData.find(s => {
      const productId = s.product?._id || s.product;
      return productId === product._id;
    });
    
    if (stockEntry) {
      return stockEntry.seuilMin || 10;
    }
    
    return product.stockMinimum || 10;
  };

  const getUniteMesure = (product) => {
    return product.uniteMesure || 'Litre';
  };

  const openQuantityModal = (product) => {
    const stockQuantity = getStockQuantity(product);
    if (stockQuantity === 0) {
      addToast(`${product.nom} est en rupture de stock`, 'error');
      return;
    }
    setSelectedProduct(product);
    setSelectedQuantity(1);
    setShowQuantityModal(true);
  };

  const addToCartWithQuantity = () => {
    if (!selectedProduct) return;
    
    const stockQuantity = getStockQuantity(selectedProduct);
    
    if (selectedQuantity <= 0) {
      addToast('La quantité doit être supérieure à 0', 'error');
      return;
    }
    
    if (selectedQuantity > stockQuantity) {
      addToast(`Stock insuffisant. Stock disponible: ${stockQuantity} ${getUniteMesure(selectedProduct)}`, 'error');
      return;
    }
    
    const existingItem = cart.find(item => item._id === selectedProduct._id);
    
    if (existingItem) {
      const newQuantity = existingItem.quantite + selectedQuantity;
      if (newQuantity > stockQuantity) {
        addToast(`Stock insuffisant. Stock disponible: ${stockQuantity} ${getUniteMesure(selectedProduct)}`, 'error');
        return;
      }
      setCart(cart.map(item =>
        item._id === selectedProduct._id
          ? { ...item, quantite: newQuantity }
          : item
      ));
    } else {
      setCart([...cart, { ...selectedProduct, quantite: selectedQuantity }]);
    }
    
    addToast(`${selectedQuantity} ${getUniteMesure(selectedProduct)} de ${selectedProduct.nom} ajouté au panier`, 'success');
    setShowQuantityModal(false);
    setSelectedProduct(null);
    setSelectedQuantity(1);
  };

  const updateQuantity = (productId, newQuantity) => {
    const product = products.find(p => p._id === productId);
    const stockQuantity = getStockQuantity(product);
    
    if (newQuantity > stockQuantity) {
      addToast(`Stock insuffisant. Stock disponible: ${stockQuantity} ${getUniteMesure(product)}`, 'error');
      return;
    }
    
    if (newQuantity <= 0) {
      setCart(cart.filter(item => item._id !== productId));
    } else {
      setCart(cart.map(item =>
        item._id === productId
          ? { ...item, quantite: newQuantity }
          : item
      ));
    }
  };

  const removeFromCart = (productId) => {
    const product = cart.find(item => item._id === productId);
    setCart(cart.filter(item => item._id !== productId));
    addToast(`${product?.nom} retiré du panier`, 'info');
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.prixUnitaire * item.quantite), 0);
  };

  const calculateTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantite, 0);
  };

  const openPaymentModal = () => {
    if (cart.length === 0) {
      addToast('Votre panier est vide', 'error');
      return;
    }
    if (modesPaiement.length === 0) {
      addToast('Aucun mode de paiement disponible', 'error');
      return;
    }
    setPaymentMethod('');
    setPaymentDetails(null);
    setShowPaymentModal(true);
  };

  const handlePaymentDetailsChange = (details) => {
    setPaymentDetails(details);
  };

  const createOrderWithPayment = async () => {
    if (!paymentMethod) {
      addToast('Veuillez choisir un mode de paiement', 'error');
      return;
    }

    setLoading(true);
    try {
      const totalAmount = calculateTotal();
      
      // Normaliser le nom pour l'affichage
      const displayName = {
        'cheque': 'Chèque',
        'espece': 'Espèces',
        'Carte Banquaire': 'Carte bancaire'
      }[paymentMethod] || paymentMethod;
      
      // Préparer les détails du paiement
      let paymentDetailsText = '';
      let reference = '';
      
      if (paymentDetails) {
        switch(paymentMethod) {
          case 'cheque':
          case 'Chèque':
            paymentDetailsText = `Chèque n°${paymentDetails.numeroCheque} - Banque: ${paymentDetails.banque} - Émis le: ${paymentDetails.dateEmission}`;
            reference = `CHQ-${paymentDetails.numeroCheque}`;
            break;
          case 'Carte Banquaire':
          case 'Carte bancaire':
            const maskedCard = paymentDetails.numeroCarte?.replace(/\s/g, '').slice(-4) || '';
            paymentDetailsText = `Carte bancaire **** **** **** ${maskedCard} - Exp: ${paymentDetails.dateExpiration}`;
            reference = `CARD-${maskedCard}`;
            break;
          case 'espece':
          case 'Espèces':
            paymentDetailsText = `Espèces - Montant reçu: ${paymentDetails.montantRecu} ${paymentDetails.monnaie} - Reçu par: ${paymentDetails.recoltePar}`;
            reference = `CASH-${Date.now()}`;
            break;
        }
      }
      
      const commandeData = {
        numeroCommande: 'CMD-' + Date.now(),
        produits: cart.map(item => ({
          sousProduit: item._id,
          quantite: item.quantite,
          prixUnitaire: item.prixUnitaire,
          uniteMesure: item.uniteMesure || 'Litre'
        })),
        montantTotal: totalAmount,
        statut: 'En attente de paiement',
        detailsPaiement: paymentDetailsText
      };
      
      const orderResponse = await api.post('/commandes', commandeData);
      const newOrder = orderResponse.data;
      
      const paymentData = {
        commande: newOrder._id,
        montant: totalAmount,
        modePaiement: displayName,
        client: user._id,
        clientNom: user.nom || user.email,
        devise: 'TND',
        reference: reference,
        description: paymentDetailsText
      };
      
      const paymentResponse = await api.post('/paiements', paymentData);
      
      await api.patch(`/commandes/${newOrder._id}`, {
        paiementId: paymentResponse.data._id,
        statut: 'En attente de validation'
      });
      
      addToast(`Commande créée avec succès ! Mode: ${displayName}`, 'success');
      
      // Réinitialiser
      setCart([]);
      setShowCart(false);
      setShowPaymentModal(false);
      setPaymentMethod('');
      setPaymentDetails(null);
      await fetchCommandes();
      
    } catch (error) {
      console.error('Erreur:', error.response?.data);
      const errorMessage = error.response?.data?.message || 'Erreur lors de la commande';
      addToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatutText = (statut) => {
    const statusMap = {
      'Attente': '⏳ En attente',
      'En attente de paiement': '⏳ En attente de paiement',
      'En attente de validation': '🔄 En attente de validation',
      'Validée': '✅ Validée',
      'Refusée': '❌ Refusée',
      'Livrée': '📦 Livrée',
      'Payée': '💰 Payée'
    };
    return statusMap[statut] || statut;
  };

  const getStatutIcon = (statut) => {
    const iconMap = {
      'Attente': '⏳',
      'En attente de paiement': '⏳',
      'En attente de validation': '🔄',
      'Validée': '✅',
      'Refusée': '❌',
      'Livrée': '📦',
      'Payée': '💰'
    };
    return iconMap[statut] || '📝';
  };

  const getStatutClass = (statut) => {
    const classMap = {
      'Attente': 'status-warning',
      'En attente de paiement': 'status-warning',
      'En attente de validation': 'status-info',
      'Validée': 'status-success',
      'Refusée': 'status-danger',
      'Livrée': 'status-success',
      'Payée': 'status-success'
    };
    return classMap[statut] || 'status-default';
  };

  const getStockStatus = (quantity, seuilMin) => {
    if (quantity <= 0) return { text: 'Rupture', class: 'out-of-stock', icon: '❌' };
    if (quantity < seuilMin) return { text: 'Stock faible', class: 'low-stock', icon: '⚠️' };
    return { text: 'En stock', class: 'in-stock', icon: '✓' };
  };

  const getPaymentIcon = (modeNom) => {
    const icons = {
      'Carte bancaire': '💳',
      'Carte Banquaire': '💳',
      'Virement': '🏦',
      'Chèque': '📝',
      'cheque': '📝',
      'Espèces': '💵',
      'espece': '💵',
      'PayPal': '💰',
      'Mobile Money': '📱'
    };
    return icons[modeNom] || '💰';
  };

  const filteredProducts = products.filter(product => {
    return product.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           product.description?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="client-dashboard">
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

      {showQuantityModal && selectedProduct && (
        <div className="modal-overlay" onClick={() => setShowQuantityModal(false)}>
          <div className="quantity-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Ajouter au panier</h3>
              <button className="modal-close" onClick={() => setShowQuantityModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="product-info-modal">
                <div className="product-name-modal">{selectedProduct.nom}</div>
                <div className="product-price-modal">
                  {selectedProduct.prixUnitaire.toLocaleString()} TND / {getUniteMesure(selectedProduct)}
                </div>
                <div className="product-stock-modal">
                  Stock disponible: <strong>{getStockQuantity(selectedProduct)} {getUniteMesure(selectedProduct)}</strong>
                </div>
              </div>
              
              <div className="quantity-selector">
                <label>Quantité ({getUniteMesure(selectedProduct)}) :</label>
                <div className="quantity-controls">
                  <button className="qty-btn" onClick={() => setSelectedQuantity(Math.max(1, selectedQuantity - 1))} disabled={selectedQuantity <= 1}>-</button>
                  <input type="number" value={selectedQuantity} onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val) && val >= 1) {
                      const maxStock = getStockQuantity(selectedProduct);
                      setSelectedQuantity(Math.min(val, maxStock));
                    }
                  }} min="1" max={getStockQuantity(selectedProduct)} className="quantity-input-modal" />
                  <button className="qty-btn" onClick={() => setSelectedQuantity(Math.min(getStockQuantity(selectedProduct), selectedQuantity + 1))} disabled={selectedQuantity >= getStockQuantity(selectedProduct)}>+</button>
                </div>
                <div className="total-price-modal">
                  Total: <strong>{(selectedProduct.prixUnitaire * selectedQuantity).toLocaleString()} TND</strong>
                </div>
              </div>
            </div>
            <div className="modal-buttons">
              <button className="btn-cancel" onClick={() => setShowQuantityModal(false)}>Annuler</button>
              <button className="btn-confirm" onClick={addToCartWithQuantity}>Ajouter au panier</button>
            </div>
          </div>
        </div>
      )}

      {showPaymentModal && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="payment-modal large-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Validation de la commande</h3>
              <button className="modal-close" onClick={() => setShowPaymentModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="order-summary">
                <h4>Récapitulatif de la commande</h4>
                <div className="summary-items">
                  {cart.map(item => (
                    <div key={item._id} className="summary-item">
                      <span>{item.nom} x {item.quantite} {getUniteMesure(item)}</span>
                      <span>{(item.prixUnitaire * item.quantite).toLocaleString()} TND</span>
                    </div>
                  ))}
                </div>
                <div className="summary-total">
                  <strong>Total à payer :</strong>
                  <strong className="total-amount">{calculateTotal().toLocaleString()} TND</strong>
                </div>
              </div>

              <div className="payment-methods">
                <h4>1. Choisissez votre mode de paiement</h4>
                <div className="payment-options">
                  {modesPaiement.length === 0 ? (
                    <div className="no-payment-methods">
                      <p>⚠️ Aucun mode de paiement disponible pour le moment.</p>
                      <small>Veuillez contacter l'administrateur.</small>
                    </div>
                  ) : (
                    modesPaiement.map(mode => (
                      <label key={mode._id || mode.nom} className="payment-option">
                        <input 
                          type="radio" 
                          name="paymentMethod" 
                          value={mode.nom} 
                          onChange={(e) => {
                            setPaymentMethod(e.target.value);
                            setPaymentDetails(null);
                          }} 
                          checked={paymentMethod === mode.nom} 
                        />
                        <span className="payment-icon">{getPaymentIcon(mode.nom)}</span>
                        <span className="payment-name">{mode.nom}</span>
                        {mode.description && <small className="payment-desc">{mode.description}</small>}
                      </label>
                    ))
                  )}
                </div>
              </div>

              {paymentMethod && (
                <div className="payment-details-section">
                  <h4>2. Informations de paiement</h4>
                  <PaymentForm 
                    paymentMethod={paymentMethod}
                    totalAmount={calculateTotal()}
                    user={user}
                    onPaymentDetailsChange={handlePaymentDetailsChange}
                  />
                </div>
              )}
            </div>
            <div className="modal-buttons">
              <button className="btn-cancel" onClick={() => {
                setShowPaymentModal(false);
                setPaymentMethod('');
                setPaymentDetails(null);
              }}>
                Annuler
              </button>
              <button 
                className="btn-confirm" 
                onClick={createOrderWithPayment} 
                disabled={loading || !paymentMethod}
              >
                {loading ? 'Traitement en cours...' : '💰 Valider la commande'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="dashboard-header">
        <div className="header-content">
          <h1>Bienvenue, {user.nom || 'Client'} !</h1>
          <p>Découvrez notre catalogue et passez vos commandes en toute simplicité</p>
        </div>
        <div className="cart-mini-badge" onClick={() => setShowCart(true)}>
          <span className="cart-icon">🛒</span>
          {cart.length > 0 && <span className="cart-count">{calculateTotalItems()}</span>}
        </div>
      </div>

      <div className="dashboard-nav">
        <button className={`nav-btn ${!showCart && !showCommandes ? 'active' : ''}`} onClick={() => { setShowCart(false); setShowCommandes(false); }}>
          <span className="nav-icon">🛍️</span> Catalogue
        </button>
        <button className={`nav-btn ${showCart ? 'active' : ''}`} onClick={() => { setShowCart(true); setShowCommandes(false); }}>
          <span className="nav-icon">🛒</span> Panier
          {cart.length > 0 && <span className="badge">{cart.length}</span>}
        </button>
        <button className={`nav-btn ${showCommandes ? 'active' : ''}`} onClick={() => { setShowCommandes(true); setShowCart(false); fetchCommandes(); }}>
          <span className="nav-icon">📦</span> Mes Commandes
        </button>
      </div>

      {!showCart && !showCommandes && (
        <div className="catalogue-section">
          <div className="filters-section">
            <div className="search-box">
              <input type="text" placeholder="🔍 Rechercher un produit..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="search-input" />
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🔍</div>
              <h4>Aucun produit trouvé</h4>
              <p>Essayez de modifier votre recherche</p>
            </div>
          ) : (
            <div className="products-grid">
              {filteredProducts.map(product => {
                const stockQuantity = getStockQuantity(product);
                const seuilMin = getSeuilMin(product);
                const stockStatus = getStockStatus(stockQuantity, seuilMin);
                const isOutOfStock = stockQuantity === 0;
                const uniteMesure = getUniteMesure(product);
                
                return (
                  <div key={product._id} className="product-card">
                    <div className="product-image">
                      <div className="product-icon">{product.nom?.charAt(0).toUpperCase()}</div>
                      {stockStatus.icon && <div className={`stock-badge ${stockStatus.class}`}>{stockStatus.icon} {stockStatus.text}</div>}
                    </div>
                    <div className="product-info">
                      <h3 className="product-name">{product.nom}</h3>
                      {product.code && <span className="product-code">{product.code}</span>}
                      <p className="product-type">{product.typeProduit?.nom || 'Sans catégorie'}</p>
                      {product.description && <p className="product-description">{product.description}</p>}
                      <div className="product-price">
                        <span className="price">{product.prixUnitaire.toLocaleString()} TND</span>
                        <span className="unit">/ {uniteMesure}</span>
                      </div>
                      <div className="product-stock">
                        <span className={`stock-quantity ${stockStatus.class}`}>Stock: {stockQuantity} {uniteMesure}</span>
                        {stockQuantity < seuilMin && stockQuantity > 0 && <span className="stock-warning">⚠️ Stock limité</span>}
                      </div>
                      <button className={`add-to-cart-btn ${isOutOfStock ? 'disabled' : ''}`} onClick={() => openQuantityModal(product)} disabled={isOutOfStock}>
                        {isOutOfStock ? '📦 Rupture de stock' : '🛒 Ajouter au panier'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {showCart && (
        <div className="cart-section">
          <div className="cart-header">
            <h2>Mon Panier</h2>
            <button className="close-cart" onClick={() => setShowCart(false)}>×</button>
          </div>
          
          {cart.length === 0 ? (
            <div className="empty-cart">
              <div className="empty-cart-icon">🛒</div>
              <h4>Votre panier est vide</h4>
              <p>Commencez à ajouter des produits depuis le catalogue</p>
              <button className="browse-btn" onClick={() => setShowCart(false)}>Parcourir les produits</button>
            </div>
          ) : (
            <>
              <div className="cart-items">
                <table className="cart-table">
                  <thead>
                    <tr>
                      <th>Produit</th>
                      <th>Prix unitaire</th>
                      <th>Quantité</th>
                      <th>Total</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map(item => {
                      const stockQuantity = getStockQuantity(item);
                      const uniteMesure = getUniteMesure(item);
                      return (
                        <tr key={item._id}>
                          <td className="product-cell">
                            <div className="product-mini-icon">{item.nom?.charAt(0).toUpperCase()}</div>
                            <div>
                              <div className="product-name-cart">{item.nom}</div>
                              <div className="product-unit">{uniteMesure}</div>
                            </div>
                          </td>
                          <td className="price-cell">{item.prixUnitaire.toLocaleString()} TND</td>
                          <td className="quantity-cell">
                            <input type="number" value={item.quantite} onChange={(e) => updateQuantity(item._id, parseInt(e.target.value) || 1)} min="1" max={stockQuantity} className="quantity-input" />
                            <div className="max-stock">Max: {stockQuantity} {uniteMesure}</div>
                          </td>
                          <td className="total-cell">{(item.prixUnitaire * item.quantite).toLocaleString()} TND</td>
                          <td className="action-cell">
                            <button onClick={() => removeFromCart(item._id)} className="remove-btn">🗑️</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="3" className="total-label">Total</td>
                      <td className="total-amount">{calculateTotal().toLocaleString()} TND</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <div className="cart-actions">
                <button className="continue-shopping" onClick={() => setShowCart(false)}>Continuer mes achats</button>
                <button className="validate-order" onClick={openPaymentModal} disabled={loading}>💳 Passer à la caisse</button>
              </div>
            </>
          )}
        </div>
      )}

      {showCommandes && (
        <div className="commandes-section">
          <div className="commandes-header">
            <h2>Mes Commandes</h2>
            <button className="refresh-btn" onClick={fetchCommandes}>🔄 Actualiser</button>
          </div>
          
          {commandes.length === 0 ? (
            <div className="empty-commandes">
              <div className="empty-icon">📦</div>
              <h4>Aucune commande</h4>
              <p>Vous n'avez pas encore passé de commande</p>
              <button className="browse-btn" onClick={() => setShowCommandes(false)}>Découvrir les produits</button>
            </div>
          ) : (
            <div className="commandes-list">
              {commandes.map(cmd => (
                <div key={cmd._id} className="commande-card">
                  <div className="commande-header">
                    <div>
                      <span className="commande-number">{cmd.numeroCommande}</span>
                      <span className="commande-date">{new Date(cmd.dateCreation).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </div>
                    <div className={`commande-status ${getStatutClass(cmd.statut)}`}>
                      {getStatutIcon(cmd.statut)} {getStatutText(cmd.statut)}
                    </div>
                  </div>
                  <div className="commande-produits">
                    <table className="produits-table">
                      <thead>
                        <tr>
                          <th>Produit</th>
                          <th>Quantité</th>
                          <th>Unité</th>
                          <th>Prix unitaire</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cmd.produits?.map((p, idx) => (
                          <tr key={idx}>
                            <td><strong>{p.sousProduit?.nom || 'Produit'}</strong></td>
                            <td>{p.quantite}</td>
                            <td>{p.uniteMesure || p.sousProduit?.uniteMesure || '-'}</td>
                            <td>{p.prixUnitaire?.toLocaleString()} TND</td>
                            <td>{(p.quantite * p.prixUnitaire).toLocaleString()} TND</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="commande-footer">
                    <div className="commande-total">
                      <span>Total :</span>
                      <strong>{cmd.montantTotal?.toLocaleString()} TND</strong>
                    </div>
                    {cmd.paiementId && (
                      <div className="commande-payment-status">
                        <span>💰</span>
                        <span>Paiement associé</span>
                      </div>
                    )}
                    {cmd.detailsPaiement && (
                      <div className="commande-payment-details">
                        <small>Détails: {cmd.detailsPaiement}</small>
                      </div>
                    )}
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

export default ClientDashboard;