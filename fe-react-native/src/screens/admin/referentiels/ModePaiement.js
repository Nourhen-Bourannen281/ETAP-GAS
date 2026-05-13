// src/screens/admin/referentiels/ModesPaiement.js
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
  Switch,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

export default function ModesPaiement({ navigation }) {
  const [user, setUser] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    nom: '',
    description: '',
    actif: true,
  });

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
      const response = await axios.get(`${API_URL}/modes-paiement`, {
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
        await axios.put(`${API_URL}/modes-paiement/${editingId}`, {
          nom: form.nom.trim(),
          description: form.description,
          actif: form.actif,
        }, { headers: { Authorization: `Bearer ${token}` } });
        Alert.alert('Succès', 'Mode de paiement modifié');
      } else {
        await axios.post(`${API_URL}/modes-paiement`, {
          nom: form.nom.trim(),
          description: form.description,
        }, { headers: { Authorization: `Bearer ${token}` } });
        Alert.alert('Succès', 'Mode de paiement ajouté');
      }

      setShowModal(false);
      setEditingId(null);
      setForm({ nom: '', description: '', actif: true });
      fetchData();
    } catch (error) {
      Alert.alert('Erreur', error.response?.data?.message || 'Erreur lors de la sauvegarde');
    }
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    setForm({
      nom: item.nom,
      description: item.description || '',
      actif: item.actif !== undefined ? item.actif : true,
    });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    Alert.alert(
      'Confirmation',
      'Supprimer ce mode de paiement ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              await axios.delete(`${API_URL}/modes-paiement/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              Alert.alert('Succès', 'Mode de paiement supprimé');
              fetchData();
            } catch (error) {
              Alert.alert('Erreur', error.response?.data?.message || 'Erreur lors de la suppression');
            }
          },
        },
      ]
    );
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.patch(`${API_URL}/modes-paiement/${id}/toggle`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors du changement de statut');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const renderItem = ({ item }) => (
    <View style={[styles.card, !item.actif && styles.inactiveCard]}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.nom}</Text>
        <View style={[styles.statusBadge, item.actif ? styles.activeBadge : styles.inactiveBadge]}>
          <Text style={styles.statusText}>{item.actif ? 'Actif' : 'Inactif'}</Text>
        </View>
      </View>
      {item.description && <Text style={styles.description}>{item.description}</Text>}
      <Text style={styles.date}>Créé le: {new Date(item.dateCreation).toLocaleDateString()}</Text>

      {isAdmin && (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.toggleButton} onPress={() => handleToggleStatus(item._id, item.actif)}>
            <Text style={styles.toggleButtonText}>{item.actif ? '🔴 Désactiver' : '🟢 Activer'}</Text>
          </TouchableOpacity>
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

  if (!isAdmin) {
    return (
      <View style={styles.center}>
        <Text>⛔ Accès réservé aux administrateurs</Text>
      </View>
    );
  }

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
        <Text style={styles.title}>Modes de Paiement</Text>
        <Text style={styles.subtitle}>Gestion des modes de paiement disponibles</Text>
      </View>

      <TouchableOpacity style={styles.addButton} onPress={() => { setEditingId(null); setForm({ nom: '', description: '', actif: true }); setShowModal(true); }}>
        <Text style={styles.addButtonText}>+ Nouveau Mode de Paiement</Text>
      </TouchableOpacity>

      {data.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>💰</Text>
          <Text style={styles.emptyTitle}>Aucun mode de paiement</Text>
        </View>
      ) : (
        <FlatList data={data} keyExtractor={(item) => item._id} renderItem={renderItem} scrollEnabled={false} />
      )}

      <Modal visible={showModal} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingId ? 'Modifier Mode de Paiement' : 'Nouveau Mode de Paiement'}</Text>

            <Text style={styles.modalLabel}>Nom *</Text>
            <TextInput style={styles.modalInput} placeholder="Ex: Carte bancaire, Virement..." value={form.nom} onChangeText={(val) => setForm({ ...form, nom: val })} />

            <Text style={styles.modalLabel}>Description</Text>
            <TextInput style={[styles.modalInput, styles.textArea]} placeholder="Description" value={form.description} onChangeText={(val) => setForm({ ...form, description: val })} multiline numberOfLines={3} />

            {editingId && (
              <View style={styles.switchRow}>
                <Text style={styles.modalLabel}>Actif</Text>
                <Switch value={form.actif} onValueChange={(val) => setForm({ ...form, actif: val })} />
              </View>
            )}

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
  inactiveCard: { opacity: 0.6 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  activeBadge: { backgroundColor: '#dcfce7' },
  inactiveBadge: { backgroundColor: '#fee2e2' },
  statusText: { fontSize: 12, fontWeight: '600' },
  description: { fontSize: 13, color: '#64748b', marginBottom: 8 },
  date: { fontSize: 11, color: '#94a3b8', marginBottom: 12 },
  actions: { flexDirection: 'row', gap: 8 },
  toggleButton: { flex: 1, backgroundColor: '#f59e0b', paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  toggleButtonText: { color: '#fff', fontSize: 12, fontWeight: '500' },
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
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  modalButtons: { flexDirection: 'row', marginTop: 24, marginBottom: 20, gap: 12 },
  cancelButton: { flex: 1, backgroundColor: '#e2e8f0', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  cancelButtonText: { color: '#64748b', fontWeight: '600' },
  saveButton: { flex: 1, backgroundColor: '#1e3a8a', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontWeight: '600' },
});