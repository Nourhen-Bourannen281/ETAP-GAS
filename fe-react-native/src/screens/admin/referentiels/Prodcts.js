// src/screens/admin/referentiels/Products.js
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

export default function Products({ navigation }) {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [sousProduits, setSousProduits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const [form, setForm] = useState({
    code: '',
    nom: '',
    prixUnitaire: '',
    abreviation: '',
    qualite: '',
    description: '',
    uniteMesure: 'Litre',
    sousProduit: '',
    seuilMin: '10',
    stock: '0',
  });

  const IP = '192.168.1.114';
  const API_URL = `http://${IP}:5000/api`;

  useEffect(() => {
    loadUserData();
    fetchProducts();
    fetchSousProduits();
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

  const fetchProducts = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_URL}/products`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(response.data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchSousProduits = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_URL}/sous-produits`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSousProduits(response.data);
    } catch (error) {
      console.error('Erreur sous-produits:', error);
    }
  };

  const handleSave = async () => {
    if (!form.nom) {
      Alert.alert('Erreur', 'Le nom du produit est requis');
      return;
    }
    if (!form.prixUnitaire || parseFloat(form.prixUnitaire) <= 0) {
      Alert.alert('Erreur', 'Le prix unitaire doit être supérieur à 0');
      return;
    }
    if (!form.sousProduit) {
      Alert.alert('Erreur', 'Veuillez sélectionner un sous-produit');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
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
        stock: Number(form.stock) || 0,
      };

      if (editing) {
        await axios.put(`${API_URL}/products/${editing._id}`, productData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        Alert.alert('Succès', 'Produit modifié');
      } else {
        await axios.post(`${API_URL}/products`, productData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        Alert.alert('Succès', 'Produit créé');
      }

      setShowModal(false);
      resetForm();
      fetchProducts();
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors de la sauvegarde');
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
      seuilMin: '10',
      stock: '0',
    });
    setEditing(null);
  };

  const handleEdit = (product) => {
    setEditing(product);
    setForm({
      code: product.code || '',
      nom: product.nom || '',
      prixUnitaire: product.prixUnitaire?.toString() || '',
      abreviation: product.abreviation || '',
      qualite: product.qualite || '',
      description: product.description || '',
      uniteMesure: product.uniteMesure || 'Litre',
      sousProduit: product.sousProduit?._id || product.sousProduit || '',
      seuilMin: product.seuilMin?.toString() || '10',
      stock: product.stock?.toString() || '0',
    });
    setShowModal(true);
  };

  const confirmDelete = (id) => {
    setDeleteId(id);
    setShowConfirm(true);
  };

  const handleDelete = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.delete(`${API_URL}/products/${deleteId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Alert.alert('Succès', 'Produit supprimé');
      fetchProducts();
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors de la suppression');
    } finally {
      setShowConfirm(false);
      setDeleteId(null);
    }
  };

  const getStockStatus = (stock) => {
    const s = Number(stock);
    if (s <= 0) return { text: 'Rupture', class: 'out' };
    if (s < 10) return { text: 'Stock faible', class: 'low' };
    return { text: 'Stock OK', class: 'ok' };
  };

  const totalProducts = products.length;
  const lowStockCount = products.filter(p => Number(p.stock) > 0 && Number(p.stock) < 10).length;
  const outOfStockCount = products.filter(p => Number(p.stock) <= 0).length;

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  const renderItem = ({ item }) => {
    const stockStatus = getStockStatus(item.stock);
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.productName}>{item.nom}</Text>
          <Text style={styles.productPrice}>{Number(item.prixUnitaire).toLocaleString()} TND</Text>
        </View>
        <Text style={styles.productCode}>Code: {item.code || '-'}</Text>
        <Text style={styles.productUnit}>Unité: {item.uniteMesure}</Text>
        <Text style={styles.productSous}>Sous-produit: {item.sousProduit?.nom || '-'}</Text>
        <View style={styles.stockRow}>
          <Text style={styles.stockLabel}>Stock:</Text>
          <View style={[styles.stockBadge, styles[`stock${stockStatus.class.charAt(0).toUpperCase() + stockStatus.class.slice(1)}`]]}>
            <Text style={styles.stockText}>{item.stock || 0} - {stockStatus.text}</Text>
          </View>
        </View>
        {isAdmin && (
          <View style={styles.actions}>
            <TouchableOpacity style={styles.editButton} onPress={() => handleEdit(item)}>
              <Text style={styles.buttonText}>✏️ Modifier</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteButton} onPress={() => confirmDelete(item._id)}>
              <Text style={styles.buttonText}>🗑️ Supprimer</Text>
            </TouchableOpacity>
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
      <View style={styles.header}>
        <Text style={styles.title}>Gestion des Produits</Text>
        <Text style={styles.subtitle}>Catalogue complet avec suivi des stocks</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{totalProducts}</Text>
          <Text style={styles.statLabel}>Total Produits</Text>
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

      {isAdmin && (
        <TouchableOpacity style={styles.addButton} onPress={() => { resetForm(); setShowModal(true); }}>
          <Text style={styles.addButtonText}>+ Nouveau Produit</Text>
        </TouchableOpacity>
      )}

      {products.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📦</Text>
          <Text style={styles.emptyTitle}>Aucun produit</Text>
        </View>
      ) : (
        <FlatList data={products} keyExtractor={(item) => item._id} renderItem={renderItem} scrollEnabled={false} />
      )}

      {/* Modal Produit */}
      <Modal visible={showModal} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editing ? 'Modifier Produit' : 'Nouveau Produit'}</Text>

            <Text style={styles.modalLabel}>Nom *</Text>
            <TextInput style={styles.modalInput} placeholder="Nom du produit" value={form.nom} onChangeText={(val) => setForm({ ...form, nom: val })} />

            <Text style={styles.modalLabel}>Code</Text>
            <TextInput style={styles.modalInput} placeholder="Code produit" value={form.code} onChangeText={(val) => setForm({ ...form, code: val })} />

            <Text style={styles.modalLabel}>Sous-produit *</Text>
            <Picker selectedValue={form.sousProduit} onValueChange={(val) => setForm({ ...form, sousProduit: val })} style={styles.picker}>
              <Picker.Item label="Sélectionner..." value="" />
              {sousProduits.map(sp => <Picker.Item key={sp._id} label={sp.nom} value={sp._id} />)}
            </Picker>

            <Text style={styles.modalLabel}>Prix unitaire (TND) *</Text>
            <TextInput style={styles.modalInput} placeholder="0.00" value={form.prixUnitaire} onChangeText={(val) => setForm({ ...form, prixUnitaire: val })} keyboardType="numeric" />

            <Text style={styles.modalLabel}>Unité de mesure</Text>
            <Picker selectedValue={form.uniteMesure} onValueChange={(val) => setForm({ ...form, uniteMesure: val })} style={styles.picker}>
              <Picker.Item label="Litre" value="Litre" />
              <Picker.Item label="KG" value="KG" />
              <Picker.Item label="Tonne" value="Tonne" />
              <Picker.Item label="Unité" value="Unité" />
            </Picker>

            <Text style={styles.modalLabel}>Stock actuel</Text>
            <TextInput style={styles.modalInput} placeholder="0" value={form.stock} onChangeText={(val) => setForm({ ...form, stock: val })} keyboardType="numeric" />

            <Text style={styles.modalLabel}>Seuil minimum</Text>
            <TextInput style={styles.modalInput} placeholder="10" value={form.seuilMin} onChangeText={(val) => setForm({ ...form, seuilMin: val })} keyboardType="numeric" />

            <Text style={styles.modalLabel}>Description</Text>
            <TextInput style={[styles.modalInput, styles.textArea]} placeholder="Description" value={form.description} onChangeText={(val) => setForm({ ...form, description: val })} multiline numberOfLines={3} />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowModal(false)}>
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>Enregistrer</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Confirm Dialog */}
      <Modal visible={showConfirm} animationType="fade" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.confirmModal}>
            <Text style={styles.confirmTitle}>Confirmer suppression</Text>
            <Text style={styles.confirmText}>Êtes-vous sûr de vouloir supprimer ce produit ?</Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity style={styles.confirmCancel} onPress={() => setShowConfirm(false)}>
                <Text>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmDelete} onPress={handleDelete}>
                <Text style={{ color: '#fff' }}>Supprimer</Text>
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
  addButton: { backgroundColor: '#1e3a8a', margin: 16, padding: 14, borderRadius: 12, alignItems: 'center' },
  addButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  card: { backgroundColor: '#fff', margin: 16, marginTop: 0, marginBottom: 12, padding: 16, borderRadius: 12, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  productName: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  productPrice: { fontSize: 14, fontWeight: 'bold', color: '#059669' },
  productCode: { fontSize: 12, color: '#64748b', marginBottom: 4 },
  productUnit: { fontSize: 12, color: '#64748b', marginBottom: 4 },
  productSous: { fontSize: 12, color: '#64748b', marginBottom: 8 },
  stockRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  stockLabel: { fontSize: 12, color: '#64748b', marginRight: 8 },
  stockBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  stockOk: { backgroundColor: '#dcfce7' },
  stockLow: { backgroundColor: '#fef3c7' },
  stockOut: { backgroundColor: '#fee2e2' },
  stockText: { fontSize: 11, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 10 },
  editButton: { flex: 1, backgroundColor: '#3b82f6', paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  deleteButton: { flex: 1, backgroundColor: '#ef4444', paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 12, fontWeight: '500' },
  emptyState: { alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#64748b' },
  modalContainer: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 20, padding: 20, maxHeight: '80%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  modalLabel: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 8, marginTop: 12 },
  modalInput: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 12, fontSize: 14 },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  picker: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, marginBottom: 8 },
  modalButtons: { flexDirection: 'row', marginTop: 24, marginBottom: 20, gap: 12 },
  cancelButton: { flex: 1, backgroundColor: '#e2e8f0', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  cancelButtonText: { color: '#64748b', fontWeight: '600' },
  saveButton: { flex: 1, backgroundColor: '#1e3a8a', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontWeight: '600' },
  confirmModal: { backgroundColor: '#fff', borderRadius: 16, padding: 24, alignItems: 'center' },
  confirmTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  confirmText: { fontSize: 14, color: '#64748b', marginBottom: 20, textAlign: 'center' },
  confirmButtons: { flexDirection: 'row', gap: 12 },
  confirmCancel: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#e2e8f0', borderRadius: 8 },
  confirmDelete: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#dc2626', borderRadius: 8 },
});