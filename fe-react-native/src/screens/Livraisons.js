// src/screens/commercial/Livraisons.js
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

export default function Livraisons({ navigation }) {
  const [user, setUser] = useState(null);
  const [livraisons, setLivraisons] = useState([]);
  const [commandes, setCommandes] = useState([]);
  const [transporteurs, setTransporteurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedCommande, setSelectedCommande] = useState(null);
  const [selectedLivraison, setSelectedLivraison] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEtat, setSelectedEtat] = useState('');

  const IP = '192.168.1.114';
  const API_URL = `http://${IP}:5000/api`;

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
        fetchLivraisons(JSON.parse(userData));
        if (isCommercial) {
          fetchCommandesValidees();
          fetchTransporteurs();
        }
        if (isAdmin) {
          fetchTransporteurs();
        }
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const isAdmin = user?.role === 'Admin';
  const isCommercial = user?.role === 'Commercial';

  const fetchLivraisons = async (userData) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get(`${API_URL}/livraisons`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLivraisons(res.data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchCommandesValidees = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get(`${API_URL}/commandes?statut=Validée`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCommandes(res.data);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const fetchTransporteurs = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get(`${API_URL}/users/transporteurs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTransporteurs(res.data);
    } catch (error) {
      console.error('Erreur:', error);
      setTransporteurs([]);
    }
  };

  const getTransporteurNom = (transporteur) => {
    if (!transporteur) return 'Non assigné';
    return transporteur.raisonSociale || transporteur.nom || transporteur.name || transporteur.email || 'Transporteur';
  };

  const createLivraison = async () => {
    if (!selectedCommande) {
      Alert.alert('Erreur', 'Veuillez sélectionner une commande');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      await axios.post(`${API_URL}/livraisons/from-commande/${selectedCommande._id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Alert.alert('Succès', '✅ Livraison créée avec succès !');
      setShowModal(false);
      setSelectedCommande(null);
      fetchLivraisons(user);
      fetchCommandesValidees();
    } catch (error) {
      Alert.alert('Erreur', error.response?.data?.message || '❌ Erreur lors de la création');
    }
  };

  const updateEtat = async (livraisonId, nouvelEtat) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.patch(`${API_URL}/livraisons/${livraisonId}/etat`, { etat: nouvelEtat }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      let message = '';
      switch (nouvelEtat) {
        case 'Prête': message = '✅ Livraison marquée comme prête'; break;
        case 'En cours': message = '🚚 Livraison en cours'; break;
        case 'Livrée': message = '📦 Livraison marquée comme livrée'; break;
        case 'Annulée': message = '❌ Livraison annulée'; break;
        default: message = `État mis à jour: ${nouvelEtat}`;
      }
      Alert.alert('Succès', message);
      fetchLivraisons(user);
    } catch (error) {
      Alert.alert('Erreur', error.response?.data?.message || 'Erreur lors de la mise à jour');
    }
  };

  const downloadBonLivraison = async (livraisonId, numeroLivraison) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_URL}/livraisons/${livraisonId}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result.split(',')[1];
        const fileUri = FileSystem.documentDirectory + `bon_livraison_${numeroLivraison}.pdf`;
        await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: FileSystem.EncodingType.Base64 });

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri);
        }
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      Alert.alert('Erreur', '❌ Erreur lors du téléchargement');
    }
  };

  const assignTransporteur = async (livraisonId, transporteurId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.patch(`${API_URL}/livraisons/${livraisonId}/assign-transporteur`, { transporteurId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const transporteur = transporteurs.find(t => t._id === transporteurId);
      Alert.alert('Succès', `✅ Transporteur "${getTransporteurNom(transporteur)}" assigné`);
      setShowAssignModal(false);
      fetchLivraisons(user);
    } catch (error) {
      Alert.alert('Erreur', error.response?.data?.message || '❌ Erreur lors de l\'assignation');
    }
  };

  const getEtatClass = (etat) => {
    switch (etat) {
      case 'À préparer': return styles.etatPreparer;
      case 'Prête': return styles.etatPrete;
      case 'En cours': return styles.etatCours;
      case 'Livrée': return styles.etatLivree;
      case 'Annulée': return styles.etatAnnulee;
      default: return styles.etatDefault;
    }
  };

  const getEtatIcon = (etat) => {
    switch (etat) {
      case 'À préparer': return '⏳';
      case 'Prête': return '✅';
      case 'En cours': return '🚚';
      case 'Livrée': return '📦';
      case 'Annulée': return '❌';
      default: return '📄';
    }
  };

  const getEtatsPossibles = (etatActuel) => {
    switch (etatActuel) {
      case 'À préparer': return ['Prête', 'Annulée'];
      case 'Prête': return ['En cours', 'Annulée'];
      case 'En cours': return ['Livrée', 'Annulée'];
      default: return [];
    }
  };

  const filteredLivraisons = livraisons.filter(l => {
    const transporteurNom = getTransporteurNom(l.transporteur);
    const matchesSearch = l.numeroLivraison?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.commande?.numeroCommande?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transporteurNom.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEtat = !selectedEtat || l.etat === selectedEtat;
    return matchesSearch && matchesEtat;
  });

  const stats = {
    total: livraisons.length,
    aPreparer: livraisons.filter(l => l.etat === 'À préparer').length,
    prete: livraisons.filter(l => l.etat === 'Prête').length,
    enCours: livraisons.filter(l => l.etat === 'En cours').length,
    livrees: livraisons.filter(l => l.etat === 'Livrée').length,
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchLivraisons(user);
    if (isCommercial) {
      fetchCommandesValidees();
      fetchTransporteurs();
    }
  };

  const renderLivraisonItem = ({ item }) => (
    <View style={styles.livraisonCard}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.livraisonNum}>{item.numeroLivraison}</Text>
          <Text style={styles.commandeRef}>Commande: {item.commande?.numeroCommande}</Text>
        </View>
        <View style={[styles.etatBadge, getEtatClass(item.etat)]}>
          <Text style={styles.etatBadgeText}>{getEtatIcon(item.etat)} {item.etat}</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Transporteur:</Text>
          <Text style={styles.infoValue}>{getTransporteurNom(item.transporteur)}</Text>
          {isAdmin && (
            <TouchableOpacity style={styles.assignButton} onPress={() => {
              setSelectedLivraison(item);
              setShowAssignModal(true);
            }}>
              <Text style={styles.assignButtonText}>{item.transporteur ? '🔄' : '✍️'}</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Date création:</Text>
          <Text style={styles.infoValue}>{new Date(item.dateCreation).toLocaleDateString()}</Text>
        </View>
        {item.dateArriveePrevue && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Arrivée prévue:</Text>
            <Text style={styles.infoValue}>{new Date(item.dateArriveePrevue).toLocaleDateString()}</Text>
          </View>
        )}
        {item.commentaire && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Commentaire:</Text>
            <Text style={styles.infoValue}>{item.commentaire}</Text>
          </View>
        )}
      </View>

      {isCommercial && (
        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.pdfButton} onPress={() => downloadBonLivraison(item._id, item.numeroLivraison)}>
            <Text style={styles.buttonText}>📄 Bon de livraison</Text>
          </TouchableOpacity>
          {getEtatsPossibles(item.etat).map(etat => (
            <TouchableOpacity key={etat} style={styles.etatButton} onPress={() => updateEtat(item._id, etat)}>
              <Text style={styles.buttonText}>
                {etat === 'Prête' && '✅ Marquer prête'}
                {etat === 'En cours' && '🚚 Mettre en cours'}
                {etat === 'Livrée' && '📦 Marquer livrée'}
                {etat === 'Annulée' && '❌ Annuler'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1e3a8a" />
        <Text style={styles.loadingText}>Chargement des livraisons...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Gestion des Livraisons</Text>
        <Text style={styles.subtitle}>Suivez et gérez vos livraisons</Text>
        <View style={styles.roleBadges}>
          {isAdmin && <Text style={[styles.roleBadge, styles.adminBadge]}>👑 Admin (Supervision + Signature livreur)</Text>}
          {isCommercial && <Text style={[styles.roleBadge, styles.commercialBadge]}>💼 Commercial (Gestion complète)</Text>}
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={[styles.statCard, styles.warningCard]}>
          <Text style={styles.statValue}>{stats.aPreparer}</Text>
          <Text style={styles.statLabel}>À préparer</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.prete}</Text>
          <Text style={styles.statLabel}>Prête</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.enCours}</Text>
          <Text style={styles.statLabel}>En cours</Text>
        </View>
        <View style={[styles.statCard, styles.successCard]}>
          <Text style={styles.statValue}>{stats.livrees}</Text>
          <Text style={styles.statLabel}>Livrées</Text>
        </View>
      </View>

      {isCommercial && (
        <TouchableOpacity style={styles.newButton} onPress={() => setShowModal(true)}>
          <Text style={styles.newButtonText}>+ Nouvelle Livraison</Text>
        </TouchableOpacity>
      )}

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Rechercher..."
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.etatFilter}>
          <TouchableOpacity style={[styles.filterButton, !selectedEtat && styles.filterActive]} onPress={() => setSelectedEtat('')}>
            <Text style={[styles.filterText, !selectedEtat && styles.filterTextActive]}>Tous</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.filterButton, selectedEtat === 'À préparer' && styles.filterActive]} onPress={() => setSelectedEtat('À préparer')}>
            <Text style={[styles.filterText, selectedEtat === 'À préparer' && styles.filterTextActive]}>⏳ À préparer</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.filterButton, selectedEtat === 'Prête' && styles.filterActive]} onPress={() => setSelectedEtat('Prête')}>
            <Text style={[styles.filterText, selectedEtat === 'Prête' && styles.filterTextActive]}>✅ Prête</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.filterButton, selectedEtat === 'En cours' && styles.filterActive]} onPress={() => setSelectedEtat('En cours')}>
            <Text style={[styles.filterText, selectedEtat === 'En cours' && styles.filterTextActive]}>🚚 En cours</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.filterButton, selectedEtat === 'Livrée' && styles.filterActive]} onPress={() => setSelectedEtat('Livrée')}>
            <Text style={[styles.filterText, selectedEtat === 'Livrée' && styles.filterTextActive]}>📦 Livrée</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Liste */}
      {filteredLivraisons.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🚚</Text>
          <Text style={styles.emptyTitle}>Aucune livraison trouvée</Text>
        </View>
      ) : (
        <FlatList
          data={filteredLivraisons}
          keyExtractor={(item) => item._id}
          renderItem={renderLivraisonItem}
          scrollEnabled={false}
        />
      )}

      {/* Modal création livraison */}
      <Modal visible={showModal} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nouvelle Livraison</Text>

            <Text style={styles.modalLabel}>Sélectionner une commande validée *</Text>
            <Picker
              selectedValue={selectedCommande?._id || ''}
              onValueChange={(val) => {
                const cmd = commandes.find(c => c._id === val);
                setSelectedCommande(cmd);
              }}
              style={styles.picker}
            >
              <Picker.Item label="-- Choisir une commande --" value="" />
              {commandes.map(cmd => (
                <Picker.Item key={cmd._id} label={`${cmd.numeroCommande} - ${cmd.montantTotal?.toLocaleString()} TND`} value={cmd._id} />
              ))}
            </Picker>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowModal(false)}>
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={createLivraison}>
                <Text style={styles.saveButtonText}>Créer la livraison</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal assignation transporteur */}
      <Modal visible={showAssignModal} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Signer un livreur</Text>

            <Text style={styles.modalLabel}>Sélectionner un transporteur *</Text>
            <Picker
              selectedValue=""
              onValueChange={(val) => {
                if (val) assignTransporteur(selectedLivraison?._id, val);
              }}
              style={styles.picker}
            >
              <Picker.Item label="-- Choisir un transporteur --" value="" />
              {transporteurs.map(t => (
                <Picker.Item key={t._id} label={`${getTransporteurNom(t)} - ${t.email || t.telephone || 'Sans contact'}`} value={t._id} />
              ))}
            </Picker>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowAssignModal(false)}>
                <Text style={styles.cancelButtonText}>Annuler</Text>
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

  header: {
    backgroundColor: '#1e3a8a',
    padding: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: { fontSize: 22, fontWeight: 'bold', color: '#fff', fontFamily: 'Georgia' },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  roleBadges: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, gap: 6 },
  roleBadge: { fontSize: 10, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, overflow: 'hidden' },
  adminBadge: { backgroundColor: '#eef2ff', color: '#3730a3' },
  commercialBadge: { backgroundColor: '#ecfeff', color: '#0e7490' },

  statsContainer: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, marginTop: -10 },
  statCard: { backgroundColor: '#fff', borderRadius: 12, padding: 12, alignItems: 'center', flex: 1, margin: 4, elevation: 2 },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#1e3a8a' },
  statLabel: { fontSize: 10, color: '#64748b', marginTop: 2 },
  warningCard: { backgroundColor: '#fef3c7' },
  successCard: { backgroundColor: '#dcfce7' },

  newButton: { backgroundColor: '#1e3a8a', margin: 16, padding: 14, borderRadius: 12, alignItems: 'center' },
  newButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },

  filtersContainer: { paddingHorizontal: 16, marginBottom: 16 },
  searchInput: { backgroundColor: '#fff', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 12 },
  etatFilter: { flexDirection: 'row' },
  filterButton: { paddingHorizontal: 14, paddingVertical: 6, backgroundColor: '#e2e8f0', borderRadius: 20, marginRight: 8 },
  filterActive: { backgroundColor: '#1e3a8a' },
  filterText: { fontSize: 12, color: '#64748b' },
  filterTextActive: { color: '#fff' },

  livraisonCard: { backgroundColor: '#fff', margin: 16, marginTop: 0, marginBottom: 12, padding: 16, borderRadius: 12, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  livraisonNum: { fontSize: 14, fontWeight: 'bold', color: '#1e3a8a' },
  commandeRef: { fontSize: 11, color: '#64748b', marginTop: 2 },
  etatBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  etatBadgeText: { fontSize: 11, fontWeight: '500' },
  etatPreparer: { backgroundColor: '#fef3c7' },
  etatPrete: { backgroundColor: '#dcfce7' },
  etatCours: { backgroundColor: '#dbeafe' },
  etatLivree: { backgroundColor: '#dcfce7' },
  etatAnnulee: { backgroundColor: '#fee2e2' },
  etatDefault: { backgroundColor: '#e2e8f0' },

  cardBody: { gap: 8, marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  infoLabel: { width: 100, fontSize: 13, color: '#64748b', fontWeight: '500' },
  infoValue: { flex: 1, fontSize: 13, color: '#1e293b' },
  assignButton: { backgroundColor: '#dbeafe', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  assignButtonText: { fontSize: 12 },

  cardActions: { flexDirection: 'row', gap: 8, marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#e2e8f0', flexWrap: 'wrap' },
  pdfButton: { backgroundColor: '#3b82f6', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  etatButton: { backgroundColor: '#10b981', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 12, fontWeight: '500' },

  emptyState: { alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#64748b' },

  modalContainer: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 20, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  modalLabel: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 8, marginTop: 12 },
  picker: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, marginBottom: 8 },
  modalButtons: { flexDirection: 'row', marginTop: 20, gap: 12 },
  cancelButton: { flex: 1, backgroundColor: '#e2e8f0', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  cancelButtonText: { color: '#64748b', fontWeight: '600' },
  saveButton: { flex: 1, backgroundColor: '#1e3a8a', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontWeight: '600' },
});