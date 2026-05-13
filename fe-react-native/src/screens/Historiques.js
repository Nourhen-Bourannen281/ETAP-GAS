// src/screens/admin/Historique.js
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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Picker } from '@react-native-picker/picker';

export default function Historique({ navigation }) {
  const [user, setUser] = useState(null);
  const [historique, setHistorique] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [entityType, setEntityType] = useState('');
  const [page, setPage] = useState(1);

  const IP = '192.168.1.114';
  const API_URL = `http://${IP}:5000/api`;

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (user) {
      fetchHistorique();
      if (isAdmin) fetchStats();
    }
  }, [entityType, page, user]);

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

  const fetchHistorique = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      let url;
      if (isAdmin) {
        url = `${API_URL}/historique?entityType=${entityType}&page=${page}&limit=10`;
      } else {
        url = `${API_URL}/historique/me`;
      }

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setHistorique(isAdmin ? res.data.data : res.data);
    } catch (err) {
      console.error('Erreur historique:', err);
      setHistorique([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get(`${API_URL}/historique/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const getActionClass = (action) => {
    const a = (action || '').toLowerCase();
    if (a === 'creation' || a === 'create') return styles.actionCreate;
    if (a === 'modification' || a === 'update') return styles.actionUpdate;
    if (a === 'suppression' || a === 'delete') return styles.actionDelete;
    return styles.actionDefault;
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistorique();
    if (isAdmin) fetchStats();
  };

  const renderHistoriqueItem = ({ item }) => (
    <View style={styles.historiqueCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.entityType}>{item.entityType}</Text>
        <View style={[styles.actionBadge, getActionClass(item.action)]}>
          <Text style={styles.actionBadgeText}>{item.action}</Text>
        </View>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.infoText}>
          <Text style={styles.infoLabel}>Statut:</Text> {item.ancienStatut && item.nouveauStatut ? `${item.ancienStatut} → ${item.nouveauStatut}` : '-'}
        </Text>
        <Text style={styles.infoText}>
          <Text style={styles.infoLabel}>Détails:</Text> {item.details || '-'}
        </Text>
        <Text style={styles.infoText}>
          <Text style={styles.infoLabel}>Utilisateur:</Text> {item.utilisateur ? `${item.utilisateur.nom} (${item.utilisateur.email})` : '-'}
        </Text>
        <Text style={styles.infoText}>
          <Text style={styles.infoLabel}>Date:</Text> {new Date(item.createdAt).toLocaleString()}
        </Text>
        <Text style={styles.infoText}>
          <Text style={styles.infoLabel}>IP:</Text> {item.ipAddress || '-'}
        </Text>
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1e3a8a" />
        <Text style={styles.loadingText}>Chargement de l'historique...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Historique</Text>
        <Text style={styles.subtitle}>Suivi des actions sur les commandes, factures, contrats et livraisons</Text>
      </View>

      {/* Filtre Admin */}
      {isAdmin && (
        <View style={styles.filterContainer}>
          <Text style={styles.filterLabel}>Filtrer par type</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={entityType}
              onValueChange={(val) => {
                setEntityType(val);
                setPage(1);
              }}
              style={styles.picker}
            >
              <Picker.Item label="Tous" value="" />
              <Picker.Item label="Commande" value="Commande" />
              <Picker.Item label="Facture" value="Facture" />
              <Picker.Item label="Contrat" value="Contrat" />
              <Picker.Item label="Livraison" value="Livraison" />
            </Picker>
          </View>
        </View>
      )}

      {/* Stats Admin */}
      {isAdmin && stats.actionsParType && stats.actionsParType.length > 0 && (
        <View style={styles.statsContainer}>
          {stats.actionsParType.map((s, idx) => (
            <View key={idx} style={styles.statCard}>
              <Text style={styles.statValue}>{s.count}</Text>
              <Text style={styles.statLabel}>{s._id}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Liste Historique */}
      {historique.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📜</Text>
          <Text style={styles.emptyTitle}>Aucun historique</Text>
        </View>
      ) : (
        <FlatList
          data={historique}
          keyExtractor={(item) => item._id}
          renderItem={renderHistoriqueItem}
          scrollEnabled={false}
        />
      )}

      {/* Pagination Admin */}
      {isAdmin && (
        <View style={styles.pagination}>
          <TouchableOpacity
            style={[styles.pageButton, page === 1 && styles.pageButtonDisabled]}
            onPress={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
          >
            <Text style={styles.pageButtonText}>Précédent</Text>
          </TouchableOpacity>
          <Text style={styles.pageIndicator}>Page {page}</Text>
          <TouchableOpacity
            style={styles.pageButton}
            onPress={() => setPage((p) => p + 1)}
          >
            <Text style={styles.pageButtonText}>Suivant</Text>
          </TouchableOpacity>
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
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },

  filterContainer: {
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 0,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterLabel: { fontSize: 13, fontWeight: '600', color: '#334155' },
  pickerWrapper: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, minWidth: 150 },
  picker: { height: 45 },

  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 8,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    flex: 1,
    minWidth: 100,
    elevation: 2,
  },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#1e3a8a' },
  statLabel: { fontSize: 11, color: '#64748b', marginTop: 4 },

  historiqueCard: {
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
  entityType: { fontSize: 14, fontWeight: 'bold', color: '#1e3a8a' },
  actionBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  actionBadgeText: { fontSize: 11, fontWeight: '600', color: '#fff' },
  actionCreate: { backgroundColor: '#10b981' },
  actionUpdate: { backgroundColor: '#3b82f6' },
  actionDelete: { backgroundColor: '#ef4444' },
  actionDefault: { backgroundColor: '#64748b' },
  cardBody: { gap: 6 },
  infoText: { fontSize: 13, color: '#64748b' },
  infoLabel: { fontWeight: '600', color: '#1e293b' },

  emptyState: { alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#64748b' },

  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    gap: 16,
  },
  pageButton: {
    backgroundColor: '#1e3a8a',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  pageButtonDisabled: {
    backgroundColor: '#cbd5e1',
  },
  pageButtonText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  pageIndicator: { fontSize: 13, color: '#64748b' },
});