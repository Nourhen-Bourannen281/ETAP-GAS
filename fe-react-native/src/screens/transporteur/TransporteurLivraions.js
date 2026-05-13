// src/screens/transporteur/TransporteurLivraisons.js
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
  FlatList,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

export default function TransporteurLivraisons({ navigation }) {
  const [user, setUser] = useState(null);
  const [livraisons, setLivraisons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('prete'); // 'prete', 'encours', 'livree'

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
        fetchMesLivraisons(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const isTransporteur = user?.role === 'Transporteur';

  const fetchMesLivraisons = async (userData) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_URL}/livraisons`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Filtrer uniquement les livraisons assignées à ce transporteur
      const userId = userData?._id;
      const mesLivraisons = response.data.filter(l => l.transporteur?._id === userId);

      setLivraisons(mesLivraisons);
    } catch (error) {
      console.error('Erreur:', error);
      Alert.alert('Erreur', 'Erreur lors du chargement des livraisons');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const demarrerTransport = async (livraisonId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.patch(`${API_URL}/livraisons/${livraisonId}/etat`, 
        { etat: 'En cours' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Succès', '🚚 Transport démarré avec succès');
      fetchMesLivraisons(user);
    } catch (error) {
      Alert.alert('Erreur', error.response?.data?.message || 'Erreur lors du démarrage');
    }
  };

  const terminerTransport = async (livraisonId) => {
    Alert.alert(
      'Confirmation',
      'Voulez-vous marquer cette livraison comme terminée ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Terminer',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              await axios.patch(`${API_URL}/livraisons/${livraisonId}/etat`, 
                { etat: 'Livrée' },
                { headers: { Authorization: `Bearer ${token}` } }
              );
              Alert.alert('Succès', '📦 Transport terminé avec succès');
              fetchMesLivraisons(user);
            } catch (error) {
              Alert.alert('Erreur', error.response?.data?.message || 'Erreur lors de la terminaison');
            }
          },
        },
      ]
    );
  };

  const getTransporteurNom = (transporteur) => {
    if (!transporteur) return 'Non assigné';
    return transporteur.raisonSociale || transporteur.nom || transporteur.name || transporteur.email || 'Transporteur';
  };

  const getEtatIcon = (etat) => {
    switch (etat) {
      case 'Prête': return '✅';
      case 'En cours': return '🚚';
      case 'Livrée': return '📦';
      default: return '📄';
    }
  };

  const filterBySearch = (livraisonsList) => {
    if (!searchTerm) return livraisonsList;
    return livraisonsList.filter(l =>
      l.numeroLivraison?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.commande?.numeroCommande?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Séparer les livraisons par état
  const livraisonsPrete = livraisons.filter(l => l.etat === 'Prête');
  const livraisonsEnCours = livraisons.filter(l => l.etat === 'En cours');
  const livraisonsLivree = livraisons.filter(l => l.etat === 'Livrée');

  const filteredPrete = filterBySearch(livraisonsPrete);
  const filteredEnCours = filterBySearch(livraisonsEnCours);
  const filteredLivree = filterBySearch(livraisonsLivree);

  const stats = {
    prete: livraisonsPrete.length,
    enCours: livraisonsEnCours.length,
    livree: livraisonsLivree.length,
    total: livraisons.length,
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchMesLivraisons(user);
  };

  const renderLivraisonCard = ({ item: livraison, section }) => {
    const isPrete = livraison.etat === 'Prête';
    const isEnCours = livraison.etat === 'En cours';
    const isLivree = livraison.etat === 'Livrée';

    return (
      <View style={[styles.livraisonCard, isPrete && styles.preteCard, isEnCours && styles.encoursCard, isLivree && styles.livreeCard]}>
        <View style={styles.cardHeader}>
          <Text style={styles.livraisonNum}>{livraison.numeroLivraison}</Text>
          <View style={[styles.etatBadge, isPrete && styles.preteBadge, isEnCours && styles.encoursBadge, isLivree && styles.livreeBadge]}>
            <Text style={styles.etatBadgeText}>{getEtatIcon(livraison.etat)} {livraison.etat === 'Livrée' ? 'Terminée' : livraison.etat}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Commande:</Text>
            <Text style={styles.value}>{livraison.commande?.numeroCommande || '-'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Date création:</Text>
            <Text style={styles.value}>{new Date(livraison.dateCreation).toLocaleDateString()}</Text>
          </View>
          {livraison.dateArriveePrevue && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Arrivée prévue:</Text>
              <Text style={styles.value}>{new Date(livraison.dateArriveePrevue).toLocaleDateString()}</Text>
            </View>
          )}
          {livraison.dateLivraison && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Date livraison:</Text>
              <Text style={styles.value}>{new Date(livraison.dateLivraison).toLocaleDateString()}</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Text style={styles.label}>Transporteur:</Text>
            <Text style={styles.value}>{getTransporteurNom(livraison.transporteur)}</Text>
          </View>
        </View>

        <View style={styles.cardActions}>
          {isPrete && (
            <TouchableOpacity style={styles.startButton} onPress={() => demarrerTransport(livraison._id)}>
              <Text style={styles.buttonText}>🚚 Démarrer la livraison</Text>
            </TouchableOpacity>
          )}
          {isEnCours && (
            <TouchableOpacity style={styles.endButton} onPress={() => terminerTransport(livraison._id)}>
              <Text style={styles.buttonText}>✅ Terminer la livraison</Text>
            </TouchableOpacity>
          )}
          {isLivree && (
            <View style={styles.completedBadge}>
              <Text style={styles.completedText}>✓ Livraison terminée</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (!isTransporteur) {
    return (
      <View style={styles.center}>
        <Text style={styles.accessDeniedText}>⛔ Accès réservé aux transporteurs</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1e3a8a" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  const renderContent = () => {
    if (activeTab === 'prete') {
      if (filteredPrete.length === 0) {
        return (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>✅</Text>
            <Text style={styles.emptyTitle}>Aucune livraison à démarrer</Text>
            <Text style={styles.emptySubtitle}>Toutes vos livraisons sont en cours ou terminées</Text>
          </View>
        );
      }
      return (
        <FlatList
          data={filteredPrete}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => renderLivraisonCard({ item })}
          scrollEnabled={false}
        />
      );
    }

    if (activeTab === 'encours') {
      if (filteredEnCours.length === 0) {
        return (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🚚</Text>
            <Text style={styles.emptyTitle}>Aucune livraison en cours</Text>
            <Text style={styles.emptySubtitle}>Vous n'avez aucune livraison en cours pour le moment</Text>
          </View>
        );
      }
      return (
        <FlatList
          data={filteredEnCours}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => renderLivraisonCard({ item })}
          scrollEnabled={false}
        />
      );
    }

    if (activeTab === 'livree') {
      if (filteredLivree.length === 0) {
        return (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyTitle}>Aucune livraison terminée</Text>
            <Text style={styles.emptySubtitle}>Les livraisons terminées apparaîtront ici</Text>
          </View>
        );
      }
      return (
        <FlatList
          data={filteredLivree}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => renderLivraisonCard({ item })}
          scrollEnabled={false}
        />
      );
    }

    return null;
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>🚚 Mes Livraisons</Text>
          <Text style={styles.subtitle}>Gérez vos livraisons assignées</Text>
        </View>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, styles.preteStat]}>
          <Text style={styles.statValue}>{stats.prete}</Text>
          <Text style={styles.statLabel}>À démarrer</Text>
        </View>
        <View style={[styles.statCard, styles.encoursStat]}>
          <Text style={styles.statValue}>{stats.enCours}</Text>
          <Text style={styles.statLabel}>En cours</Text>
        </View>
        <View style={[styles.statCard, styles.livreeStat]}>
          <Text style={styles.statValue}>{stats.livree}</Text>
          <Text style={styles.statLabel}>Terminées</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Rechercher par numéro de livraison ou commande..."
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'prete' && styles.tabActive]}
          onPress={() => setActiveTab('prete')}
        >
          <Text style={[styles.tabText, activeTab === 'prete' && styles.tabTextActive]}>🚀 À démarrer ({filteredPrete.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'encours' && styles.tabActive]}
          onPress={() => setActiveTab('encours')}
        >
          <Text style={[styles.tabText, activeTab === 'encours' && styles.tabTextActive]}>🔄 En cours ({filteredEnCours.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'livree' && styles.tabActive]}
          onPress={() => setActiveTab('livree')}
        >
          <Text style={[styles.tabText, activeTab === 'livree' && styles.tabTextActive]}>✅ Terminées ({filteredLivree.length})</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.contentContainer}>
        {renderContent()}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accessDeniedText: {
    fontSize: 16,
    color: '#dc2626',
    fontWeight: '600',
  },
  loadingText: {
    marginTop: 10,
    color: '#64748b',
  },

  // Header
  header: {
    backgroundColor: '#1e3a8a',
    padding: 24,
    paddingTop: 60,
    paddingBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: 'Georgia',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },

  // Stats
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    marginTop: -20,
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
  preteStat: {
    borderTopWidth: 3,
    borderTopColor: '#f59e0b',
  },
  encoursStat: {
    borderTopWidth: 3,
    borderTopColor: '#3b82f6',
  },
  livreeStat: {
    borderTopWidth: 3,
    borderTopColor: '#10b981',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 4,
  },

  // Search
  searchSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    fontSize: 14,
  },

  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#e2e8f0',
    borderRadius: 25,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#1e3a8a',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
  },
  tabTextActive: {
    color: '#fff',
  },

  // Content
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },

  // Livraison Card
  livraisonCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  preteCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  encoursCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  livreeCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
    opacity: 0.85,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  livraisonNum: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  etatBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  preteBadge: {
    backgroundColor: '#fef3c7',
  },
  encoursBadge: {
    backgroundColor: '#dbeafe',
  },
  livreeBadge: {
    backgroundColor: '#dcfce7',
  },
  etatBadgeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  cardBody: {
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  label: {
    width: 100,
    fontSize: 13,
    color: '#64748b',
  },
  value: {
    flex: 1,
    fontSize: 13,
    color: '#1e293b',
    fontWeight: '500',
  },
  cardActions: {
    padding: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  startButton: {
    backgroundColor: '#f59e0b',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  endButton: {
    backgroundColor: '#10b981',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  completedBadge: {
    backgroundColor: '#dcfce7',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  completedText: {
    color: '#166534',
    fontWeight: '600',
    fontSize: 14,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#64748b',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
  },
});