// src/screens/shared/Paiements.js
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

export default function Paiements({ navigation }) {
  const [user, setUser] = useState(null);
  const [paiements, setPaiements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const IP = '192.168.1.114';
  const API_URL = `http://${IP}:5000/api`;

  useEffect(() => {
    loadUserData();
    fetchPaiements();
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

  const fetchPaiements = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_URL}/paiements`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPaiements(response.data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const validerPaiement = async (id) => {
    if (!isAdmin) {
      Alert.alert('Erreur', "Seul l'Admin peut valider un paiement");
      return;
    }
    Alert.alert(
      'Confirmation',
      'Valider ce paiement ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Valider',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              await axios.patch(`${API_URL}/paiements/${id}/valider`, {}, {
                headers: { Authorization: `Bearer ${token}` }
              });
              Alert.alert('Succès', 'Paiement validé');
              fetchPaiements();
            } catch (error) {
              Alert.alert('Erreur', 'Erreur lors de la validation');
            }
          },
        },
      ]
    );
  };

  const getStatusClass = (statut) => {
    switch (statut?.toLowerCase()) {
      case 'payé':
      case 'validé':
        return styles.statusSuccess;
      case 'en attente':
        return styles.statusWarning;
      case 'annulé':
        return styles.statusDanger;
      default:
        return styles.statusDefault;
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPaiements();
  };

  const renderPaiementItem = ({ item }) => (
    <View style={styles.paiementCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.paiementNumber}>{item.numeroPaiement || item._id.slice(-6)}</Text>
        <Text style={styles.paiementMode}>{item.modePaiement}</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.infoText}><Text style={styles.infoLabel}>Facture:</Text> {item.facture?.numeroFacture || item.factureId || '-'}</Text>
        <Text style={styles.infoText}><Text style={styles.infoLabel}>Montant:</Text> {item.montant} {item.devise || 'TND'}</Text>
        <Text style={styles.infoText}><Text style={styles.infoLabel}>Date:</Text> {new Date(item.datePaiement || item.createdAt).toLocaleDateString()}</Text>
        <View style={[styles.statusBadge, getStatusClass(item.statut)]}>
          <Text style={styles.statusText}>{item.statut}</Text>
        </View>
      </View>
      {item.statut === 'En attente' && isAdmin && (
        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.validateButton} onPress={() => validerPaiement(item._id)}>
            <Text style={styles.validateButtonText}>✓ Valider</Text>
          </TouchableOpacity>
        </View>
      )}
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
        <Text style={styles.title}>Gestion des Paiements</Text>
      </View>

      {paiements.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>💰</Text>
          <Text style={styles.emptyTitle}>Aucun paiement trouvé</Text>
        </View>
      ) : (
        <FlatList
          data={paiements}
          keyExtractor={(item) => item._id}
          renderItem={renderPaiementItem}
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
  
  paiementCard: { backgroundColor: '#fff', margin: 16, marginTop: 0, marginBottom: 12, padding: 16, borderRadius: 12, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  paiementNumber: { fontSize: 14, fontWeight: 'bold', color: '#1e3a8a' },
  paiementMode: { fontSize: 12, color: '#64748b' },
  cardBody: { gap: 8 },
  infoText: { fontSize: 13, color: '#1e293b' },
  infoLabel: { fontWeight: '600', color: '#64748b' },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginTop: 8 },
  statusWarning: { backgroundColor: '#fef3c7' },
  statusSuccess: { backgroundColor: '#dcfce7' },
  statusDanger: { backgroundColor: '#fee2e2' },
  statusDefault: { backgroundColor: '#e2e8f0' },
  statusText: { fontSize: 11, fontWeight: '500' },
  cardActions: { marginTop: 12, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  validateButton: { backgroundColor: '#10b981', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  validateButtonText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  
  emptyState: { alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#64748b' },
});