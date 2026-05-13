// src/screens/transporteur/Livraisons.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

export default function Livraisons({ navigation }) {
  const [user, setUser] = useState(null);
  const [livraisons, setLivraisons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');

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
      console.error('Erreur livraisons:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const updateEtat = async (livraisonId, nouvelEtat) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.patch(`${API_URL}/livraisons/${livraisonId}/etat`, 
        { etat: nouvelEtat },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Succès', `Livraison ${nouvelEtat === 'En cours' ? 'démarrée' : 'terminée'} !`);
      fetchLivraisons();
    } catch (error) {
      Alert.alert('Erreur', "Erreur lors de la mise à jour");
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Déconnexion',
      'Voulez-vous vraiment vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnecter',
          onPress: async () => {
            await AsyncStorage.clear();
            navigation.replace('Landing');
          },
        },
      ]
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchLivraisons();
  };

  const filteredLivraisons = livraisons.filter(l => {
    if (filter === 'all') return true;
    return l.etat === filter;
  });

  const getEtatIcon = (etat) => {
    switch(etat) {
      case 'À préparer': return '⏳';
      case 'Prête': return '✅';
      case 'En cours': return '🚚';
      case 'Livrée': return '📦';
      default: return '📄';
    }
  };

  const stats = {
    aPreparer: livraisons.filter(l => l.etat === 'À préparer').length,
    prete: livraisons.filter(l => l.etat === 'Prête').length,
    enCours: livraisons.filter(l => l.etat === 'En cours').length,
    livrees: livraisons.filter(l => l.etat === 'Livrée').length,
  };

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
        <View>
          <Text style={styles.welcome}>Dashboard Transporteur</Text>
          <Text style={styles.userName}>{user?.prenom} {user?.nom}</Text>
          <Text style={styles.userRole}>🚚 {user?.role}</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Déconnexion</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}><Text style={styles.statValue}>{stats.prete}</Text><Text style={styles.statLabel}>Prêtes</Text></View>
        <View style={styles.statCard}><Text style={styles.statValue}>{stats.enCours}</Text><Text style={styles.statLabel}>En cours</Text></View>
        <View style={styles.statCard}><Text style={styles.statValue}>{stats.livrees}</Text><Text style={styles.statLabel}>Livrées</Text></View>
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity style={[styles.filterButton, filter === 'all' && styles.filterActive]} onPress={() => setFilter('all')}><Text>📋 Tous</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.filterButton, filter === 'Prête' && styles.filterActive]} onPress={() => setFilter('Prête')}><Text>✅ Prêtes</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.filterButton, filter === 'En cours' && styles.filterActive]} onPress={() => setFilter('En cours')}><Text>🚚 En cours</Text></TouchableOpacity>
      </View>

      {filteredLivraisons.length === 0 ? (
        <Text style={styles.emptyText}>Aucune livraison</Text>
      ) : (
        filteredLivraisons.map(livraison => (
          <View key={livraison._id} style={styles.livraisonCard}>
            <View style={styles.livraisonHeader}>
              <Text style={styles.livraisonNum}>{livraison.numeroLivraison}</Text>
              <Text style={styles.livraisonEtat}>{getEtatIcon(livraison.etat)} {livraison.etat}</Text>
            </View>
            <Text style={styles.commandeRef}>Commande: {livraison.commande?.numeroCommande}</Text>
            <Text style={styles.dateText}>Créée le: {new Date(livraison.dateCreation).toLocaleDateString()}</Text>
            
            <View style={styles.actions}>
              {livraison.etat === 'Prête' && (
                <TouchableOpacity style={styles.startButton} onPress={() => updateEtat(livraison._id, 'En cours')}>
                  <Text style={styles.buttonText}>🚚 Démarrer transport</Text>
                </TouchableOpacity>
              )}
              {livraison.etat === 'En cours' && (
                <TouchableOpacity style={styles.completeButton} onPress={() => updateEtat(livraison._id, 'Livrée')}>
                  <Text style={styles.buttonText}>📦 Terminer transport</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: '#1e3a8a',
    padding: 24,
    paddingTop: 60,
    paddingBottom: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcome: { color: 'rgba(255,255,255,0.7)', fontSize: 14 },
  userName: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  userRole: { color: '#38bdf8', fontSize: 12, marginTop: 4 },
  logoutButton: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  logoutText: { color: '#fff', fontSize: 14 },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, marginTop: -20 },
  statCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center', flex: 1, marginHorizontal: 5 },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#1e3a8a' },
  statLabel: { fontSize: 12, color: '#64748b', marginTop: 4 },
  filterContainer: { flexDirection: 'row', padding: 16, gap: 10 },
  filterButton: { flex: 1, paddingVertical: 10, backgroundColor: '#e2e8f0', borderRadius: 8, alignItems: 'center' },
  filterActive: { backgroundColor: '#1e3a8a' },
  livraisonCard: { backgroundColor: '#fff', margin: 16, marginTop: 0, marginBottom: 12, padding: 16, borderRadius: 12 },
  livraisonHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  livraisonNum: { fontSize: 16, fontWeight: 'bold', color: '#1e3a8a' },
  livraisonEtat: { fontSize: 14 },
  commandeRef: { fontSize: 12, color: '#64748b', marginBottom: 4 },
  dateText: { fontSize: 12, color: '#64748b', marginBottom: 16 },
  actions: { marginTop: 12 },
  startButton: { backgroundColor: '#16a34a', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  completeButton: { backgroundColor: '#2563eb', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600' },
  emptyText: { textAlign: 'center', color: '#64748b', marginTop: 40 },
});