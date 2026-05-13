// src/screens/Cabotage.jsx
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

export default function Cabotage() {
  const [cabotages, setCabotages] = useState([]);
  const [clients, setClients] = useState([]);
  const [produits, setProduits] = useState([]);
  const [transporteurs, setTransporteurs] = useState([]);
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
    typeOperation: 'Vente',
    pointDepart: '',
    pointArrivee: '',
    transporteur: '',
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
        fetchCabotages(storedToken);
        fetchClients(storedToken);
        fetchProduits(storedToken);
        fetchTransporteurs(storedToken);
      }
    } catch (error) {
      console.error('Erreur chargement données:', error);
    }
  };

  const fetchCabotages = async (authToken) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/cabotage`, {
        headers: { Authorization: `Bearer ${authToken || token}` }
      });
      setCabotages(response.data);
    } catch (error) {
      console.error('Erreur chargement cabotages:', error);
      Alert.alert('Erreur', 'Erreur lors du chargement des opérations');
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
      // Filtrer les produits de type pétrole brut
      const petroleBrut = response.data.filter(p => 
        p.nom?.toLowerCase().includes('pétrole') || 
        p.nom?.toLowerCase().includes('brut') ||
        p.nom?.toLowerCase().includes('petrole')
      );
      setProduits(petroleBrut.length > 0 ? petroleBrut : response.data);
    } catch (error) {
      console.error('Erreur chargement produits:', error);
    }
  };

  const fetchTransporteurs = async (authToken) => {
    try {
      const response = await axios.get(`${API_URL}/cabotage/transporteurs`, {
        headers: { Authorization: `Bearer ${authToken || token}` }
      });
      setTransporteurs(response.data);
    } catch (error) {
      console.error('Erreur chargement transporteurs:', error);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    if (token) {
      fetchCabotages(token);
    }
  };

  const handleSave = async () => {
    if (!form.client || !form.produit || !form.quantite || !form.prixUnitaire) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      if (editingId) {
        await axios.put(`${API_URL}/cabotage/${editingId}`, form, config);
        Alert.alert('Succès', 'Opération modifiée avec succès');
      } else {
        await axios.post(`${API_URL}/cabotage`, form, config);
        Alert.alert('Succès', 'Opération créée avec succès');
      }
      
      setShowModal(false);
      setEditingId(null);
      resetForm();
      fetchCabotages(token);
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
      typeOperation: 'Vente',
      pointDepart: '',
      pointArrivee: '',
      transporteur: '',
      dateLivraisonPrevue: '',
      commentaire: ''
    });
  };

  const updateStatut = async (id, statut, bonLivraison = '', bonPesee = '') => {
    try {
      setLoading(true);
      await axios.patch(`${API_URL}/cabotage/${id}/statut`, 
        { statut, numeroBonLivraison: bonLivraison, numeroBonPesee: bonPesee }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Succès', `Statut mis à jour: ${statut}`);
      fetchCabotages(token);
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, numero) => {
    Alert.alert(
      'Confirmation',
      `Supprimer l'opération ${numero} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${API_URL}/cabotage/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              Alert.alert('Succès', 'Opération supprimée');
              fetchCabotages(token);
            } catch (error) {
              Alert.alert('Erreur', 'Erreur lors de la suppression');
            }
          }
        }
      ]
    );
  };

  const handleEdit = (cabotage) => {
    setEditingId(cabotage._id);
    setForm({
      client: cabotage.client?._id || cabotage.client,
      produit: cabotage.produit?._id || cabotage.produit,
      quantite: cabotage.quantite.toString(),
      prixUnitaire: cabotage.prixUnitaire.toString(),
      devise: cabotage.devise,
      typeOperation: cabotage.typeOperation,
      pointDepart: cabotage.pointDepart || '',
      pointArrivee: cabotage.pointArrivee || '',
      transporteur: cabotage.transporteur?._id || cabotage.transporteur || '',
      dateLivraisonPrevue: cabotage.dateLivraisonPrevue?.split('T')[0] || '',
      commentaire: cabotage.commentaire || ''
    });
    setShowModal(true);
  };

  const promptForBonLivraison = (id) => {
    Alert.prompt(
      'Bon de livraison',
      'Entrez le numéro du bon de livraison:',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Suivant',
          onPress: (bonLivraison) => {
            Alert.prompt(
              'Bon de pesée',
              'Entrez le numéro du bon de pesée:',
              [
                { text: 'Annuler', style: 'cancel' },
                {
                  text: 'Valider',
                  onPress: (bonPesee) => {
                    updateStatut(id, 'Livrée', bonLivraison, bonPesee);
                  }
                }
              ]
            );
          }
        }
      ]
    );
  };

  const getStatutStyle = (statut) => {
    switch(statut) {
      case 'En attente': return styles.statutAttente;
      case 'Validée': return styles.statutValidee;
      case 'En transit': return styles.statutTransit;
      case 'Livrée': return styles.statutLivree;
      case 'Facturée': return styles.statutFacturee;
      default: return styles.statutDefault;
    }
  };

  const isCommercial = user?.role === 'Commercial';
  const isAdmin = user?.role === 'Admin';
  const canEdit = isCommercial || isAdmin;

  const filteredCabotages = cabotages.filter(c => {
    const clientNom = c.client?.raisonSociale || c.client?.nom || '';
    const matchSearch = c.numeroCabotage?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        clientNom.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatut = !selectedStatut || c.statut === selectedStatut;
    return matchSearch && matchStatut;
  });

  const stats = {
    total: cabotages.length,
    enAttente: cabotages.filter(c => c.statut === 'En attente').length,
    enTransit: cabotages.filter(c => c.statut === 'En transit').length,
    livrees: cabotages.filter(c => c.statut === 'Livrée').length,
    totalMontant: cabotages.reduce((sum, c) => sum + (c.montantTotal || 0), 0)
  };

  if (loading && !cabotages.length) {
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
        <Text style={styles.title}>🛢️ Cabotage - Pétrole Brut</Text>
        <Text style={styles.subtitle}>Production nationale - Livraison STIR</Text>
        <View style={styles.infoBanner}>
          <Text style={styles.infoText}>🛢️ Pétrole brut tunisien</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={[styles.statCard, styles.statWarning]}>
          <Text style={styles.statWarningValue}>{stats.enAttente}</Text>
          <Text style={styles.statLabel}>En attente</Text>
        </View>
        <View style={[styles.statCard, styles.statInfo]}>
          <Text style={styles.statInfoValue}>{stats.enTransit}</Text>
          <Text style={styles.statLabel}>En transit</Text>
        </View>
        <View style={[styles.statCard, styles.statSuccess]}>
          <Text style={styles.statSuccessValue}>{stats.livrees}</Text>
          <Text style={styles.statLabel}>Livrées</Text>
        </View>
        <View style={[styles.statCard, styles.statPrimary]}>
          <Text style={styles.statPrimaryValue}>{stats.totalMontant.toLocaleString()} TND</Text>
          <Text style={styles.statLabel}>Montant total</Text>
        </View>
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
            <Text style={styles.btnText}>+ Nouvelle Opération</Text>
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
          <TouchableOpacity style={[styles.filterBtn, selectedStatut === 'En transit' && styles.filterActive]} onPress={() => setSelectedStatut('En transit')}>
            <Text style={styles.filterText}>🚚 Transit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.filterBtn, selectedStatut === 'Livrée' && styles.filterActive]} onPress={() => setSelectedStatut('Livrée')}>
            <Text style={styles.filterText}>📦 Livrée</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Liste */}
      {filteredCabotages.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🛢️</Text>
          <Text style={styles.emptyTitle}>Aucune opération de cabotage</Text>
        </View>
      ) : (
        filteredCabotages.map(cabotage => (
          <View key={cabotage._id} style={styles.cabotageCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cabotageNumber}>{cabotage.numeroCabotage}</Text>
              <View style={[styles.statusBadge, getStatutStyle(cabotage.statut)]}>
                <Text style={styles.statusText}>{cabotage.statut}</Text>
              </View>
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.infoText}><Text style={styles.infoLabel}>Client:</Text> {cabotage.client?.raisonSociale || cabotage.client?.nom}</Text>
              <Text style={styles.infoText}><Text style={styles.infoLabel}>Produit:</Text> {cabotage.produit?.nom}</Text>
              <Text style={styles.infoText}><Text style={styles.infoLabel}>Quantité:</Text> {cabotage.quantite} {cabotage.produit?.uniteMesure || 'bl'}</Text>
              <Text style={styles.infoText}><Text style={styles.infoLabel}>Montant:</Text> {cabotage.montantTotal?.toLocaleString()} {cabotage.devise}</Text>
              <Text style={styles.infoText}><Text style={styles.infoLabel}>Type:</Text> {cabotage.typeOperation}</Text>
              {cabotage.pointDepart && <Text style={styles.infoText}><Text style={styles.infoLabel}>Départ:</Text> {cabotage.pointDepart}</Text>}
              {cabotage.pointArrivee && <Text style={styles.infoText}><Text style={styles.infoLabel}>Arrivée:</Text> {cabotage.pointArrivee}</Text>}
              {cabotage.transporteur && <Text style={styles.infoText}><Text style={styles.infoLabel}>Transporteur:</Text> {cabotage.transporteur?.nom} {cabotage.transporteur?.prenom}</Text>}
              <Text style={styles.infoText}><Text style={styles.infoLabel}>Date:</Text> {new Date(cabotage.dateOperation).toLocaleDateString()}</Text>
            </View>
            <View style={styles.cardActions}>
              {canEdit && cabotage.statut !== 'Facturée' && cabotage.statut !== 'Livrée' && (
                <TouchableOpacity style={styles.btnEdit} onPress={() => handleEdit(cabotage)}>
                  <Text style={styles.btnActionText}>✏️ Modifier</Text>
                </TouchableOpacity>
              )}
              {cabotage.statut === 'En attente' && canEdit && (
                <TouchableOpacity style={styles.btnValidate} onPress={() => updateStatut(cabotage._id, 'Validée')}>
                  <Text style={styles.btnActionText}>✅ Valider</Text>
                </TouchableOpacity>
              )}
              {cabotage.statut === 'Validée' && canEdit && (
                <TouchableOpacity style={styles.btnTransit} onPress={() => updateStatut(cabotage._id, 'En transit')}>
                  <Text style={styles.btnActionText}>🚚 En transit</Text>
                </TouchableOpacity>
              )}
              {cabotage.statut === 'En transit' && canEdit && (
                <TouchableOpacity style={styles.btnDelivered} onPress={() => promptForBonLivraison(cabotage._id)}>
                  <Text style={styles.btnActionText}>📦 Livrée</Text>
                </TouchableOpacity>
              )}
              {isAdmin && cabotage.statut !== 'Facturée' && (
                <TouchableOpacity style={styles.btnDelete} onPress={() => handleDelete(cabotage._id, cabotage.numeroCabotage)}>
                  <Text style={styles.btnActionText}>🗑️ Supprimer</Text>
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
            <Text style={styles.modalTitle}>{editingId ? 'Modifier l\'opération' : 'Nouvelle opération de cabotage'}</Text>
            
            <TextInput style={styles.input} placeholder="Client (STIR)" value={form.client} onChangeText={text => setForm({...form, client: text})} />
            <TextInput style={styles.input} placeholder="Produit (Pétrole Brut)" value={form.produit} onChangeText={text => setForm({...form, produit: text})} />
            <TextInput style={styles.input} placeholder="Quantité (Barils)" keyboardType="numeric" value={form.quantite} onChangeText={text => setForm({...form, quantite: text})} />
            <TextInput style={styles.input} placeholder="Prix unitaire (TND/bl)" keyboardType="numeric" value={form.prixUnitaire} onChangeText={text => setForm({...form, prixUnitaire: text})} />
            
            <View style={styles.rowInputs}>
              <TextInput style={[styles.input, styles.halfInput]} placeholder="Point départ" value={form.pointDepart} onChangeText={text => setForm({...form, pointDepart: text})} />
              <TextInput style={[styles.input, styles.halfInput]} placeholder="Point arrivée" value={form.pointArrivee} onChangeText={text => setForm({...form, pointArrivee: text})} />
            </View>
            
            <TextInput style={styles.input} placeholder="Commentaire" value={form.commentaire} onChangeText={text => setForm({...form, commentaire: text})} />
            
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
  statInfo: { backgroundColor: '#e0e7ff' },
  statInfoValue: { fontSize: 20, fontWeight: 'bold', color: '#3730a3' },
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
  
  cabotageCard: { backgroundColor: '#fff', margin: 12, marginTop: 0, marginBottom: 12, padding: 16, borderRadius: 12, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#eef2ff' },
  cabotageNumber: { fontSize: 16, fontWeight: 'bold', color: '#1e3a8a' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statutAttente: { backgroundColor: '#fef3c7' },
  statutValidee: { backgroundColor: '#dbeafe' },
  statutTransit: { backgroundColor: '#e0e7ff' },
  statutLivree: { backgroundColor: '#d1fae5' },
  statutFacturee: { backgroundColor: '#dcfce7' },
  statutDefault: { backgroundColor: '#f1f5f9' },
  statusText: { fontSize: 11, fontWeight: '500' },
  cardBody: { gap: 6 },
  infoText: { fontSize: 13, color: '#64748b' },
  infoLabel: { fontWeight: '600', color: '#1e293b' },
  cardActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#eef2ff' },
  btnEdit: { backgroundColor: '#3b82f6', padding: 8, borderRadius: 8, flex: 1, alignItems: 'center' },
  btnValidate: { backgroundColor: '#10b981', padding: 8, borderRadius: 8, flex: 1, alignItems: 'center' },
  btnTransit: { backgroundColor: '#f59e0b', padding: 8, borderRadius: 8, flex: 1, alignItems: 'center' },
  btnDelivered: { backgroundColor: '#8b5cf6', padding: 8, borderRadius: 8, flex: 1, alignItems: 'center' },
  btnDelete: { backgroundColor: '#ef4444', padding: 8, borderRadius: 8, flex: 1, alignItems: 'center' },
  btnActionText: { color: '#fff', fontSize: 12, fontWeight: '500' },
  
  emptyState: { alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#64748b' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 20, width: '90%', maxHeight: '80%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 10, marginBottom: 12 },
  rowInputs: { flexDirection: 'row', gap: 10 },
  halfInput: { flex: 1 },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 12 },
  btnCancel: { padding: 10, borderRadius: 8, backgroundColor: '#e2e8f0', flex: 1, alignItems: 'center' },
  btnSave: { padding: 10, borderRadius: 8, backgroundColor: '#3b82f6', flex: 1, alignItems: 'center' },
  btnSaveText: { color: '#fff', fontWeight: '500' },
});