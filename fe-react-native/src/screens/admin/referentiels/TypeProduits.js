// src/screens/admin/referentiels/TypeProduits.js
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

export default function TypeProduits({ navigation }) {
  const [user, setUser] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ nom: '', description: '' });

  const IP = '192.168.1.114';
  const API_URL = `http://${IP}:5000/api`;

  useEffect(() => {
    loadUserData();
    fetchData();
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
      const response = await axios.get(`${API_URL}/type-produits`, {
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

  const handleSave = async () => {
    if (!form.nom.trim()) {
      Alert.alert('Erreur', 'Le nom est obligatoire');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      if (editingId) {
        await axios.put(`${API_URL}/type-produits/${editingId}`, form, {
          headers: { Authorization: `Bearer ${token}` }
        });
        Alert.alert('Succès', 'Type de produit modifié');
      } else {
        await axios.post(`${API_URL}/type-produits`, form, {
          headers: { Authorization: `Bearer ${token}` }
        });
        Alert.alert('Succès', 'Type de produit ajouté');
      }

      setShowModal(false);
      setEditingId(null);
      setForm({ nom: '', description: '' });
      fetchData();
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors de la sauvegarde');
    }
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    setForm({ nom: item.nom, description: item.description || '' });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    Alert.alert(
      'Confirmation',
      'Supprimer ce type de produit ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              await axios.delete(`${API_URL}/type-produits/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              Alert.alert('Succès', 'Type de produit supprimé');
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
      <View style={styles.cardContent}>
        <Text style={styles.name}>{item.nom}</Text>
        {item.description && <Text style={styles.description}>{item.description}</Text>}
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
        <Text style={styles.title}>Types de Produits</Text>
        <Text style={styles.subtitle}>Gestion des catégories de produits</Text>
      </View>

      {isAdmin && (
        <TouchableOpacity style={styles.addButton} onPress={() => { setEditingId(null); setForm({ nom: '', description: '' }); setShowModal(true); }}>
          <Text style={styles.addButtonText}>+ Nouveau Type</Text>
        </TouchableOpacity>
      )}

      {data.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🏷️</Text>
          <Text style={styles.emptyTitle}>Aucun type de produit</Text>
        </View>
      ) : (
        <FlatList data={data} keyExtractor={(item) => item._id} renderItem={renderItem} scrollEnabled={false} />
      )}

      <Modal visible={showModal} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingId ? 'Modifier Type' : 'Nouveau Type'}</Text>

            <Text style={styles.modalLabel}>Nom *</Text>
            <TextInput style={styles.modalInput} placeholder="Nom" value={form.nom} onChangeText={(val) => setForm({ ...form, nom: val })} />

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
  addButton: { backgroundColor: '#1e3a8a', margin: 16, padding: 14, borderRadius: 12, alignItems: 'center' },
  addButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  card: { backgroundColor: '#fff', margin: 16, marginTop: 0, marginBottom: 12, padding: 16, borderRadius: 12, elevation: 2, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardContent: { flex: 1 },
  name: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  description: { fontSize: 13, color: '#64748b', marginTop: 4 },
  actions: { flexDirection: 'row', gap: 8 },
  editButton: { backgroundColor: '#3b82f6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  deleteButton: { backgroundColor: '#ef4444', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  buttonText: { color: '#fff', fontSize: 12, fontWeight: '500' },
  emptyState: { alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#64748b' },
  modalContainer: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 20, padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  modalLabel: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 8, marginTop: 12 },
  modalInput: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 12, fontSize: 14 },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  modalButtons: { flexDirection: 'row', marginTop: 24, gap: 12 },
  cancelButton: { flex: 1, backgroundColor: '#e2e8f0', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  cancelButtonText: { color: '#64748b', fontWeight: '600' },
  saveButton: { flex: 1, backgroundColor: '#1e3a8a', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontWeight: '600' },
});