// src/screens/admin/referentiels/TypesFacture.js
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

export default function TypesFacture({ navigation }) {
  const [user, setUser] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ nom: '', devise: 'TND' });

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
      const response = await axios.get(`${API_URL}/types-facture`, {
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
        await axios.put(`${API_URL}/types-facture/${editingId}`, form, {
          headers: { Authorization: `Bearer ${token}` }
        });
        Alert.alert('Succès', 'Type de facture modifié');
      } else {
        await axios.post(`${API_URL}/types-facture`, form, {
          headers: { Authorization: `Bearer ${token}` }
        });
        Alert.alert('Succès', 'Type de facture ajouté');
      }

      setShowModal(false);
      setEditingId(null);
      setForm({ nom: '', devise: 'TND' });
      fetchData();
    } catch (error) {
      Alert.alert('Erreur', error.response?.data?.message || 'Erreur lors de la sauvegarde');
    }
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    setForm({ nom: item.nom, devise: item.devise });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    Alert.alert(
      'Confirmation',
      'Supprimer ce type de facture ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              await axios.delete(`${API_URL}/types-facture/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              Alert.alert('Succès', 'Type de facture supprimé');
              fetchData();
            } catch (error) {
              Alert.alert('Erreur', error.response?.data?.message || 'Erreur lors de la suppression');
            }
          },
        },
      ]
    );
  };

  const getDeviseIcon = (devise) => devise === 'USD' ? '💵' : '💰';
  const getDeviseLabel = (devise) => devise === 'USD' ? 'Dollar US (USD)' : 'Dinar Tunisien (TND)';

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.nom}</Text>
        <View style={styles.deviseBadge}>
          <Text style={styles.deviseText}>{getDeviseIcon(item.devise)} {getDeviseLabel(item.devise)}</Text>
        </View>
      </View>
      <Text style={styles.date}>Créé le: {new Date(item.dateCreation).toLocaleDateString()}</Text>
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

  if (!isAdmin) {
    return (
      <View style={styles.center}>
        <Text style={styles.accessDeniedText}>⛔ Accès réservé aux administrateurs</Text>
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
        <Text style={styles.title}>Types de Facture</Text>
        <Text style={styles.subtitle}>Gestion des types de factures (local et export)</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{data.length}</Text>
          <Text style={styles.statLabel}>Total types</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{data.filter(t => t.devise === 'TND').length}</Text>
          <Text style={styles.statLabel}>💰 TND</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{data.filter(t => t.devise === 'USD').length}</Text>
          <Text style={styles.statLabel}>💵 USD</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.addButton} onPress={() => { setEditingId(null); setForm({ nom: '', devise: 'TND' }); setShowModal(true); }}>
        <Text style={styles.addButtonText}>+ Nouveau Type</Text>
      </TouchableOpacity>

      {data.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📄</Text>
          <Text style={styles.emptyTitle}>Aucun type de facture</Text>
        </View>
      ) : (
        <FlatList 
          data={data} 
          keyExtractor={(item) => item._id} 
          renderItem={renderItem} 
          scrollEnabled={false} 
        />
      )}

      {/* Modal Ajout/Modification */}
      <Modal visible={showModal} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingId ? 'Modifier Type de Facture' : 'Ajouter un Type de Facture'}
            </Text>

            <Text style={styles.modalLabel}>Nom *</Text>
            <TextInput 
              style={styles.modalInput} 
              placeholder="Ex: Facture Locale, Facture Export..." 
              value={form.nom} 
              onChangeText={(val) => setForm({ ...form, nom: val })} 
            />

            <Text style={styles.modalLabel}>Devise *</Text>
            <Picker 
              selectedValue={form.devise} 
              onValueChange={(val) => setForm({ ...form, devise: val })} 
              style={styles.picker}
            >
              <Picker.Item label="💰 Dinar Tunisien (TND) - Factures locales" value="TND" />
              <Picker.Item label="💵 Dollar US (USD) - Factures export" value="USD" />
            </Picker>

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
  container: { 
    flex: 1, 
    backgroundColor: '#f5f5f5' 
  },
  center: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  accessDeniedText: {
    fontSize: 16,
    color: '#dc2626',
    fontWeight: '600',
  },
  header: { 
    backgroundColor: '#1e3a8a', 
    padding: 24, 
    paddingTop: 60, 
    paddingBottom: 30 
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: '#fff' 
  },
  subtitle: { 
    fontSize: 14, 
    color: 'rgba(255,255,255,0.8)', 
    marginTop: 4 
  },
  statsContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    padding: 16, 
    marginTop: -20 
  },
  statCard: { 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    padding: 16, 
    alignItems: 'center', 
    flex: 1, 
    marginHorizontal: 5, 
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statValue: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: '#1e3a8a' 
  },
  statLabel: { 
    fontSize: 12, 
    color: '#64748b', 
    marginTop: 4 
  },
  addButton: { 
    backgroundColor: '#1e3a8a', 
    margin: 16, 
    padding: 14, 
    borderRadius: 12, 
    alignItems: 'center' 
  },
  addButtonText: { 
    color: '#fff', 
    fontWeight: '600', 
    fontSize: 16 
  },
  card: { 
    backgroundColor: '#fff', 
    margin: 16, 
    marginTop: 0, 
    marginBottom: 12, 
    padding: 16, 
    borderRadius: 12, 
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  cardHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 8 
  },
  cardTitle: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#1e293b' 
  },
  deviseBadge: { 
    backgroundColor: '#dbeafe', 
    paddingHorizontal: 12, 
    paddingVertical: 4, 
    borderRadius: 20 
  },
  deviseText: { 
    fontSize: 12, 
    fontWeight: '500', 
    color: '#1e3a8a' 
  },
  date: { 
    fontSize: 11, 
    color: '#94a3b8', 
    marginBottom: 12 
  },
  actions: { 
    flexDirection: 'row', 
    gap: 10 
  },
  editButton: { 
    flex: 1, 
    backgroundColor: '#3b82f6', 
    paddingVertical: 8, 
    borderRadius: 8, 
    alignItems: 'center' 
  },
  deleteButton: { 
    flex: 1, 
    backgroundColor: '#ef4444', 
    paddingVertical: 8, 
    borderRadius: 8, 
    alignItems: 'center' 
  },
  buttonText: { 
    color: '#fff', 
    fontSize: 12, 
    fontWeight: '500' 
  },
  emptyState: { 
    alignItems: 'center', 
    padding: 40 
  },
  emptyIcon: { 
    fontSize: 48, 
    marginBottom: 16 
  },
  emptyTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#64748b' 
  },
  modalContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    padding: 20 
  },
  modalContent: { 
    backgroundColor: '#fff', 
    borderRadius: 20, 
    padding: 20 
  },
  modalTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    marginBottom: 16, 
    textAlign: 'center' 
  },
  modalLabel: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: '#334155', 
    marginBottom: 8, 
    marginTop: 12 
  },
  modalInput: { 
    borderWidth: 1, 
    borderColor: '#e2e8f0', 
    borderRadius: 8, 
    padding: 12, 
    fontSize: 14 
  },
  picker: { 
    borderWidth: 1, 
    borderColor: '#e2e8f0', 
    borderRadius: 8, 
    marginBottom: 8 
  },
  modalButtons: { 
    flexDirection: 'row', 
    marginTop: 24, 
    gap: 12 
  },
  cancelButton: { 
    flex: 1, 
    backgroundColor: '#e2e8f0', 
    paddingVertical: 12, 
    borderRadius: 8, 
    alignItems: 'center' 
  },
  cancelButtonText: { 
    color: '#64748b', 
    fontWeight: '600' 
  },
  saveButton: { 
    flex: 1, 
    backgroundColor: '#1e3a8a', 
    paddingVertical: 12, 
    borderRadius: 8, 
    alignItems: 'center' 
  },
  saveButtonText: { 
    color: '#fff', 
    fontWeight: '600' 
  },
});