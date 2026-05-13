// src/screens/admin/referentiels/Banques.js
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

export default function Banques({ navigation }) {
  const [user, setUser] = useState(null);
  const [data, setData] = useState([]);
  const [pays, setPays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    nom: '',
    codeSwift: '',
    adresse: '',
    pays: '',
  });

  const IP = '192.168.1.114';
  const API_URL = `http://${IP}:5000/api`;

  useEffect(() => {
    loadUserData();
    fetchData();
    fetchPays();
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
      const response = await axios.get(`${API_URL}/banques`, {
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

  const fetchPays = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_URL}/pays`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPays(response.data);
    } catch (error) {
      console.error('Erreur pays:', error);
    }
  };

  const handleSave = async () => {
    if (!form.nom.trim()) {
      Alert.alert('Erreur', 'Le nom de la banque est obligatoire');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      if (editingId) {
        await axios.put(`${API_URL}/banques/${editingId}`, form, {
          headers: { Authorization: `Bearer ${token}` }
        });
        Alert.alert('Succès', 'Banque modifiée');
      } else {
        await axios.post(`${API_URL}/banques`, form, {
          headers: { Authorization: `Bearer ${token}` }
        });
        Alert.alert('Succès', 'Banque ajoutée');
      }

      setShowModal(false);
      setEditingId(null);
      resetForm();
      fetchData();
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors de la sauvegarde');
    }
  };

  const resetForm = () => {
    setForm({ nom: '', codeSwift: '', adresse: '', pays: '' });
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    setForm({
      nom: item.nom,
      codeSwift: item.codeSwift || '',
      adresse: item.adresse || '',
      pays: item.pays?._id || item.pays || '',
    });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    Alert.alert(
      'Confirmation',
      'Supprimer cette banque ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              await axios.delete(`${API_URL}/banques/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              Alert.alert('Succès', 'Banque supprimée');
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
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.nom}</Text>
        {item.codeSwift && <Text style={styles.swiftCode}>{item.codeSwift}</Text>}
      </View>
      {item.adresse && <Text style={styles.adresse}>📍 {item.adresse}</Text>}
      <Text style={styles.pays}>🌍 {item.pays?.nom || '-'}</Text>
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
        <Text style={styles.title}>Banques</Text>
        <Text style={styles.subtitle}>Gestion des établissements bancaires</Text>
      </View>

      {isAdmin && (
        <TouchableOpacity style={styles.addButton} onPress={() => { resetForm(); setShowModal(true); }}>
          <Text style={styles.addButtonText}>+ Nouvelle Banque</Text>
        </TouchableOpacity>
      )}

      {data.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🏦</Text>
          <Text style={styles.emptyTitle}>Aucune banque</Text>
        </View>
      ) : (
        <FlatList data={data} keyExtractor={(item) => item._id} renderItem={renderItem} scrollEnabled={false} />
      )}

      <Modal visible={showModal} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.modalTitle}>{editingId ? 'Modifier Banque' : 'Nouvelle Banque'}</Text>

            <Text style={styles.modalLabel}>Nom de la banque *</Text>
            <TextInput style={styles.modalInput} placeholder="Nom" value={form.nom} onChangeText={(val) => setForm({ ...form, nom: val })} />

            <Text style={styles.modalLabel}>Code Swift</Text>
            <TextInput style={styles.modalInput} placeholder="Code Swift" value={form.codeSwift} onChangeText={(val) => setForm({ ...form, codeSwift: val })} />

            <Text style={styles.modalLabel}>Pays</Text>
            <Picker selectedValue={form.pays} onValueChange={(val) => setForm({ ...form, pays: val })} style={styles.picker}>
              <Picker.Item label="Sélectionner un pays" value="" />
              {pays.map(p => <Picker.Item key={p._id} label={p.nom} value={p._id} />)}
            </Picker>

            <Text style={styles.modalLabel}>Adresse</Text>
            <TextInput style={styles.modalInput} placeholder="Adresse" value={form.adresse} onChangeText={(val) => setForm({ ...form, adresse: val })} multiline />

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
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  swiftCode: { fontSize: 12, color: '#64748b' },
  adresse: { fontSize: 13, color: '#64748b', marginBottom: 4 },
  pays: { fontSize: 13, color: '#64748b' },
  actions: { flexDirection: 'row', marginTop: 12, gap: 10 },
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