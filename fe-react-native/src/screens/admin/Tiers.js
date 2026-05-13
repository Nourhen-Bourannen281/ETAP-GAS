// src/screens/admin/Tiers.js
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

export default function Tiers({ navigation }) {
  const [user, setUser] = useState(null);
  const [data, setData] = useState([]);
  const [pays, setPays] = useState([]);
  const [banques, setBanques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filterType, setFilterType] = useState('all');

  const [form, setForm] = useState({
    raisonSociale: '',
    type: '0',
    adresse: '',
    email: '',
    telephone: '',
    matriculeFiscale: '',
    pays: '',
    banque: '',
  });

  const IP = '192.168.1.114';
  const API_URL = `http://${IP}:5000/api`;

  useEffect(() => {
    loadUserData();
    fetchData();
    fetchPays();
    fetchBanques();
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
      const response = await axios.get(`${API_URL}/tiers`, {
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

  const fetchBanques = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_URL}/banques`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBanques(response.data);
    } catch (error) {
      console.error('Erreur banques:', error);
    }
  };

  const handleSave = async () => {
    if (!form.raisonSociale.trim()) {
      Alert.alert('Erreur', 'La raison sociale est obligatoire');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      const payload = {
        ...form,
        type: parseInt(form.type),
      };

      if (editingId) {
        await axios.put(`${API_URL}/tiers/${editingId}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        Alert.alert('Succès', 'Tiers modifié');
      } else {
        await axios.post(`${API_URL}/tiers`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        Alert.alert('Succès', 'Tiers ajouté');
      }

      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors de la sauvegarde');
    }
  };

  const resetForm = () => {
    setForm({
      raisonSociale: '',
      type: '0',
      adresse: '',
      email: '',
      telephone: '',
      matriculeFiscale: '',
      pays: '',
      banque: '',
    });
    setEditingId(null);
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    setForm({
      raisonSociale: item.raisonSociale,
      type: item.type.toString(),
      adresse: item.adresse || '',
      email: item.email || '',
      telephone: item.telephone || '',
      matriculeFiscale: item.matriculeFiscale || '',
      pays: item.pays?._id || item.pays || '',
      banque: item.banque?._id || item.banque || '',
    });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    Alert.alert(
      'Confirmation',
      'Supprimer ce tiers ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              await axios.delete(`${API_URL}/tiers/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              Alert.alert('Succès', 'Tiers supprimé');
              fetchData();
            } catch (error) {
              Alert.alert('Erreur', 'Erreur lors de la suppression');
            }
          },
        },
      ]
    );
  };

  const filteredData = () => {
    if (filterType === 'client') return data.filter(item => item.type === 0);
    if (filterType === 'fournisseur') return data.filter(item => item.type === 1);
    return data;
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const renderTierItem = ({ item }) => (
    <View style={styles.tierCard}>
      <View style={styles.tierHeader}>
        <View style={[styles.typeBadge, item.type === 0 ? styles.clientBadge : styles.fournisseurBadge]}>
          <Text style={styles.typeText}>{item.type === 0 ? 'Client' : 'Fournisseur'}</Text>
        </View>
        <Text style={styles.tierName}>{item.raisonSociale}</Text>
      </View>

      <View style={styles.tierDetails}>
        {item.email && <Text style={styles.detailText}>📧 {item.email}</Text>}
        {item.telephone && <Text style={styles.detailText}>📞 {item.telephone}</Text>}
        {item.matriculeFiscale && <Text style={styles.detailText}>🏷️ MF: {item.matriculeFiscale}</Text>}
        {item.pays?.nom && <Text style={styles.detailText}>🌍 {item.pays?.nom}</Text>}
        {item.banque?.nom && <Text style={styles.detailText}>🏦 {item.banque?.nom}</Text>}
      </View>

      {isAdmin && (
        <View style={styles.actionButtons}>
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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Tiers (Clients & Fournisseurs)</Text>
        {isAdmin && (
          <TouchableOpacity style={styles.addButton} onPress={() => {
            resetForm();
            setShowModal(true);
          }}>
            <Text style={styles.addButtonText}>+ Nouveau Tiers</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filters */}
      <View style={styles.filters}>
        <TouchableOpacity 
          style={[styles.filterButton, filterType === 'all' && styles.filterActive]} 
          onPress={() => setFilterType('all')}
        >
          <Text style={[styles.filterText, filterType === 'all' && styles.filterTextActive]}>Tous</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterButton, filterType === 'client' && styles.filterActive]} 
          onPress={() => setFilterType('client')}
        >
          <Text style={[styles.filterText, filterType === 'client' && styles.filterTextActive]}>Clients</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterButton, filterType === 'fournisseur' && styles.filterActive]} 
          onPress={() => setFilterType('fournisseur')}
        >
          <Text style={[styles.filterText, filterType === 'fournisseur' && styles.filterTextActive]}>Fournisseurs</Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      {filteredData().length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>👥</Text>
          <Text style={styles.emptyTitle}>Aucun tiers</Text>
        </View>
      ) : (
        <FlatList
          data={filteredData()}
          keyExtractor={(item) => item._id}
          renderItem={renderTierItem}
          scrollEnabled={false}
        />
      )}

      {/* Modal */}
      <Modal visible={showModal} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.modalTitle}>
              {editingId ? 'Modifier Tiers' : 'Nouveau Tiers'}
            </Text>

            <Text style={styles.modalLabel}>Type de tiers</Text>
            <Picker
              selectedValue={form.type}
              onValueChange={(val) => setForm({ ...form, type: val })}
              style={styles.picker}
            >
              <Picker.Item label="Client" value="0" />
              <Picker.Item label="Fournisseur" value="1" />
            </Picker>

            <Text style={styles.modalLabel}>Raison Sociale *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Raison Sociale"
              value={form.raisonSociale}
              onChangeText={(val) => setForm({ ...form, raisonSociale: val })}
            />

            <Text style={styles.modalLabel}>Email</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Email"
              value={form.email}
              onChangeText={(val) => setForm({ ...form, email: val })}
              keyboardType="email-address"
            />

            <Text style={styles.modalLabel}>Téléphone</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Téléphone"
              value={form.telephone}
              onChangeText={(val) => setForm({ ...form, telephone: val })}
              keyboardType="phone-pad"
            />

            <Text style={styles.modalLabel}>Adresse</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Adresse"
              value={form.adresse}
              onChangeText={(val) => setForm({ ...form, adresse: val })}
              multiline
            />

            <Text style={styles.modalLabel}>Matricule Fiscale</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Matricule Fiscale"
              value={form.matriculeFiscale}
              onChangeText={(val) => setForm({ ...form, matriculeFiscale: val })}
            />

            <Text style={styles.modalLabel}>Pays</Text>
            <Picker
              selectedValue={form.pays}
              onValueChange={(val) => setForm({ ...form, pays: val })}
              style={styles.picker}
            >
              <Picker.Item label="Sélectionner un pays" value="" />
              {pays.map(p => (
                <Picker.Item key={p._id} label={p.nom} value={p._id} />
              ))}
            </Picker>

            <Text style={styles.modalLabel}>Banque</Text>
            <Picker
              selectedValue={form.banque}
              onValueChange={(val) => setForm({ ...form, banque: val })}
              style={styles.picker}
            >
              <Picker.Item label="Sélectionner une banque" value="" />
              {banques.map(b => (
                <Picker.Item key={b._id} label={b.nom} value={b._id} />
              ))}
            </Picker>

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
  header: { backgroundColor: '#1e3a8a', padding: 24, paddingTop: 60, paddingBottom: 30, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#fff', flex: 1 },
  addButton: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  addButtonText: { color: '#fff', fontWeight: '600' },
  filters: { flexDirection: 'row', padding: 16, gap: 10 },
  filterButton: { flex: 1, paddingVertical: 10, backgroundColor: '#e2e8f0', borderRadius: 8, alignItems: 'center' },
  filterActive: { backgroundColor: '#1e3a8a' },
  filterText: { color: '#64748b', fontWeight: '500' },
  filterTextActive: { color: '#fff' },
  tierCard: { backgroundColor: '#fff', margin: 16, marginTop: 0, marginBottom: 12, padding: 16, borderRadius: 12, elevation: 2 },
  tierHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  typeBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginRight: 12 },
  clientBadge: { backgroundColor: '#dcfce7' },
  fournisseurBadge: { backgroundColor: '#fef3c7' },
  typeText: { fontSize: 12, fontWeight: '600' },
  tierName: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', flex: 1 },
  tierDetails: { marginBottom: 12 },
  detailText: { fontSize: 13, color: '#64748b', marginBottom: 4 },
  actionButtons: { flexDirection: 'row', gap: 10 },
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