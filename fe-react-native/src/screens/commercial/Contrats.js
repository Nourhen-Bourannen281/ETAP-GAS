// src/screens/commercial/Contrats.js
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
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Picker } from '@react-native-picker/picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export default function Contrats({ navigation }) {
  const [user, setUser] = useState(null);
  const [data, setData] = useState([]);
  const [tiers, setTiers] = useState([]);
  const [sousProduits, setSousProduits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatut, setSelectedStatut] = useState('');

  const [form, setForm] = useState({
    numeroContrat: '',
    type: 'Vente',
    dateDebut: new Date().toISOString().split('T')[0],
    dateFin: '',
    tiers: '',
    produits: [{ sousProduit: '', quantite: '1', prixUnitaire: '' }],
    devise: 'TND',
    statut: 'En cours',
  });

  const IP = '192.168.1.114';
  const API_URL = `http://${IP}:5000/api`;

  useEffect(() => {
    loadUserData();
    fetchData();
    fetchTiers();
    if (canCreate) {
      fetchSousProduits();
    }
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
  const isCommercial = user?.role === 'Commercial';
  const isClient = user?.role === 'Client';
  const isFournisseur = user?.role === 'Fournisseur';

  const canEdit = isCommercial;
  const canCreate = isCommercial;
  const canDelete = isCommercial;
  const canValidate = isCommercial;

  const fetchData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_URL}/contrats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(response.data);
    } catch (error) {
      console.error('Erreur:', error);
      Alert.alert('Erreur', 'Erreur lors du chargement des contrats');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchTiers = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_URL}/tiers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTiers(response.data);
    } catch (error) {
      console.error('Erreur tiers:', error);
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

  const handleAddProductLine = () => {
    setForm({
      ...form,
      produits: [...form.produits, { sousProduit: '', quantite: '1', prixUnitaire: '' }]
    });
  };

  const handleRemoveProductLine = (index) => {
    const newProduits = form.produits.filter((_, i) => i !== index);
    setForm({ ...form, produits: newProduits });
  };

  const handleProductChange = (index, field, value) => {
    const newProduits = [...form.produits];
    newProduits[index][field] = value;

    if (field === 'sousProduit' && value) {
      const selectedProduct = sousProduits.find(sp => sp._id === value);
      if (selectedProduct && selectedProduct.prixUnitaire) {
        newProduits[index].prixUnitaire = selectedProduct.prixUnitaire.toString();
      }
    }

    setForm({ ...form, produits: newProduits });
  };

  const calculateTotal = () => {
    return form.produits.reduce((total, item) => {
      return total + (parseFloat(item.quantite) || 0) * (parseFloat(item.prixUnitaire) || 0);
    }, 0);
  };

  const handleSave = async () => {
    if (!form.numeroContrat.trim()) {
      Alert.alert('Erreur', 'Le numéro de contrat est requis');
      return;
    }
    if (!form.tiers) {
      Alert.alert('Erreur', 'Veuillez sélectionner un tiers');
      return;
    }
    if (form.produits.length === 0 || !form.produits[0].sousProduit) {
      Alert.alert('Erreur', 'Veuillez ajouter au moins un produit');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      const contratData = { ...form, produits: form.produits.map(p => ({ ...p, quantite: parseFloat(p.quantite), prixUnitaire: parseFloat(p.prixUnitaire) })) };

      if (editingId) {
        await axios.put(`${API_URL}/contrats/${editingId}`, contratData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        Alert.alert('Succès', 'Contrat modifié');
      } else {
        await axios.post(`${API_URL}/contrats`, contratData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        Alert.alert('Succès', 'Contrat créé');
      }

      setShowModal(false);
      setEditingId(null);
      resetForm();
      fetchData();
    } catch (error) {
      Alert.alert('Erreur', error.response?.data?.message || 'Erreur lors de la sauvegarde');
    }
  };

  const resetForm = () => {
    setForm({
      numeroContrat: '',
      type: 'Vente',
      dateDebut: new Date().toISOString().split('T')[0],
      dateFin: '',
      tiers: '',
      produits: [{ sousProduit: '', quantite: '1', prixUnitaire: '' }],
      devise: 'TND',
      statut: 'En cours'
    });
  };

  const handleEdit = (item) => {
    if (!canEdit) {
      Alert.alert('Erreur', 'Seuls les commerciaux peuvent modifier les contrats');
      return;
    }
    setEditingId(item._id);
    setForm({
      numeroContrat: item.numeroContrat,
      type: item.type,
      dateDebut: item.dateDebut?.split('T')[0] || '',
      dateFin: item.dateFin?.split('T')[0] || '',
      tiers: item.tiers?._id || item.tiers,
      produits: item.produits.map(p => ({
        sousProduit: p.sousProduit?._id || p.sousProduit,
        quantite: p.quantite.toString(),
        prixUnitaire: p.prixUnitaire.toString()
      })),
      devise: item.devise,
      statut: item.statut
    });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (!canDelete) {
      Alert.alert('Erreur', 'Seuls les commerciaux peuvent supprimer les contrats');
      return;
    }
    Alert.alert(
      'Confirmation',
      'Supprimer ce contrat ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              await axios.delete(`${API_URL}/contrats/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              Alert.alert('Succès', 'Contrat supprimé');
              fetchData();
            } catch (error) {
              Alert.alert('Erreur', 'Erreur lors de la suppression');
            }
          },
        },
      ]
    );
  };

  const validerContrat = async (id, numeroContrat) => {
    if (!canValidate) {
      Alert.alert('Erreur', 'Seuls les commerciaux peuvent valider les contrats');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      await axios.patch(`${API_URL}/contrats/${id}/valider`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Alert.alert('Succès', `Contrat ${numeroContrat} validé`);
      fetchData();
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors de la validation');
    }
  };

  const exportContratPDF = async (contratId, numeroContrat) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_URL}/contrats/${contratId}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result.split(',')[1];
        const fileUri = FileSystem.documentDirectory + `contrat_${numeroContrat}.pdf`;
        await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: FileSystem.EncodingType.Base64 });
        
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri);
        } else {
          Alert.alert('Info', 'Le partage n\'est pas disponible sur cet appareil');
        }
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors du téléchargement du PDF');
    }
  };

  const getStatutColor = (statut) => {
    switch (statut) {
      case 'En cours': return styles.statutEnCours;
      case 'Validé': return styles.statutValide;
      case 'Terminé': return styles.statutTermine;
      case 'Renouvelé': return styles.statutRenouvele;
      default: return styles.statutDefaut;
    }
  };

  const getStatutIcon = (statut) => {
    switch (statut) {
      case 'En cours': return '⏳';
      case 'Validé': return '✅';
      case 'Terminé': return '🏁';
      case 'Renouvelé': return '🔄';
      default: return '📄';
    }
  };

  const getTypeIcon = (type) => type === 'Vente' ? '📝' : '💰';

  const filteredData = data.filter(item => {
    const matchesSearch = item.numeroContrat?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tiers?.raisonSociale?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatut = !selectedStatut || item.statut === selectedStatut;
    return matchesSearch && matchesStatut;
  });

  const totalContrats = data.length;
  const contratsEnCours = data.filter(item => item.statut === 'En cours').length;
  const contratsValides = data.filter(item => item.statut === 'Validé').length;
  const montantTotal = data.reduce((total, item) => total + (item.montantTotal || 0), 0);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const renderContratItem = ({ item }) => (
    <View style={styles.contratCard}>
      <View style={styles.cardHeader}>
        <View style={styles.contratNumber}>
          <Text style={styles.typeIcon}>{getTypeIcon(item.type)}</Text>
          <Text style={styles.contratNum}>{item.numeroContrat}</Text>
        </View>
        <View style={[styles.statusBadge, getStatutColor(item.statut)]}>
          <Text style={styles.statusText}>{getStatutIcon(item.statut)} {item.statut}</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.infoText}><Text style={styles.infoLabel}>Tiers:</Text> {item.tiers?.raisonSociale || '-'}</Text>
        <Text style={styles.infoText}><Text style={styles.infoLabel}>Montant:</Text> {item.montantTotal?.toLocaleString()} {item.devise}</Text>
        <Text style={styles.infoText}><Text style={styles.infoLabel}>Produits:</Text> {item.produits?.length || 0}</Text>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.pdfButton} onPress={() => exportContratPDF(item._id, item.numeroContrat)}>
          <Text style={styles.buttonText}>📄 PDF</Text>
        </TouchableOpacity>
        {canValidate && item.statut !== 'Validé' && (
          <TouchableOpacity style={styles.validerButton} onPress={() => validerContrat(item._id, item.numeroContrat)}>
            <Text style={styles.buttonText}>✅ Valider</Text>
          </TouchableOpacity>
        )}
        {canEdit && item.statut !== 'Validé' && (
          <>
            <TouchableOpacity style={styles.editButton} onPress={() => handleEdit(item)}>
              <Text style={styles.buttonText}>✏️</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item._id)}>
              <Text style={styles.buttonText}>🗑️</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1e3a8a" />
        <Text style={styles.loadingText}>Chargement...</Text>
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
        <View>
          <Text style={styles.title}>Contrats</Text>
          <Text style={styles.subtitle}>Gérez vos contrats de vente et d'achat</Text>
          <View style={styles.roleBadgeContainer}>
            {isAdmin && <Text style={[styles.roleBadge, styles.adminBadge]}>👑 Admin (Lecture seule)</Text>}
            {isCommercial && <Text style={[styles.roleBadge, styles.commercialBadge]}>💼 Commercial (CRUD complet)</Text>}
            {(isClient || isFournisseur) && (
              <Text style={[styles.roleBadge, styles.clientBadge]}>👤 {isClient ? 'Client' : 'Fournisseur'} (Consultation)</Text>
            )}
          </View>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{totalContrats}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={[styles.statCard, styles.warningCard]}>
          <Text style={[styles.statValue, styles.warningValue]}>{contratsEnCours}</Text>
          <Text style={styles.statLabel}>En cours</Text>
        </View>
        <View style={[styles.statCard, styles.successCard]}>
          <Text style={[styles.statValue, styles.successValue]}>{contratsValides}</Text>
          <Text style={styles.statLabel}>Validés</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{montantTotal.toLocaleString()} TND</Text>
          <Text style={styles.statLabel}>Montant total</Text>
        </View>
      </View>

      {/* Buttons */}
      <View style={styles.buttonContainer}>
        {canCreate && (
          <TouchableOpacity style={styles.newButton} onPress={() => { resetForm(); setShowModal(true); }}>
            <Text style={styles.newButtonText}>+ Nouveau Contrat</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Search & Filters */}
      <View style={styles.filtersContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Rechercher..."
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <TouchableOpacity style={[styles.filterButton, !selectedStatut && styles.filterActive]} onPress={() => setSelectedStatut('')}>
            <Text style={[styles.filterText, !selectedStatut && styles.filterTextActive]}>Tous</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.filterButton, selectedStatut === 'En cours' && styles.filterActive]} onPress={() => setSelectedStatut('En cours')}>
            <Text style={[styles.filterText, selectedStatut === 'En cours' && styles.filterTextActive]}>⏳ En cours</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.filterButton, selectedStatut === 'Validé' && styles.filterActive]} onPress={() => setSelectedStatut('Validé')}>
            <Text style={[styles.filterText, selectedStatut === 'Validé' && styles.filterTextActive]}>✅ Validés</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Contracts List */}
      {filteredData.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📄</Text>
          <Text style={styles.emptyTitle}>Aucun contrat</Text>
          {canCreate && (
            <TouchableOpacity style={styles.addFirstButton} onPress={() => { resetForm(); setShowModal(true); }}>
              <Text style={styles.addFirstButtonText}>+ Créer un contrat</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredData}
          keyExtractor={(item) => item._id}
          renderItem={renderContratItem}
          scrollEnabled={false}
        />
      )}

      {/* Modal */}
      <Modal visible={showModal} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.modalTitle}>{editingId ? 'Modifier Contrat' : 'Nouveau Contrat'}</Text>

            <Text style={styles.modalLabel}>Numéro contrat *</Text>
            <TextInput style={styles.modalInput} placeholder="Numéro contrat" value={form.numeroContrat} onChangeText={(val) => setForm({ ...form, numeroContrat: val })} />

            <Text style={styles.modalLabel}>Type</Text>
            <Picker selectedValue={form.type} onValueChange={(val) => setForm({ ...form, type: val })} style={styles.picker}>
              <Picker.Item label="Vente" value="Vente" />
              <Picker.Item label="Achat" value="Achat" />
            </Picker>

            <Text style={styles.modalLabel}>Tiers</Text>
            <Picker selectedValue={form.tiers} onValueChange={(val) => setForm({ ...form, tiers: val })} style={styles.picker}>
              <Picker.Item label="Sélectionner un tiers" value="" />
              {tiers.map(t => <Picker.Item key={t._id} label={t.raisonSociale} value={t._id} />)}
            </Picker>

            <Text style={styles.modalLabel}>Produits</Text>
            {form.produits.map((prod, idx) => (
              <View key={idx} style={styles.productLine}>
                <Picker selectedValue={prod.sousProduit} onValueChange={(val) => handleProductChange(idx, 'sousProduit', val)} style={styles.productPicker}>
                  <Picker.Item label="Sélectionner" value="" />
                  {sousProduits.map(sp => <Picker.Item key={sp._id} label={sp.nom} value={sp._id} />)}
                </Picker>
                <TextInput style={styles.productInput} placeholder="Qté" value={prod.quantite} onChangeText={(val) => handleProductChange(idx, 'quantite', val)} keyboardType="numeric" />
                <TextInput style={styles.productInput} placeholder="Prix" value={prod.prixUnitaire} onChangeText={(val) => handleProductChange(idx, 'prixUnitaire', val)} keyboardType="numeric" />
                {form.produits.length > 1 && (
                  <TouchableOpacity style={styles.removeButton} onPress={() => handleRemoveProductLine(idx)}>
                    <Text style={styles.removeButtonText}>🗑️</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
            <TouchableOpacity style={styles.addProductButton} onPress={handleAddProductLine}>
              <Text style={styles.addProductButtonText}>+ Ajouter</Text>
            </TouchableOpacity>

            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalValue}>{calculateTotal().toLocaleString()} {form.devise}</Text>
            </View>

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
  loadingText: { marginTop: 10, color: '#64748b' },
  
  // Header
  header: { backgroundColor: '#1e3a8a', padding: 24, paddingTop: 60, paddingBottom: 30 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', fontFamily: 'Georgia' },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  roleBadgeContainer: { flexDirection: 'row', marginTop: 8, flexWrap: 'wrap', gap: 6 },
  roleBadge: { fontSize: 11, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, overflow: 'hidden' },
  adminBadge: { backgroundColor: '#eef2ff', color: '#3730a3' },
  commercialBadge: { backgroundColor: '#ecfeff', color: '#0e7490' },
  clientBadge: { backgroundColor: '#fef9c3', color: '#854d0e' },
  
  // Stats
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, marginTop: -20, flexWrap: 'wrap' },
  statCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, alignItems: 'center', flex: 1, marginHorizontal: 4, elevation: 3 },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#1e3a8a' },
  statLabel: { fontSize: 11, color: '#64748b', marginTop: 2 },
  warningCard: { backgroundColor: '#fef3c7' },
  successCard: { backgroundColor: '#dcfce7' },
  warningValue: { color: '#f59e0b' },
  successValue: { color: '#16a34a' },
  
  // Buttons
  buttonContainer: { paddingHorizontal: 16, marginBottom: 16 },
  newButton: { backgroundColor: '#1e3a8a', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  newButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  
  // Filters
  filtersContainer: { paddingHorizontal: 16, marginBottom: 16 },
  searchInput: { backgroundColor: '#fff', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 12 },
  filterScroll: { flexDirection: 'row' },
  filterButton: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#e2e8f0', borderRadius: 20, marginRight: 8 },
  filterActive: { backgroundColor: '#1e3a8a' },
  filterText: { fontSize: 13, color: '#64748b' },
  filterTextActive: { color: '#fff' },
  
  // Contract Card
  contratCard: { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 12, borderRadius: 12, elevation: 2, overflow: 'hidden' },
  cardHeader: { padding: 14, borderBottomWidth: 1, borderBottomColor: '#e5e7eb', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  contratNumber: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  typeIcon: { fontSize: 16 },
  contratNum: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '500' },
  statutEnCours: { backgroundColor: '#fef3c7' },
  statutValide: { backgroundColor: '#dcfce7' },
  statutTermine: { backgroundColor: '#dcfce7' },
  statutRenouvele: { backgroundColor: '#e0f2fe' },
  statutDefaut: { backgroundColor: '#e5e7eb' },
  cardBody: { padding: 14 },
  infoText: { fontSize: 13, color: '#64748b', marginBottom: 4 },
  infoLabel: { fontWeight: '600', color: '#0f172a' },
  cardActions: { padding: 12, borderTopWidth: 1, borderTopColor: '#e5e7eb', flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  pdfButton: { backgroundColor: '#e0f2fe', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  validerButton: { backgroundColor: '#dcfce7', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  editButton: { backgroundColor: '#dbeafe', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  deleteButton: { backgroundColor: '#fee2e2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  buttonText: { fontSize: 12, fontWeight: '500' },
  
  // Empty State
  emptyState: { alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#64748b', marginBottom: 16 },
  addFirstButton: { backgroundColor: '#1e3a8a', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 25 },
  addFirstButtonText: { color: '#fff', fontWeight: '600' },
  
  // Modal
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 20, padding: 20, maxHeight: '80%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  modalLabel: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 6, marginTop: 12 },
  modalInput: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 12, fontSize: 14 },
  picker: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, marginBottom: 8 },
  productLine: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' },
  productPicker: { flex: 2, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, height: 50 },
  productInput: { flex: 1, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 12, fontSize: 14 },
  removeButton: { backgroundColor: '#fee2e2', padding: 8, borderRadius: 8 },
  removeButtonText: { fontSize: 16 },
  addProductButton: { backgroundColor: '#e0f2fe', padding: 10, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  addProductButtonText: { color: '#1e3a8a', fontWeight: '600' },
  totalContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  totalLabel: { fontSize: 16, fontWeight: 'bold' },
  totalValue: { fontSize: 16, fontWeight: 'bold', color: '#1e3a8a' },
  modalButtons: { flexDirection: 'row', marginTop: 20, gap: 12 },
  cancelButton: { flex: 1, backgroundColor: '#e2e8f0', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  cancelButtonText: { color: '#64748b', fontWeight: '600' },
  saveButton: { flex: 1, backgroundColor: '#1e3a8a', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontWeight: '600' },
});