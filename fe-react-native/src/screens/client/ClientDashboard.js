// src/screens/client/ClientDashboard.js
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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

export default function ClientDashboard({ navigation }) {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [commandes, setCommandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [showCommandes, setShowCommandes] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');

  const IP = '192.168.1.114';
  const API_URL = `http://${IP}:5000/api`;

  useEffect(() => {
    loadUserData();
    fetchProducts();
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

  const fetchCommandes = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_URL}/commandes/client`, {
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

  const addToCart = (product) => {
    const existingItem = cart.find(item => item._id === product._id);
    if (existingItem) {
      setCart(cart.map(item =>
        item._id === product._id
          ? { ...item, quantite: item.quantite + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantite: 1 }]);
    }
    Alert.alert('Succès', `${product.nom} ajouté au panier`);
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item._id !== productId));
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
    } else {
      setCart(cart.map(item =>
        item._id === productId ? { ...item, quantite: newQuantity } : item
      ));
    }
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.prixUnitaire * item.quantite), 0);
  };

  const calculateTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantite, 0);
  };

  const validateOrder = async () => {
    if (cart.length === 0) {
      Alert.alert('Erreur', 'Votre panier est vide');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      const commandeData = {
        numeroCommande: 'CMD-' + Date.now(),
        produits: cart.map(item => ({
          sousProduit: item._id,
          quantite: item.quantite,
          prixUnitaire: item.prixUnitaire,
        })),
        montantTotal: calculateTotal(),
        statut: 'En attente',
      };

      await axios.post(`${API_URL}/commandes`, commandeData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      Alert.alert('Succès', 'Commande créée avec succès !');
      setCart([]);
      setShowCart(false);
      fetchCommandes();
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors de la création de la commande');
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
    fetchCommandes();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Chargement...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.welcome}>Bienvenue,</Text>
          <Text style={styles.userName}>{user?.prenom} {user?.nom}</Text>
          <Text style={styles.userRole}>👤 {user?.role}</Text>
        </View>
        <TouchableOpacity style={styles.cartIcon} onPress={() => setShowCart(true)}>
          <Text style={styles.cartIconText}>🛒</Text>
          {cart.length > 0 && <View style={styles.cartBadge}><Text style={styles.cartBadgeText}>{calculateTotalItems()}</Text></View>}
        </TouchableOpacity>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Déconnexion</Text>
        </TouchableOpacity>
      </View>

      {/* Navigation Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, !showCommandes && styles.tabActive]} onPress={() => setShowCommandes(false)}>
          <Text style={styles.tabText}>🛍️ Produits</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, showCommandes && styles.tabActive]} onPress={() => { setShowCommandes(true); fetchCommandes(); }}>
          <Text style={styles.tabText}>📦 Commandes</Text>
        </TouchableOpacity>
      </View>

      {!showCommandes ? (
        <View style={styles.productsSection}>
          {products.length === 0 ? (
            <Text style={styles.emptyText}>Aucun produit disponible</Text>
          ) : (
            products.map(product => (
              <View key={product._id} style={styles.productCard}>
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{product.nom}</Text>
                  <Text style={styles.productPrice}>{product.prixUnitaire.toLocaleString()} TND</Text>
                </View>
                <TouchableOpacity style={styles.addButton} onPress={() => addToCart(product)}>
                  <Text style={styles.addButtonText}>Ajouter</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      ) : (
        <View style={styles.commandesSection}>
          {commandes.length === 0 ? (
            <Text style={styles.emptyText}>Aucune commande</Text>
          ) : (
            commandes.map(cmd => (
              <View key={cmd._id} style={styles.commandeCard}>
                <Text style={styles.commandeNumber}>{cmd.numeroCommande}</Text>
                <Text style={styles.commandeDate}>{new Date(cmd.dateCreation).toLocaleDateString()}</Text>
                <Text style={styles.commandeTotal}>{cmd.montantTotal?.toLocaleString()} TND</Text>
                <View style={[styles.commandeStatus, cmd.statut === 'Validée' && styles.statusSuccess]}>
                  <Text>{cmd.statut}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      )}

      {/* Cart Modal */}
      <Modal visible={showCart} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Mon Panier</Text>
            {cart.length === 0 ? (
              <Text style={styles.emptyCartText}>Panier vide</Text>
            ) : (
              <>
                {cart.map(item => (
                  <View key={item._id} style={styles.cartItem}>
                    <View style={styles.cartItemInfo}>
                      <Text style={styles.cartItemName}>{item.nom}</Text>
                      <Text>{item.prixUnitaire.toLocaleString()} TND</Text>
                    </View>
                    <View style={styles.cartItemControls}>
                      <TouchableOpacity onPress={() => updateQuantity(item._id, item.quantite - 1)}>
                        <Text style={styles.qtyButton}>-</Text>
                      </TouchableOpacity>
                      <Text style={styles.cartItemQty}>{item.quantite}</Text>
                      <TouchableOpacity onPress={() => updateQuantity(item._id, item.quantite + 1)}>
                        <Text style={styles.qtyButton}>+</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => removeFromCart(item._id)}>
                        <Text style={styles.removeButton}>🗑️</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
                <View style={styles.cartTotal}>
                  <Text style={styles.totalLabel}>Total:</Text>
                  <Text style={styles.totalAmount}>{calculateTotal().toLocaleString()} TND</Text>
                </View>
                <TouchableOpacity style={styles.validateButton} onPress={validateOrder}>
                  <Text style={styles.validateButtonText}>Valider la commande</Text>
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity style={styles.closeModalButton} onPress={() => setShowCart(false)}>
              <Text style={styles.closeModalText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
  cartIcon: { position: 'relative', marginRight: 15 },
  cartIconText: { fontSize: 28, color: '#fff' },
  cartBadge: { position: 'absolute', top: -5, right: -10, backgroundColor: '#ef4444', borderRadius: 10, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center' },
  cartBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  logoutButton: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  logoutText: { color: '#fff', fontSize: 14 },
  tabs: { flexDirection: 'row', backgroundColor: '#fff', padding: 10 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: '#1e3a8a' },
  tabText: { fontSize: 16, fontWeight: '500' },
  productsSection: { padding: 16 },
  productCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  productInfo: { flex: 1 },
  productName: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
  productPrice: { fontSize: 14, color: '#1e3a8a', fontWeight: 'bold', marginTop: 4 },
  addButton: { backgroundColor: '#1e3a8a', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8 },
  addButtonText: { color: '#fff', fontWeight: '600' },
  commandesSection: { padding: 16 },
  commandeCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
  commandeNumber: { fontSize: 14, fontWeight: 'bold', color: '#1e3a8a' },
  commandeDate: { fontSize: 12, color: '#64748b', marginTop: 4 },
  commandeTotal: { fontSize: 16, fontWeight: 'bold', marginTop: 8 },
  commandeStatus: { marginTop: 8, paddingHorizontal: 12, paddingVertical: 4, backgroundColor: '#fef3c7', borderRadius: 20, alignSelf: 'flex-start' },
  statusSuccess: { backgroundColor: '#dcfce7' },
  emptyText: { textAlign: 'center', color: '#64748b', marginTop: 40 },
  modalContainer: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '80%' },
  modalTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  cartItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  cartItemInfo: { flex: 1 },
  cartItemName: { fontSize: 14, fontWeight: '500' },
  cartItemControls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  qtyButton: { fontSize: 20, paddingHorizontal: 12, paddingVertical: 4, backgroundColor: '#e2e8f0', borderRadius: 8, overflow: 'hidden' },
  cartItemQty: { fontSize: 16, fontWeight: '500', marginHorizontal: 8 },
  removeButton: { fontSize: 18, marginLeft: 8 },
  cartTotal: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, paddingTop: 20, borderTopWidth: 2, borderTopColor: '#e2e8f0' },
  totalLabel: { fontSize: 18, fontWeight: 'bold' },
  totalAmount: { fontSize: 20, fontWeight: 'bold', color: '#1e3a8a' },
  validateButton: { backgroundColor: '#16a34a', paddingVertical: 14, borderRadius: 12, marginTop: 20, alignItems: 'center' },
  validateButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  closeModalButton: { marginTop: 12, paddingVertical: 12, alignItems: 'center' },
  closeModalText: { color: '#64748b', fontSize: 14 },
  emptyCartText: { textAlign: 'center', color: '#64748b', marginVertical: 40 },
});