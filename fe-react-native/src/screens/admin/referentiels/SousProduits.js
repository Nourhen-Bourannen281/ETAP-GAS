// src/screens/admin/referentiels/SousProduits.js
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

export default function SousProduits({ navigation }) {
  const [user, setUser] = useState(null);
  const [data, setData] = useState([]);
  const [typeProduits, setTypeProduits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    nom: '',
    typeProduit: '',
    prixUnitaire: '',
    uniteMesure: 'Litre',
    seuilMin: '100',
  });

  const IP = '192.168.1.114';
  const API_URL = `http://${IP}:5000/api`;

  useEffect(() => {
    loadUserData();
    fetchData();
    fetchTypeProduits();
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

  const fetchData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_URL}/sous-produits`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(response.data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchTypeProduits = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_URL}/type-produits`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTypeProduits(response.data);
    } catch (error) {
      console.error('Erreur type produits:', error);
    }
  };

  const handleSave = async () => {
    if (!form.nom.trim() || !form.typeProduit) {
      Alert.alert('Erreur', 'Nom et Type de produit sont obligatoires');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      if (editingId) {
        await axios.put(`${API_URL}/sous-produits/${editingId}`, form, {
          headers: { Authorization: `Bearer ${token}` }
        });
        Alert.alert('Succès', 'Sous-produit modifié');
      } else {
        await axios.post(`${API_URL}/sous-produits`, form, {
          headers: { Authorization: `Bearer ${token}` }
        });
        Alert.alert('Succès', 'Sous-produit ajouté');
      }

      setShowModal(false);
      setEditingId(null);
      setForm({ nom: '', typeProduit: '', prixUnitaire: '', uniteMesure: 'Litre', seuilMin: '100' });
      fetchData();
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors de la sauvegarde');
    }
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    setForm({
      nom: item.nom,
      typeProduit: item.typeProduit?._id || item.typeProduit,
      prixUnitaire: item.prixUnitaire?.toString() || '',
      uniteMesure: item.uniteMesure || 'Litre',
      seuilMin: item.seuilMin?.toString() || '100',
    });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    Alert.alert(
      'Confirmation',
      'Supprimer ce sous-produit ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              await axios.delete(`${API_URL}/sous-produits/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              Alert.alert('Succès', 'Sous-produit supprimé');
              fetchData();
            } catch (error) {
              Alert.alert('Erreur', 'Erreur lors de la suppression');
            }
          },
        },
      ]
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{item.nom}</Text>
      <View style={styles.details}>
        <Text style={styles.detail}>Type: {item.typeProduit?.nom || '-'}</Text>
        <Text style={styles.detail}>Prix: {item.prixUnitaire ? `${item.prixUnitaire} TND` : '-'}</Text>
        <Text style={styles.detail}>Unité: {item.uniteMesure}</Text>
        <Text style={styles.detail}>Seuil min: {item.seuilMin}</Text>
      </View>
      {isAdmin && (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.editButton} onPress={() => handleEdit(item)}>
            <Text style={styles.buttonText}>✏️ Modifier</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item._id)}>
            <Text style={styles.buttonText}>🗑️ Supprimer</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

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
        <Text style={styles.title}>Sous-Produits</Text>
        <Text style={styles.subtitle}>Gestion des sous-produits par catégorie</Text>
      </View>

      {isAdmin && (
        <TouchableOpacity style={styles.addButton} onPress={() => { setEditingId(null); setForm({ nom: '', typeProduit: '', prixUnitaire: '', uniteMesure: 'Litre', seuilMin: '100' }); setShowModal(true); }}>
          <Text style={styles.addButtonText}>+ Nouveau Sous-Produit</Text>
        </TouchableOpacity>
      )}

      {data.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>Aucun sous-produit</Text>
        </View>
      ) : (
        <FlatList data={data} keyExtractor={(item) => item._id} renderItem={renderItem} scrollEnabled={false} />
      )}

      <Modal visible={showModal} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingId ? 'Modifier Sous-Produit' : 'Nouveau Sous-Produit'}</Text>

            <Text style={styles.modalLabel}>Nom *</Text>
            <TextInput style={styles.modalInput} placeholder="Nom" value={form.nom} onChangeText={(val) => setForm({ ...form, nom: val })} />

            <Text style={styles.modalLabel}>Type de produit *</Text>
            <Picker selectedValue={form.typeProduit} onValueChange={(val) => setForm({ ...form, typeProduit: val })} style={styles.picker}>
              <Picker.Item label="Sélectionner un type" value="" />
              {typeProduits.map(tp => <Picker.Item key={tp._id} label={tp.nom} value={tp._id} />)}
            </Picker>

            <Text style={styles.modalLabel}>Prix unitaire (TND)</Text>
            <TextInput style={styles.modalInput} placeholder="Prix" value={form.prixUnitaire} onChangeText={(val) => setForm({ ...form, prixUnitaire: val })} keyboardType="numeric" />

            <Text style={styles.modalLabel}>Unité de mesure</Text>
            <Picker selectedValue={form.uniteMesure} onValueChange={(val) => setForm({ ...form, uniteMesure: val })} style={styles.picker}>
              <Picker.Item label="Litre" value="Litre" />
              <Picker.Item label="KG" value="KG" />
              <Picker.Item label="Tonne" value="Tonne" />
              <Picker.Item label="Unité" value="Unité" />
            </Picker>

            <Text style={styles.modalLabel}>Seuil minimum stock</Text>
            <TextInput style={styles.modalInput} placeholder="Seuil" value={form.seuilMin} onChangeText={(val) => setForm({ ...form, seuilMin: val })} keyboardType="numeric" />

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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#1e3a8a', padding: 24, paddingTop: 60, paddingBottom: 30 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  addButton: { backgroundColor: '#1e3a8a', margin: 16, padding: 14, borderRadius: 12, alignItems: 'center' },
  addButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  card: { backgroundColor: '#fff', margin: 16, marginTop: 0, marginBottom: 12, padding: 16, borderRadius: 12, elevation: 2 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e3a8a', marginBottom: 12 },
  details: { marginBottom: 12 },
  detail: { fontSize: 14, color: '#64748b', marginBottom: 4 },
  actions: { flexDirection: 'row', gap: 10 },
  editButton: { flex: 1, backgroundColor: '#3b82f6', paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  deleteButton: { flex: 1, backgroundColor: '#ef4444', paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 12, fontWeight: '500' },
  emptyState: { alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#64748b' },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 20, padding: 20, maxHeight: '80%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  modalLabel: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 8, marginTop: 12 },
  modalInput: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 12, fontSize: 14 },
  picker: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, marginBottom: 8 },
  modalButtons: { flexDirection: 'row', marginTop: 24, marginBottom: 20, gap: 12 },
  cancelButton: { flex: 1, backgroundColor: '#e2e8f0', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  cancelButtonText: { color: '#64748b', fontWeight: '600' },
  saveButton: { flex: 1, backgroundColor: '#1e3a8a', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontWeight: '600' },
});