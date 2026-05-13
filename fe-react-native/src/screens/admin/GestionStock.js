// src/screens/admin/GestionStock.js
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
import { Picker } from '@react-native-picker/picker';

export default function GestionStock({ navigation }) {
  const [user, setUser] = useState(null);
  const [data, setData] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [alertes, setAlertes] = useState([]);
  const [showAlertes, setShowAlertes] = useState(true);

  const [form, setForm] = useState({
    product: '',
    quantity: '',
    seuilMin: '10',
    alerteActive: true,
  });

  const IP = '192.168.1.114';
  const API_URL = `http://${IP}:5000/api`;

  useEffect(() => {
    loadUserData();
    fetchData();
    fetchProducts();
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

  const isAdmin = user?.role === 'Admin';
  const isFournisseur = user?.role === 'Fournisseur';

  const fetchData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_URL}/stock`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(response.data);
      const stocksBas = response.data.filter(item => item.quantity < item.seuilMin);
      setAlertes(stocksBas);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
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

  const hasStock = (productId) => {
    return data.some(item => {
      const itemProductId = item.product?._id || item.product;
      return itemProductId === productId;
    });
  };

  const handleSave = async () => {
    if (!form.product && !editingId) {
      Alert.alert('Erreur', 'Veuillez sélectionner un produit');
      return;
    }
    if (!form.quantity || parseInt(form.quantity) <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer une quantité valide');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      const payload = {
        quantity: parseInt(form.quantity),
        seuilMin: parseInt(form.seuilMin),
        alerteActive: form.alerteActive,
      };

      if (editingId) {
        if (!isAdmin) {
          Alert.alert('Erreur', 'Vous n\'avez pas les droits pour modifier');
          return;
        }
        await axios.put(`${API_URL}/stock/${editingId}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        Alert.alert('Succès', 'Stock modifié');
      } else {
        if (!isFournisseur) {
          Alert.alert('Erreur', 'Vous n\'avez pas les droits pour ajouter');
          return;
        }
        await axios.post(`${API_URL}/stock`, { ...payload, product: form.product }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        Alert.alert('Succès', 'Stock ajouté');
      }

      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      Alert.alert('Erreur', error.response?.data?.message || 'Erreur lors de la sauvegarde');
    }
  };

  const resetForm = () => {
    setForm({ product: '', quantity: '', seuilMin: '10', alerteActive: true });
    setEditingId(null);
    setSearchTerm('');
  };

  const handleEdit = (item) => {
    if (!isAdmin) {
      Alert.alert('Erreur', 'Vous n\'avez pas les droits pour modifier');
      return;
    }
    setEditingId(item._id);
    setForm({
      product: item.product?._id || item.product,
      quantity: item.quantity.toString(),
      seuilMin: item.seuilMin.toString(),
      alerteActive: item.alerteActive,
    });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (!isAdmin) {
      Alert.alert('Erreur', 'Vous n\'avez pas les droits pour supprimer');
      return;
    }
    Alert.alert(
      'Confirmation',
      'Êtes-vous sûr de vouloir supprimer ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              await axios.delete(`${API_URL}/stock/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              Alert.alert('Succès', 'Stock supprimé');
              fetchData();
            } catch (error) {
              Alert.alert('Erreur', 'Erreur lors de la suppression');
            }
          },
        },
      ]
    );
  };

  const handleUpdateQuantity = async (id, newQuantity) => {
    if (!isAdmin) {
      Alert.alert('Erreur', 'Vous n\'avez pas les droits pour modifier');
      return;
    }
    if (newQuantity < 0) {
      Alert.alert('Erreur', 'La quantité ne peut pas être négative');
      return;
    }
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.put(`${API_URL}/stock/${id}/quantity`, 
        { quantity: parseInt(newQuantity), operation: 'set' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchData();
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors de la mise à jour');
    }
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

  const filteredData = data.filter(item =>
    item.product?.nom?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalProducts = data.length;
  const lowStockCount = data.filter(item => item.quantity > 0 && item.quantity < item.seuilMin).length;
  const outOfStockCount = data.filter(item => item.quantity <= 0).length;

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
    fetchProducts();
  };

  const renderStockItem = ({ item }) => {
    const isLowStock = item.quantity < item.seuilMin;
    const isOutOfStock = item.quantity <= 0;

    return (
      <View style={[styles.stockCard, isLowStock && styles.lowStockCard]}>
        <View style={styles.stockHeader}>
          <Text style={styles.productName}>{item.product?.nom || '-'}</Text>
          <Text style={styles.productType}>{item.product?.typeProduit?.nom || '-'}</Text>
        </View>

        <View style={styles.stockRow}>
          <Text style={styles.stockLabel}>Quantité:</Text>
          {isAdmin ? (
            <TextInput
              style={styles.quantityInput}
              value={item.quantity.toString()}
              onChangeText={(val) => handleUpdateQuantity(item._id, parseInt(val) || 0)}
              keyboardType="numeric"
            />
          ) : (
            <Text style={[styles.stockValue, isOutOfStock && styles.outOfStock]}>
              {item.quantity} {item.product?.uniteMesure}
            </Text>
          )}
        </View>

        <View style={styles.stockRow}>
          <Text style={styles.stockLabel}>Seuil min:</Text>
          <Text style={styles.stockValue}>{item.seuilMin} {item.product?.uniteMesure}</Text>
        </View>

        <View style={styles.stockRow}>
          <Text style={styles.stockLabel}>Statut:</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStockStatusColor(item.quantity, item.seuilMin) }]}>
            <Text style={styles.statusText}>{getStockStatusText(item.quantity, item.seuilMin)}</Text>
          </View>
        </View>

        {(isAdmin || isFournisseur) && (
          <View style={styles.actionButtons}>
            {isAdmin && (
              <>
                <TouchableOpacity style={styles.editButton} onPress={() => handleEdit(item)}>
                  <Text style={styles.buttonText}>✏️ Modifier</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item._id)}>
                  <Text style={styles.buttonText}>🗑️ Supprimer</Text>
                </TouchableOpacity>
              </>
            )}
            {isFournisseur && !isAdmin && (
              <Text style={styles.viewOnlyBadge}>Consultation seule</Text>
            )}
          </View>
        )}
      </View>
    );
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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Gestion du Stock</Text>
        <Text style={styles.subtitle}>Suivez et gérez votre inventaire</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{totalProducts}</Text>
          <Text style={styles.statLabel}>Produits en stock</Text>
        </View>
        <View style={[styles.statCard, styles.warningCard]}>
          <Text style={styles.statValue}>{lowStockCount}</Text>
          <Text style={styles.statLabel}>Stock faible</Text>
        </View>
        <View style={[styles.statCard, styles.dangerCard]}>
          <Text style={styles.statValue}>{outOfStockCount}</Text>
          <Text style={styles.statLabel}>Rupture</Text>
        </View>
      </View>

      {/* Alertes */}
      {showAlertes && alertes.length > 0 && (
        <View style={styles.alertesContainer}>
          <View style={styles.alertesHeader}>
            <Text style={styles.alertesTitle}>⚠️ Alertes - Stock Bas ({alertes.length})</Text>
            <TouchableOpacity onPress={() => setShowAlertes(false)}>
              <Text style={styles.closeAlerts}>×</Text>
            </TouchableOpacity>
          </View>
          {alertes.map(alerte => (
            <View key={alerte._id} style={styles.alerteItem}>
              <Text style={styles.alerteIcon}>⚠️</Text>
              <Text style={styles.alerteText}>
                <Text style={styles.alerteBold}>{alerte.product?.nom}</Text> - Stock: {alerte.quantity} (Seuil: {alerte.seuilMin})
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Search */}
      <TextInput
        style={styles.searchInput}
        placeholder="🔍 Rechercher un produit..."
        value={searchTerm}
        onChangeText={setSearchTerm}
      />

      {/* Add Button (Fournisseur only) */}
      {isFournisseur && (
        <TouchableOpacity style={styles.addButton} onPress={() => {
          resetForm();
          setEditingId(null);
          setShowModal(true);
        }}>
          <Text style={styles.addButtonText}>+ Ajouter au Stock</Text>
        </TouchableOpacity>
      )}

      {/* Stock List */}
      {filteredData.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📦</Text>
          <Text style={styles.emptyTitle}>Aucun stock enregistré</Text>
        </View>
      ) : (
        <FlatList
          data={filteredData}
          keyExtractor={(item) => item._id}
          renderItem={renderStockItem}
          scrollEnabled={false}
        />
      )}

      {/* Modal Ajout/Modification */}
      <Modal visible={showModal} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingId ? 'Modifier le Stock' : 'Ajouter au Stock'}
            </Text>

            {!editingId && isFournisseur && (
              <>
                <Text style={styles.modalLabel}>Rechercher un produit</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Nom du produit..."
                  value={searchTerm}
                  onChangeText={setSearchTerm}
                />

                <Text style={styles.modalLabel}>Sélectionner un produit</Text>
                <Picker
                  selectedValue={form.product}
                  onValueChange={(val) => setForm({ ...form, product: val })}
                  style={styles.picker}
                >
                  <Picker.Item label="-- Choisir un produit --" value="" />
                  {products.filter(p => !hasStock(p._id)).map(p => (
                    <Picker.Item key={p._id} label={`${p.nom} - ${p.typeProduit?.nom || 'Sans catégorie'}`} value={p._id} />
                  ))}
                </Picker>
              </>
            )}

            <Text style={styles.modalLabel}>Quantité</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Quantité"
              value={form.quantity}
              onChangeText={(val) => setForm({ ...form, quantity: val })}
              keyboardType="numeric"
            />

            <Text style={styles.modalLabel}>Seuil minimum d'alerte</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Seuil minimum"
              value={form.seuilMin}
              onChangeText={(val) => setForm({ ...form, seuilMin: val })}
              keyboardType="numeric"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowModal(false)}>
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>
                  {editingId ? 'Mettre à jour' : 'Ajouter'}
                </Text>
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
  header: { backgroundColor: '#1e3a8a', padding: 24, paddingTop: 60, paddingBottom: 30 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, marginTop: -20 },
  statCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center', flex: 1, marginHorizontal: 5, elevation: 3 },
  warningCard: { backgroundColor: '#fef3c7' },
  dangerCard: { backgroundColor: '#fee2e2' },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#1e3a8a' },
  statLabel: { fontSize: 12, color: '#64748b', marginTop: 4 },
  alertesContainer: { backgroundColor: '#fef3c7', margin: 16, borderRadius: 12, padding: 16 },
  alertesHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  alertesTitle: { fontSize: 14, fontWeight: 'bold', color: '#92400e' },
  closeAlerts: { fontSize: 20, color: '#92400e' },
  alerteItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  alerteIcon: { fontSize: 16, marginRight: 8 },
  alerteText: { fontSize: 12, color: '#92400e', flex: 1 },
  alerteBold: { fontWeight: 'bold' },
  searchInput: { backgroundColor: '#fff', margin: 16, marginTop: 0, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  addButton: { backgroundColor: '#1e3a8a', margin: 16, marginTop: 0, padding: 14, borderRadius: 12, alignItems: 'center' },
  addButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  stockCard: { backgroundColor: '#fff', margin: 16, marginTop: 0, marginBottom: 12, padding: 16, borderRadius: 12, elevation: 2 },
  lowStockCard: { borderLeftWidth: 4, borderLeftColor: '#f59e0b' },
  stockHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  productName: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  productType: { fontSize: 12, color: '#64748b' },
  stockRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  stockLabel: { fontSize: 14, color: '#64748b' },
  stockValue: { fontSize: 14, fontWeight: '500', color: '#1e293b' },
  quantityInput: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 8, width: 100, textAlign: 'center' },
  outOfStock: { color: '#dc3545' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  statusText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  actionButtons: { flexDirection: 'row', marginTop: 12, gap: 10 },
  editButton: { flex: 1, backgroundColor: '#3b82f6', paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  deleteButton: { flex: 1, backgroundColor: '#ef4444', paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 12, fontWeight: '500' },
  viewOnlyBadge: { textAlign: 'center', paddingVertical: 8, backgroundColor: '#e2e8f0', borderRadius: 8, color: '#64748b', fontSize: 12 },
  emptyState: { alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#64748b' },
  modalContainer: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 20, padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  modalLabel: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 8, marginTop: 12 },
  modalInput: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 12, fontSize: 14 },
  picker: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, marginBottom: 8 },
  modalButtons: { flexDirection: 'row', marginTop: 24, gap: 12 },
  cancelButton: { flex: 1, backgroundColor: '#e2e8f0', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  cancelButtonText: { color: '#64748b', fontWeight: '600' },
  saveButton: { flex: 1, backgroundColor: '#1e3a8a', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontWeight: '600' },
});