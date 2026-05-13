// src/screens/commercial/Commandes.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

export default function Commandes({ navigation }) {
  const [user, setUser] = useState(null);
  const [commandes, setCommandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const IP = '192.168.1.114';
  const API_URL = `http://${IP}:5000/api`;

  useEffect(() => {
    loadUserData();
    fetchCommandes();
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
  const canManage = isAdmin || isCommercial;

  const fetchCommandes = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_URL}/commandes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCommandes(response.data);
    } catch (error) {
      console.error('Erreur:', error);
      Alert.alert('Erreur', 'Erreur lors du chargement des commandes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const validerCommande = async (id, statut) => {
    Alert.alert(
      'Confirmation',
      `Valider cette commande ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: statut === 'Validée' ? 'Valider' : 'Refuser',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              await axios.patch(`${API_URL}/commandes/${id}/valider`, { statut }, {
                headers: { Authorization: `Bearer ${token}` }
              });
              Alert.alert('Succès', `Commande ${statut === 'Validée' ? 'validée' : 'refusée'}`);
              fetchCommandes();
            } catch (error) {
              Alert.alert('Erreur', error.response?.data?.message || 'Erreur lors de la validation');
            }
          },
        },
      ]
    );
  };

  const supprimerCommande = async (id, numeroCommande) => {
    Alert.alert(
      'Confirmation',
      `Supprimer la commande ${numeroCommande} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              await axios.delete(`${API_URL}/commandes/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              Alert.alert('Succès', 'Commande supprimée');
              fetchCommandes();
            } catch (error) {
              Alert.alert('Erreur', error.response?.data?.message || 'Erreur lors de la suppression');
            }
          },
        },
      ]
    );
  };

  const getStatusClass = (statut) => {
    switch (statut) {
      case 'Validée': return styles.statusValidated;
      case 'Attente': return styles.statusPending;
      case 'Refusée': return styles.statusRefused;
      case 'Livrée': return styles.statusDelivered;
      default: return styles.statusDefault;
    }
  };

  const getStatusText = (statut) => {
    switch (statut) {
      case 'Validée': return '✅ Validée';
      case 'Attente': return '⏳ En attente';
      case 'Refusée': return '❌ Refusée';
      case 'Livrée': return '📦 Livrée';
      default: return statut;
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchCommandes();
  };

  const renderCommandeItem = ({ item }) => (
    <View style={styles.commandeCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.commandeNumber}>{item.numeroCommande}</Text>
        <View style={[styles.statusBadge, getStatusClass(item.statut)]}>
          <Text style={styles.statusText}>{getStatusText(item.statut)}</Text>
        </View>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.infoText}><Text style={styles.infoLabel}>Client:</Text> {item.client?.raisonSociale || item.client?.nom || 'N/A'}</Text>
        <Text style={styles.infoText}><Text style={styles.infoLabel}>Montant:</Text> {item.montantTotal?.toLocaleString()} TND</Text>
        <Text style={styles.infoText}><Text style={styles.infoLabel}>Date:</Text> {new Date(item.dateCreation).toLocaleDateString()}</Text>
      </View>
      {canManage && (
        <View style={styles.cardActions}>
          {item.statut === 'Attente' && (
            <>
              <TouchableOpacity style={styles.validateButton} onPress={() => validerCommande(item._id, 'Validée')}>
                <Text style={styles.buttonText}>Valider</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.refuseButton} onPress={() => validerCommande(item._id, 'Refusée')}>
                <Text style={styles.buttonText}>Refuser</Text>
              </TouchableOpacity>
            </>
          )}
          <TouchableOpacity style={styles.deleteButton} onPress={() => supprimerCommande(item._id, item.numeroCommande)}>
            <Text style={styles.buttonText}>🗑️ Supprimer</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1e3a8a" />
        <Text style={styles.loadingText}>Chargement des commandes...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Gestion des Commandes</Text>
        <Text style={styles.subtitle}>Liste de toutes les commandes</Text>
      </View>

      {commandes.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📦</Text>
          <Text style={styles.emptyTitle}>Aucune commande trouvée</Text>
          <Text style={styles.emptySubtitle}>Commencez par créer une commande</Text>
        </View>
      ) : (
        <FlatList
          data={commandes}
          keyExtractor={(item) => item._id}
          renderItem={renderCommandeItem}
          scrollEnabled={false}
        />
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

  commandeCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  commandeNumber: { fontSize: 14, fontWeight: 'bold', color: '#1e3a8a' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusValidated: { backgroundColor: '#dcfce7' },
  statusPending: { backgroundColor: '#fef3c7' },
  statusRefused: { backgroundColor: '#fee2e2' },
  statusDelivered: { backgroundColor: '#dbeafe' },
  statusDefault: { backgroundColor: '#e2e8f0' },
  statusText: { fontSize: 11, fontWeight: '500' },
  cardBody: { gap: 6, marginBottom: 12 },
  infoText: { fontSize: 13, color: '#64748b' },
  infoLabel: { fontWeight: '600', color: '#1e293b' },
  cardActions: { flexDirection: 'row', gap: 8, marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  validateButton: { flex: 1, backgroundColor: '#10b981', paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  refuseButton: { flex: 1, backgroundColor: '#ef4444', paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  deleteButton: { flex: 1, backgroundColor: '#6b7280', paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 12, fontWeight: '500' },

  emptyState: { alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#64748b' },
  emptySubtitle: { fontSize: 13, color: '#94a3b8', marginTop: 4 },
});