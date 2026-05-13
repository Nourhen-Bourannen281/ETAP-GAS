// src/screens/fournisseur/FournisseurDashboard.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
  FlatList,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

export default function FournisseurDashboard({ navigation }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('products'); // products, stocks, commandes
  
  // Données
  const [products, setProducts] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [commandes, setCommandes] = useState([]);
  
  // Modals
  const [showProductModal, setShowProductModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [stockQuantity, setStockQuantity] = useState('');
  const [seuilMin, setSeuilMin] = useState('');
  
  // Form produit
  const [newProduct, setNewProduct] = useState({
    nom: '',
    description: '',
    prixUnitaire: '',
    uniteMesure: 'Litre',
    typeProduit: 'Gaz',
  });

  const IP = '192.168.1.114';
  const API_URL = `http://${IP}:5000/api`;

  useEffect(() => {
    loadUserData();
    fetchProducts();
    fetchStocks();
    fetchCommandes();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_URL}/products`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(response.data);
    } catch (error) {
      console.error('Erreur produits:', error);
    }
  };

  const fetchStocks = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_URL}/stock`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStocks(response.data);
    } catch (error) {
      console.error('Erreur stocks:', error);
    }
  };

  const fetchCommandes = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_URL}/commandes/fournisseur`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCommandes(response.data);
    } catch (error) {
      console.error('Erreur commandes:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const createProduct = async () => {
    if (!newProduct.nom || !newProduct.prixUnitaire) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      await axios.post(`${API_URL}/products`, newProduct, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Alert.alert('Succès', 'Produit créé avec succès');
      setShowProductModal(false);
      setNewProduct({ nom: '', description: '', prixUnitaire: '', uniteMesure: 'Litre', typeProduit: 'Gaz' });
      fetchProducts();
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors de la création du produit');
    }
  };

  const updateStock = async (productId) => {
    if (!stockQuantity || !seuilMin) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      await axios.post(`${API_URL}/stock`, 
        { productId, quantity: parseInt(stockQuantity), seuilMin: parseInt(seuilMin) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Succès', 'Stock mis à jour');
      setShowStockModal(false);
      setStockQuantity('');
      setSeuilMin('');
      setSelectedProduct(null);
      fetchStocks();
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors de la mise à jour du stock');
    }
  };

  const updateCommandeStatus = async (commandeId, status) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.patch(`${API_URL}/commandes/${commandeId}/status`, 
        { statut: status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Succès', `Commande ${status === 'Validée' ? 'validée' : 'refusée'}`);
      fetchCommandes();
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors de la mise à jour');
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Déconnexion',
      'Voulez-vous vraiment vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnecter',
          onPress: async () => {
            await AsyncStorage.clear();
            navigation.replace('Landing');
          },
        },
      ]
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
    fetchStocks();
    fetchCommandes();
  };

  const getStockForProduct = (productId) => {
    const stock = stocks.find(s => {
      const pid = s.product?._id || s.product;
      return pid === productId;
    });
    return stock || { quantity: 0, seuilMin: 10 };
  };

  const getStatutColor = (statut) => {
    switch(statut) {
      case 'En attente': return '#fef3c7';
      case 'Validée': return '#dcfce7';
      case 'Refusée': return '#fee2e2';
      case 'Livrée': return '#dbeafe';
      default: return '#f3f4f6';
    }
  };

  const stats = {
    totalProducts: products.length,
    totalStocks: stocks.reduce((sum, s) => sum + (s.quantity || 0), 0),
    commandesEnAttente: commandes.filter(c => c.statut === 'En attente').length,
    commandesValidees: commandes.filter(c => c.statut === 'Validée').length,
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Chargement...</Text>
      </View>
    );
  }

  const renderProductCard = ({ item: product }) => {
    const stock = getStockForProduct(product._id);
    const isLowStock = stock.quantity < stock.seuilMin && stock.quantity > 0;
    const isOutOfStock = stock.quantity === 0;

    return (
      <View style={styles.productCard}>
        <View style={styles.productHeader}>
          <Text style={styles.productName}>{product.nom}</Text>
          <Text style={styles.productPrice}>{product.prixUnitaire.toLocaleString()} TND</Text>
        </View>
        <Text style={styles.productDesc}>{product.description || 'Aucune description'}</Text>
        <View style={styles.stockInfo}>
          <Text style={[styles.stockQuantity, isLowStock && styles.lowStock, isOutOfStock && styles.outOfStock]}>
            Stock: {stock.quantity} {product.uniteMesure || 'L'}
          </Text>
          {isLowStock && <Text style={styles.stockWarning}>⚠️ Stock faible</Text>}
          {isOutOfStock && <Text style={styles.stockWarning}>❌ Rupture de stock</Text>}
        </View>
        <TouchableOpacity 
          style={styles.updateStockButton} 
          onPress={() => {
            setSelectedProduct(product);
            setStockQuantity(stock.quantity.toString());
            setSeuilMin(stock.seuilMin.toString());
            setShowStockModal(true);
          }}
        >
          <Text style={styles.updateStockText}>📦 Mettre à jour le stock</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderStockCard = ({ item: stockItem }) => {
    const product = products.find(p => p._id === (stockItem.product?._id || stockItem.product));
    if (!product) return null;
    
    const isLowStock = stockItem.quantity < stockItem.seuilMin && stockItem.quantity > 0;
    const isOutOfStock = stockItem.quantity === 0;

    return (
      <View style={styles.stockCard}>
        <View style={styles.stockHeader}>
          <Text style={styles.stockProductName}>{product.nom}</Text>
          <View style={[styles.stockStatus, isLowStock && styles.warningStatus, isOutOfStock && styles.dangerStatus]}>
            <Text style={styles.stockStatusText}>
              {isOutOfStock ? 'Rupture' : isLowStock ? 'Stock faible' : 'Normal'}
            </Text>
          </View>
        </View>
        <View style={styles.stockDetails}>
          <Text>Quantité: <Text style={styles.stockValue}>{stockItem.quantity}</Text> {product.uniteMesure || 'L'}</Text>
          <Text>Seuil minimum: <Text style={styles.stockValue}>{stockItem.seuilMin}</Text> {product.uniteMesure || 'L'}</Text>
        </View>
        <View style={styles.stockProgressBar}>
          <View style={[styles.stockProgress, { width: `${Math.min((stockItem.quantity / (stockItem.seuilMin * 2)) * 100, 100)}%`, backgroundColor: isLowStock ? '#f59e0b' : '#10b981' }]} />
        </View>
        <TouchableOpacity 
          style={styles.updateButton}
          onPress={() => {
            setSelectedProduct(product);
            setStockQuantity(stockItem.quantity.toString());
            setSeuilMin(stockItem.seuilMin.toString());
            setShowStockModal(true);
          }}
        >
          <Text style={styles.updateButtonText}>Mettre à jour</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderCommandeCard = ({ item: commande }) => (
    <View style={styles.commandeCard}>
      <View style={styles.commandeHeader}>
        <Text style={styles.commandeNumber}>{commande.numeroCommande}</Text>
        <View style={[styles.commandeStatus, { backgroundColor: getStatutColor(commande.statut) }]}>
          <Text style={styles.commandeStatusText}>{commande.statut}</Text>
        </View>
      </View>
      <Text style={styles.commandeDate}>Date: {new Date(commande.dateCreation).toLocaleDateString()}</Text>
      <Text style={styles.commandeTotal}>Total: {commande.montantTotal?.toLocaleString()} TND</Text>
      
      {commande.produits && commande.produits.length > 0 && (
        <View style={styles.productsList}>
          <Text style={styles.productsTitle}>Produits commandés:</Text>
          {commande.produits.map((item, idx) => (
            <Text key={idx} style={styles.productItem}>
              • {item.sousProduit?.nom || 'Produit'} x {item.quantite} = {(item.quantite * item.prixUnitaire).toLocaleString()} TND
            </Text>
          ))}
        </View>
      )}
      
      {commande.statut === 'En attente' && (
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.validateButton]}
            onPress={() => updateCommandeStatus(commande._id, 'Validée')}
          >
            <Text style={styles.actionButtonText}>✅ Valider</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => updateCommandeStatus(commande._id, 'Refusée')}
          >
            <Text style={styles.actionButtonText}>❌ Refuser</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcome}>Dashboard Fournisseur</Text>
          <Text style={styles.userName}>{user?.prenom} {user?.nom}</Text>
          <Text style={styles.userRole}>🏭 {user?.role}</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Déconnexion</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.totalProducts}</Text>
          <Text style={styles.statLabel}>Produits</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.totalStocks}</Text>
          <Text style={styles.statLabel}>Stock total (L)</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.commandesEnAttente}</Text>
          <Text style={styles.statLabel}>Commandes en attente</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'products' && styles.tabActive]} 
          onPress={() => setActiveTab('products')}
        >
          <Text style={styles.tabText}>🛍️ Produits</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'stocks' && styles.tabActive]} 
          onPress={() => setActiveTab('stocks')}
        >
          <Text style={styles.tabText}>📊 Stocks</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'commandes' && styles.tabActive]} 
          onPress={() => setActiveTab('commandes')}
        >
          <Text style={styles.tabText}>📦 Commandes</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'products' && (
        <View style={styles.tabContent}>
          <TouchableOpacity style={styles.addButton} onPress={() => setShowProductModal(true)}>
            <Text style={styles.addButtonText}>+ Nouveau produit</Text>
          </TouchableOpacity>
          
          {products.length === 0 ? (
            <Text style={styles.emptyText}>Aucun produit</Text>
          ) : (
            <FlatList
              data={products}
              keyExtractor={(item) => item._id}
              renderItem={renderProductCard}
              scrollEnabled={false}
            />
          )}
        </View>
      )}

      {activeTab === 'stocks' && (
        <View style={styles.tabContent}>
          {stocks.length === 0 ? (
            <Text style={styles.emptyText}>Aucun stock</Text>
          ) : (
            <FlatList
              data={stocks}
              keyExtractor={(item) => item._id}
              renderItem={renderStockCard}
              scrollEnabled={false}
            />
          )}
        </View>
      )}

      {activeTab === 'commandes' && (
        <View style={styles.tabContent}>
          {commandes.length === 0 ? (
            <Text style={styles.emptyText}>Aucune commande</Text>
          ) : (
            <FlatList
              data={commandes}
              keyExtractor={(item) => item._id}
              renderItem={renderCommandeCard}
              scrollEnabled={false}
            />
          )}
        </View>
      )}

      {/* Modal Création Produit */}
      <Modal visible={showProductModal} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nouveau produit</Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Nom du produit"
              value={newProduct.nom}
              onChangeText={(text) => setNewProduct({...newProduct, nom: text})}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Description"
              value={newProduct.description}
              onChangeText={(text) => setNewProduct({...newProduct, description: text})}
              multiline
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Prix unitaire (TND)"
              value={newProduct.prixUnitaire}
              onChangeText={(text) => setNewProduct({...newProduct, prixUnitaire: text})}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Unité de mesure (Litre, KG, etc.)"
              value={newProduct.uniteMesure}
              onChangeText={(text) => setNewProduct({...newProduct, uniteMesure: text})}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelModalButton} onPress={() => setShowProductModal(false)}>
                <Text style={styles.cancelModalText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmModalButton} onPress={createProduct}>
                <Text style={styles.confirmModalText}>Créer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Mise à jour Stock */}
      <Modal visible={showStockModal} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Mettre à jour le stock</Text>
            <Text style={styles.modalSubtitle}>{selectedProduct?.nom}</Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Quantité en stock"
              value={stockQuantity}
              onChangeText={setStockQuantity}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Seuil minimum d'alerte"
              value={seuilMin}
              onChangeText={setSeuilMin}
              keyboardType="numeric"
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelModalButton} onPress={() => setShowStockModal(false)}>
                <Text style={styles.cancelModalText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmModalButton} onPress={() => updateStock(selectedProduct?._id)}>
                <Text style={styles.confirmModalText}>Mettre à jour</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  // Header
  header: {
    backgroundColor: '#1e3a8a',
    padding: 24,
    paddingTop: 60,
    paddingBottom: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcome: { color: 'rgba(255,255,255,0.7)', fontSize: 14 },
  userName: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  userRole: { color: '#38bdf8', fontSize: 12, marginTop: 4 },
  logoutButton: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  logoutText: { color: '#fff', fontSize: 14 },
  
  // Stats
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, marginTop: -20 },
  statCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center', flex: 1, marginHorizontal: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#1e3a8a' },
  statLabel: { fontSize: 12, color: '#64748b', marginTop: 4 },
  
  // Tabs
  tabs: { flexDirection: 'row', backgroundColor: '#fff', padding: 10, marginHorizontal: 16, borderRadius: 12, marginTop: 16 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: '#1e3a8a' },
  tabText: { fontSize: 14, fontWeight: '500' },
  tabContent: { padding: 16 },
  
  // Products
  addButton: { backgroundColor: '#1e3a8a', paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginBottom: 16 },
  addButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  productCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  productHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  productName: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
  productPrice: { fontSize: 14, fontWeight: 'bold', color: '#1e3a8a' },
  productDesc: { fontSize: 12, color: '#64748b', marginBottom: 8 },
  stockInfo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  stockQuantity: { fontSize: 12, fontWeight: '500' },
  lowStock: { color: '#f59e0b' },
  outOfStock: { color: '#ef4444' },
  stockWarning: { fontSize: 11, color: '#f59e0b' },
  updateStockButton: { backgroundColor: '#e2e8f0', paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  updateStockText: { fontSize: 12, fontWeight: '500', color: '#1e3a8a' },
  
  // Stocks
  stockCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
  stockHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  stockProductName: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
  stockStatus: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  warningStatus: { backgroundColor: '#fef3c7' },
  dangerStatus: { backgroundColor: '#fee2e2' },
  stockStatusText: { fontSize: 10, fontWeight: '600' },
  stockDetails: { marginBottom: 12 },
  stockValue: { fontWeight: 'bold', color: '#1e3a8a' },
  stockProgressBar: { height: 8, backgroundColor: '#e2e8f0', borderRadius: 4, marginBottom: 12, overflow: 'hidden' },
  stockProgress: { height: '100%', borderRadius: 4 },
  updateButton: { backgroundColor: '#1e3a8a', paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  updateButtonText: { color: '#fff', fontSize: 12, fontWeight: '500' },
  
  // Commandes
  commandeCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
  commandeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  commandeNumber: { fontSize: 14, fontWeight: 'bold', color: '#1e3a8a' },
  commandeStatus: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  commandeStatusText: { fontSize: 10, fontWeight: '600' },
  commandeDate: { fontSize: 12, color: '#64748b', marginBottom: 4 },
  commandeTotal: { fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
  productsList: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  productsTitle: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
  productItem: { fontSize: 11, color: '#64748b', marginBottom: 2 },
  actionButtons: { flexDirection: 'row', marginTop: 12, gap: 10 },
  actionButton: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  validateButton: { backgroundColor: '#10b981' },
  rejectButton: { backgroundColor: '#ef4444' },
  actionButtonText: { color: '#fff', fontWeight: '600', fontSize: 12 },
  
  // Modal
  modalContainer: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 20, padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  modalSubtitle: { fontSize: 14, color: '#64748b', marginBottom: 16, textAlign: 'center' },
  modalInput: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 14 },
  modalButtons: { flexDirection: 'row', marginTop: 16, gap: 12 },
  cancelModalButton: { flex: 1, paddingVertical: 12, backgroundColor: '#e2e8f0', borderRadius: 8, alignItems: 'center' },
  cancelModalText: { color: '#64748b', fontWeight: '600' },
  confirmModalButton: { flex: 1, paddingVertical: 12, backgroundColor: '#1e3a8a', borderRadius: 8, alignItems: 'center' },
  confirmModalText: { color: '#fff', fontWeight: '600' },
  
  emptyText: { textAlign: 'center', color: '#64748b', marginTop: 40 },
});