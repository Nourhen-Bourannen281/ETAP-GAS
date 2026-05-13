// src/screens/shared/SuiviTempsReel.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

export default function SuiviTempsReel({ navigation }) {
  const [user, setUser] = useState(null);
  const [livraisons, setLivraisons] = useState([]);
  const [historique, setHistorique] = useState([]);
  const [selectedLivraison, setSelectedLivraison] = useState(null);
  const [activeTab, setActiveTab] = useState('suivi');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const IP = '192.168.1.114';
  const API_URL = `http://${IP}:5000/api`;

  useEffect(() => {
    loadUserData();
    fetchLivraisons();
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

  const fetchLivraisons = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_URL}/livraisons`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLivraisons(response.data);
    } catch (error) {
      console.error('Erreur:', error);
      Alert.alert('Erreur', 'Erreur de chargement');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchHistorique = async (livraisonId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_URL}/historique/entity/Livraison/${livraisonId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistorique(response.data);
    } catch (error) {
      console.error('Erreur:', error);
      Alert.alert('Erreur', 'Erreur chargement historique');
    }
  };

  const selectLivraison = (livraison) => {
    setSelectedLivraison(livraison);
    fetchHistorique(livraison._id);
    setActiveTab('historique');
  };

  const getEtatClass = (etat) => {
    switch (etat) {
      case 'À préparer': return styles.statusPreparer;
      case 'Prête': return styles.statusPrete;
      case 'En cours': return styles.statusEncours;
      case 'Livrée': return styles.statusLivree;
      default: return styles.statusDefault;
    }
  };

  const getEtatIcon = (etat) => {
    switch (etat) {
      case 'À préparer': return '⏳';
      case 'Prête': return '✅';
      case 'En cours': return '🚚';
      case 'Livrée': return '📦';
      default: return '📄';
    }
  };

  const getStepStatus = (etat, stepName) => {
    const steps = ['À préparer', 'Prête', 'En cours', 'Livrée'];
    const currentIndex = steps.indexOf(etat);
    const stepIndex = steps.indexOf(stepName);
    
    if (currentIndex === -1) return 'pending';
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'active';
    return 'pending';
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchLivraisons();
  };

  const renderLivraisonItem = ({ item }) => (
    <TouchableOpacity style={styles.suiviCard} onPress={() => selectLivraison(item)}>
      <View style={styles.cardHeader}>
        <Text style={styles.livraisonNum}>{item.numeroLivraison}</Text>
        <View style={[styles.statusBadge, getEtatClass(item.etat)]}>
          <Text style={styles.statusBadgeText}>{getEtatIcon(item.etat)} {item.etat}</Text>
        </View>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.infoText}><Text style={styles.infoLabel}>Commande:</Text> {item.commande?.numeroCommande}</Text>
        <Text style={styles.infoText}><Text style={styles.infoLabel}>Transporteur:</Text> {item.transporteur?.raisonSociale || 'Non assigné'}</Text>
        <Text style={styles.infoText}><Text style={styles.infoLabel}>Date création:</Text> {new Date(item.dateCreation).toLocaleDateString()}</Text>
      </View>
      
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressStep, getStepStatus(item.etat, 'À préparer') === 'completed' && styles.completed, getStepStatus(item.etat, 'À préparer') === 'active' && styles.active]}>
            <Text style={styles.progressIcon}>📝</Text>
          </View>
          <View style={[styles.progressLine, (getStepStatus(item.etat, 'Prête') === 'completed' || getStepStatus(item.etat, 'Prête') === 'active') && styles.lineActive]} />
          <View style={[styles.progressStep, getStepStatus(item.etat, 'Prête') === 'completed' && styles.completed, getStepStatus(item.etat, 'Prête') === 'active' && styles.active]}>
            <Text style={styles.progressIcon}>✅</Text>
          </View>
          <View style={[styles.progressLine, (getStepStatus(item.etat, 'En cours') === 'completed' || getStepStatus(item.etat, 'En cours') === 'active') && styles.lineActive]} />
          <View style={[styles.progressStep, getStepStatus(item.etat, 'En cours') === 'completed' && styles.completed, getStepStatus(item.etat, 'En cours') === 'active' && styles.active]}>
            <Text style={styles.progressIcon}>🚚</Text>
          </View>
          <View style={[styles.progressLine, (getStepStatus(item.etat, 'Livrée') === 'completed' || getStepStatus(item.etat, 'Livrée') === 'active') && styles.lineActive]} />
          <View style={[styles.progressStep, getStepStatus(item.etat, 'Livrée') === 'completed' && styles.completed, getStepStatus(item.etat, 'Livrée') === 'active' && styles.active]}>
            <Text style={styles.progressIcon}>📦</Text>
          </View>
        </View>
        <View style={styles.progressLabels}>
          <Text style={styles.progressLabel}>À préparer</Text>
          <Text style={styles.progressLabel}>Prête</Text>
          <Text style={styles.progressLabel}>En cours</Text>
          <Text style={styles.progressLabel}>Livrée</Text>
        </View>
      </View>
      
      <View style={styles.cardFooter}>
        <Text style={styles.detailsLink}>Voir historique →</Text>
      </View>
    </TouchableOpacity>
  );

  const renderHistoriqueItem = ({ item, index }) => (
    <View style={styles.timelineItem}>
      <View style={styles.timelineDot} />
      {index < historique.length - 1 && <View style={styles.timelineLine} />}
      <View style={styles.timelineContent}>
        <Text style={styles.timelineDate}>{new Date(item.dateAction).toLocaleString()}</Text>
        <View style={styles.timelineAction}>
          <Text style={styles.actionBadge}>{item.action}</Text>
          {item.ancienStatut && (
            <Text style={styles.actionChange}> de <Text style={styles.oldStatus}>{item.ancienStatut}</Text> → <Text style={styles.newStatus}>{item.nouveauStatut}</Text></Text>
          )}
        </View>
        <Text style={styles.timelineUser}>Par: {item.utilisateur?.nom || 'Système'}</Text>
        {item.details && <Text style={styles.timelineDetails}>{item.details}</Text>}
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
      <View style={styles.header}>
        <Text style={styles.title}>🚚 Suivi des Livraisons</Text>
        <Text style={styles.subtitle}>Suivi en temps réel et historique des actions</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'suivi' && styles.tabActive]} 
          onPress={() => setActiveTab('suivi')}
        >
          <Text style={[styles.tabText, activeTab === 'suivi' && styles.tabTextActive]}>📍 Suivi en direct</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'historique' && styles.tabActive]} 
          onPress={() => setActiveTab('historique')}
        >
          <Text style={[styles.tabText, activeTab === 'historique' && styles.tabTextActive]}>📜 Historique</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'suivi' && (
        <>
          {livraisons.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🚚</Text>
              <Text style={styles.emptyTitle}>Aucune livraison</Text>
              <Text style={styles.emptySubtitle}>Aucune livraison en cours</Text>
            </View>
          ) : (
            <FlatList
              data={livraisons}
              keyExtractor={(item) => item._id}
              renderItem={renderLivraisonItem}
              scrollEnabled={false}
            />
          )}
        </>
      )}

      {activeTab === 'historique' && selectedLivraison && (
        <View style={styles.historiqueSection}>
          <View style={styles.historiqueHeader}>
            <Text style={styles.historiqueTitle}>Historique - {selectedLivraison.numeroLivraison}</Text>
            <TouchableOpacity style={styles.backButton} onPress={() => setActiveTab('suivi')}>
              <Text style={styles.backButtonText}>← Retour</Text>
            </TouchableOpacity>
          </View>
          {historique.length === 0 ? (
            <View style={styles.emptyTimeline}>
              <Text>Aucun historique disponible</Text>
            </View>
          ) : (
            <FlatList
              data={historique}
              keyExtractor={(item) => item._id}
              renderItem={renderHistoriqueItem}
              scrollEnabled={false}
            />
          )}
        </View>
      )}
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
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  
  tabs: { flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: '#1e3a8a' },
  tabText: { fontSize: 14, fontWeight: '500', color: '#64748b' },
  tabTextActive: { color: '#fff' },
  
  suiviCard: { backgroundColor: '#fff', margin: 16, marginTop: 0, marginBottom: 12, padding: 16, borderRadius: 12, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  livraisonNum: { fontSize: 14, fontWeight: 'bold', color: '#1e3a8a' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusBadgeText: { fontSize: 11, fontWeight: '500' },
  statusPreparer: { backgroundColor: '#fef3c7' },
  statusPrete: { backgroundColor: '#dbeafe' },
  statusEncours: { backgroundColor: '#dcfce7' },
  statusLivree: { backgroundColor: '#dcfce7' },
  statusDefault: { backgroundColor: '#e2e8f0' },
  cardBody: { gap: 6, marginBottom: 16 },
  infoText: { fontSize: 13, color: '#64748b' },
  infoLabel: { fontWeight: '600', color: '#1e293b' },
  
  progressContainer: { marginBottom: 16 },
  progressBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  progressStep: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' },
  progressIcon: { fontSize: 16 },
  completed: { backgroundColor: '#10b981' },
  active: { backgroundColor: '#3b82f6' },
  progressLine: { flex: 1, height: 3, backgroundColor: '#e2e8f0', marginHorizontal: 4 },
  lineActive: { backgroundColor: '#10b981' },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  progressLabel: { fontSize: 9, color: '#64748b', textAlign: 'center', flex: 1 },
  
  cardFooter: { alignItems: 'flex-end' },
  detailsLink: { fontSize: 12, color: '#3b82f6', fontWeight: '500' },
  
  historiqueSection: { backgroundColor: '#fff', margin: 16, padding: 16, borderRadius: 12 },
  historiqueHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  historiqueTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e3a8a' },
  backButton: { backgroundColor: '#e2e8f0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  backButtonText: { fontSize: 12, color: '#64748b' },
  
  timelineItem: { position: 'relative', marginBottom: 20, paddingLeft: 30 },
  timelineDot: { position: 'absolute', left: 0, top: 5, width: 12, height: 12, borderRadius: 6, backgroundColor: '#3b82f6' },
  timelineLine: { position: 'absolute', left: 5, top: 20, width: 2, height: 'calc(100% - 10px)', backgroundColor: '#e2e8f0' },
  timelineContent: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 8 },
  timelineDate: { fontSize: 11, color: '#64748b', marginBottom: 4 },
  timelineAction: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginBottom: 4 },
  actionBadge: { backgroundColor: '#3b82f6', color: '#fff', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, fontSize: 10, fontWeight: '600', marginRight: 8 },
  actionChange: { fontSize: 12, color: '#1e293b' },
  oldStatus: { fontWeight: '600', color: '#f59e0b' },
  newStatus: { fontWeight: '600', color: '#10b981' },
  timelineUser: { fontSize: 11, color: '#64748b', marginBottom: 4 },
  timelineDetails: { fontSize: 12, color: '#1e293b', marginTop: 4, paddingTop: 4, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  
  emptyState: { alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#64748b' },
  emptySubtitle: { fontSize: 13, color: '#94a3b8', marginTop: 4 },
  emptyTimeline: { alignItems: 'center', padding: 40 },
});