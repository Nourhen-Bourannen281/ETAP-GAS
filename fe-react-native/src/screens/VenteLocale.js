// src/screens/VenteLocale.jsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

export default function VenteLocale() {
  const [ventes, setVentes] = useState([]);
  const [clients, setClients] = useState([]);
  const [produits, setProduits] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatut, setSelectedStatut] = useState('');
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);

  const [form, setForm] = useState({
    client: '',
    produit: '',
    quantite: '',
    prixUnitaire: '',
    devise: 'TND',
    dateLivraisonPrevue: '',
    commentaire: ''
  });

  const IP = '192.168.1.114';
  const API_URL = `http://${IP}:5000/api`;

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      const userData = await AsyncStorage.getItem('user');
      
      if (storedToken) setToken(storedToken);
      if (userData) setUser(JSON.parse(userData));
      
      if (storedToken) {
        fetchVentes(storedToken);
        fetchClients(storedToken);
        fetchProduits(storedToken);
      }
    } catch (error) {
      console.error('Erreur chargement données:', error);
    }
  };

  const fetchVentes = async (authToken) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/ventes-locales`, {
        headers: { Authorization: `Bearer ${authToken || token}` }
      });
      setVentes(response.data);
    } catch (error) {
      console.error('Erreur chargement ventes:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchClients = async (authToken) => {
    try {
      const response = await axios.get(`${API_URL}/tiers?type=0`, {
        headers: { Authorization: `Bearer ${authToken || token}` }
      });
      setClients(response.data);
    } catch (error) {
      console.error('Erreur chargement clients:', error);
    }
  };

  const fetchProduits = async (authToken) => {
    try {
      const response = await axios.get(`${API_URL}/products`, {
        headers: { Authorization: `Bearer ${authToken || token}` }
      });
      setProduits(response.data);
    } catch (error) {
      console.error('Erreur chargement produits:', error);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    if (token) {
      fetchVentes(token);
    }
  };

  const handleSave = async () => {
    if (!form.client || !form.produit || !form.quantite || !form.prixUnitaire) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      if (editingId) {
        await axios.put(`${API_URL}/ventes-locales/${editingId}`, form, config);
        Alert.alert('Succès', 'Vente modifiée avec succès');
      } else {
        await axios.post(`${API_URL}/ventes-locales`, form, config);
        Alert.alert('Succès', 'Vente créée avec succès');
      }
      
      setShowModal(false);
      setEditingId(null);
      resetForm();
      fetchVentes(token);
    } catch (error) {
      Alert.alert('Erreur', error.response?.data?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      client: '',
      produit: '',
      quantite: '',
      prixUnitaire: '',
      devise: 'TND',
      dateLivraisonPrevue: '',
      commentaire: ''
    });
  };

  const updateStatut = async (id, statut) => {
    try {
      setLoading(true);
      await axios.patch(`${API_URL}/ventes-locales/${id}/statut`, { statut }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Alert.alert('Succès', `Statut mis à jour: ${statut}`);
      fetchVentes(token);
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, numero) => {
    Alert.alert(
      'Confirmation',
      `Supprimer la vente ${numero} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${API_URL}/ventes-locales/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              Alert.alert('Succès', 'Vente supprimée');
              fetchVentes(token);
            } catch (error) {
              Alert.alert('Erreur', 'Erreur lors de la suppression');
            }
          }
        }
      ]
    );
  };

  const getStatutStyle = (statut) => {
    switch(statut) {
      case 'En attente': return styles.statutAttente;
      case 'Validée': return styles.statutValidee;
      case 'En livraison': return styles.statutLivraison;
      case 'Livrée': return styles.statutLivree;
      default: return styles.statutDefault;
    }
  };

  const isCommercial = user?.role === 'Commercial';
  const isAdmin = user?.role === 'Admin';
  const canEdit = isCommercial || isAdmin;

  const filteredVentes = ventes.filter(v => {
    const clientNom = v.client?.raisonSociale || v.client?.nom || '';
    const matchSearch = v.numeroVente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        clientNom.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatut = !selectedStatut || v.statut === selectedStatut;
    return matchSearch && matchStatut;
  });

  const stats = {
    total: ventes.length,
    enAttente: ventes.filter(v => v.statut === 'En attente').length,
    livrees: ventes.filter(v => v.statut === 'Livrée').length,
    totalMontant: ventes.reduce((sum, v) => sum + (v.montantTotal || 0), 0)
  };

  if (loading && !ventes.length) {
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
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🏭 Ventes Locales - Gaz Naturel</Text>
        <Text style={styles.subtitle}>Production nationale - Livraison STEG</Text>
        <View style={styles.infoBanner}>
          <Text style={styles.infoText}>🌍 Gaz naturel tunisien</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}><Text style={styles.statValue}>{stats.total}</Text><Text style={styles.statLabel}>Total</Text></View>
        <View style={[styles.statCard, styles.statWarning]}><Text style={styles.statWarningValue}>{stats.enAttente}</Text><Text style={styles.statLabel}>Attente</Text></View>
        <View style={[styles.statCard, styles.statSuccess]}><Text style={styles.statSuccessValue}>{stats.livrees}</Text><Text style={styles.statLabel}>Livrées</Text></View>
        <View style={[styles.statCard, styles.statPrimary]}><Text style={styles.statPrimaryValue}>{stats.totalMontant.toLocaleString()} TND</Text><Text style={styles.statLabel}>Montant</Text></View>
      </View>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.btnExcel} onPress={() => {}}>
          <Text style={styles.btnText}>📊 Excel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnPdf} onPress={() => {}}>
          <Text style={styles.btnText}>📄 PDF</Text>
        </TouchableOpacity>
        {canEdit && (
          <TouchableOpacity style={styles.btnNew} onPress={() => { resetForm(); setShowModal(true); }}>
            <Text style={styles.btnText}>+ Nouvelle Vente</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filtres */}
      <View style={styles.filtersContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Rechercher..."
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statusFilter}>
          <TouchableOpacity style={[styles.filterBtn, !selectedStatut && styles.filterActive]} onPress={() => setSelectedStatut('')}>
            <Text style={styles.filterText}>Tous</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.filterBtn, selectedStatut === 'En attente' && styles.filterActive]} onPress={() => setSelectedStatut('En attente')}>
            <Text style={styles.filterText}>⏳ Attente</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.filterBtn, selectedStatut === 'Validée' && styles.filterActive]} onPress={() => setSelectedStatut('Validée')}>
            <Text style={styles.filterText}>✅ Validée</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.filterBtn, selectedStatut === 'Livrée' && styles.filterActive]} onPress={() => setSelectedStatut('Livrée')}>
            <Text style={styles.filterText}>📦 Livrée</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Liste */}
      {filteredVentes.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🏭</Text>
          <Text style={styles.emptyTitle}>Aucune vente locale</Text>
        </View>
      ) : (
        filteredVentes.map(vente => (
          <View key={vente._id} style={styles.venteCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.venteNumber}>{vente.numeroVente}</Text>
              <View style={[styles.statusBadge, getStatutStyle(vente.statut)]}>
                <Text style={styles.statusText}>{vente.statut}</Text>
              </View>
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.infoText}><Text style={styles.infoLabel}>Client:</Text> {vente.client?.raisonSociale || vente.client?.nom}</Text>
              <Text style={styles.infoText}><Text style={styles.infoLabel}>Produit:</Text> {vente.produit?.nom}</Text>
              <Text style={styles.infoText}><Text style={styles.infoLabel}>Quantité:</Text> {vente.quantite} {vente.produit?.uniteMesure || 'm³'}</Text>
              <Text style={styles.infoText}><Text style={styles.infoLabel}>Montant:</Text> {vente.montantTotal?.toLocaleString()} {vente.devise}</Text>
              <Text style={styles.infoText}><Text style={styles.infoLabel}>Date:</Text> {new Date(vente.dateVente).toLocaleDateString()}</Text>
            </View>
            <View style={styles.cardActions}>
              {vente.statut === 'En attente' && canEdit && (
                <TouchableOpacity style={styles.btnValidate} onPress={() => updateStatut(vente._id, 'Validée')}>
                  <Text style={styles.btnActionText}>✅ Valider</Text>
                </TouchableOpacity>
              )}
              {vente.statut === 'Validée' && canEdit && (
                <TouchableOpacity style={styles.btnShipping} onPress={() => updateStatut(vente._id, 'En livraison')}>
                  <Text style={styles.btnActionText}>🚚 Livraison</Text>
                </TouchableOpacity>
              )}
              {vente.statut === 'En livraison' && canEdit && (
                <TouchableOpacity style={styles.btnDelivered} onPress={() => updateStatut(vente._id, 'Livrée')}>
                  <Text style={styles.btnActionText}>📦 Livrée</Text>
                </TouchableOpacity>
              )}
              {isAdmin && vente.statut !== 'Facturée' && (
                <TouchableOpacity style={styles.btnDelete} onPress={() => handleDelete(vente._id, vente.numeroVente)}>
                  <Text style={styles.btnActionText}>🗑️</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))
      )}

      {/* Modal */}
      <Modal visible={showModal} animationType="slide" transparent onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingId ? 'Modifier la vente' : 'Nouvelle vente'}</Text>
            
            <TextInput style={styles.input} placeholder="Client" value={form.client} onChangeText={text => setForm({...form, client: text})} />
            <TextInput style={styles.input} placeholder="Produit" value={form.produit} onChangeText={text => setForm({...form, produit: text})} />
            <TextInput style={styles.input} placeholder="Quantité" keyboardType="numeric" value={form.quantite} onChangeText={text => setForm({...form, quantite: text})} />
            <TextInput style={styles.input} placeholder="Prix unitaire" keyboardType="numeric" value={form.prixUnitaire} onChangeText={text => setForm({...form, prixUnitaire: text})} />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.btnCancel} onPress={() => setShowModal(false)}>
                <Text>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnSave} onPress={handleSave}>
                <Text style={styles.btnSaveText}>Enregistrer</Text>
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
  loadingText: { marginTop: 10, color: '#64748b' },
  
  header: { backgroundColor: '#1e3a8a', padding: 20, paddingTop: 60 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  infoBanner: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: 12, marginTop: 12, alignSelf: 'flex-start' },
  infoText: { color: '#fff', fontSize: 12 },
  
  statsContainer: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, marginTop: -10 },
  statCard: { backgroundColor: '#fff', borderRadius: 12, padding: 12, width: '48%', margin: '1%', alignItems: 'center', elevation: 2 },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#1e3a8a' },
  statLabel: { fontSize: 11, color: '#64748b', marginTop: 4 },
  statWarning: { backgroundColor: '#fef3c7' },
  statWarningValue: { fontSize: 20, fontWeight: 'bold', color: '#d97706' },
  statSuccess: { backgroundColor: '#d1fae5' },
  statSuccessValue: { fontSize: 20, fontWeight: 'bold', color: '#059669' },
  statPrimary: { backgroundColor: '#dbeafe' },
  statPrimaryValue: { fontSize: 20, fontWeight: 'bold', color: '#1e3a8a' },
  
  actionsContainer: { flexDirection: 'row', gap: 10, padding: 12 },
  btnExcel: { backgroundColor: '#10b981', padding: 10, borderRadius: 8, flex: 1, alignItems: 'center' },
  btnPdf: { backgroundColor: '#ef4444', padding: 10, borderRadius: 8, flex: 1, alignItems: 'center' },
  btnNew: { backgroundColor: '#3b82f6', padding: 10, borderRadius: 8, flex: 1, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '500' },
  
  filtersContainer: { padding: 12 },
  searchInput: { backgroundColor: '#fff', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 10 },
  statusFilter: { flexDirection: 'row' },
  filterBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#fff', marginRight: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  filterActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  filterText: { fontSize: 12 },
  
  venteCard: { backgroundColor: '#fff', margin: 12, marginTop: 0, marginBottom: 12, padding: 16, borderRadius: 12, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#eef2ff' },
  venteNumber: { fontSize: 16, fontWeight: 'bold', color: '#1e3a8a' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statutAttente: { backgroundColor: '#fef3c7' },
  statutValidee: { backgroundColor: '#dbeafe' },
  statutLivraison: { backgroundColor: '#e0e7ff' },
  statutLivree: { backgroundColor: '#d1fae5' },
  statutDefault: { backgroundColor: '#f1f5f9' },
  statusText: { fontSize: 11, fontWeight: '500' },
  cardBody: { gap: 6 },
  infoText: { fontSize: 13, color: '#64748b' },
  infoLabel: { fontWeight: '600', color: '#1e293b' },
  cardActions: { flexDirection: 'row', gap: 10, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#eef2ff' },
  btnValidate: { backgroundColor: '#10b981', padding: 8, borderRadius: 8, flex: 1, alignItems: 'center' },
  btnShipping: { backgroundColor: '#f59e0b', padding: 8, borderRadius: 8, flex: 1, alignItems: 'center' },
  btnDelivered: { backgroundColor: '#8b5cf6', padding: 8, borderRadius: 8, flex: 1, alignItems: 'center' },
  btnDelete: { backgroundColor: '#ef4444', padding: 8, borderRadius: 8, width: 40, alignItems: 'center' },
  btnActionText: { color: '#fff', fontSize: 12, fontWeight: '500' },
  
  emptyState: { alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#64748b' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 20, width: '90%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 10, marginBottom: 12 },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 12 },
  btnCancel: { padding: 10, borderRadius: 8, backgroundColor: '#e2e8f0', flex: 1, alignItems: 'center' },
  btnSave: { padding: 10, borderRadius: 8, backgroundColor: '#3b82f6', flex: 1, alignItems: 'center' },
  btnSaveText: { color: '#fff', fontWeight: '500' },
});