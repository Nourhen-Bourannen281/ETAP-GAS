// src/screens/admin/Conformite.js
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

export default function Conformite({ navigation }) {
  const [user, setUser] = useState(null);
  const [conformites, setConformites] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const IP = '192.168.1.114';
  const API_URL = `http://${IP}:5000/api`;

  useEffect(() => {
    loadUserData();
    fetchData();
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

  const fetchData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const [conformitesRes, statsRes] = await Promise.all([
        axios.get(`${API_URL}/conformites`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/conformites/stats`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setConformites(conformitesRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const renderConformiteItem = ({ item }) => (
    <View style={styles.conformiteCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.documentType}>{item.document?.type || '-'}</Text>
        <View style={[styles.statusBadge, item.statut === 'Conforme' ? styles.statusConforme : styles.statusNonConforme]}>
          <Text style={styles.statusText}>{item.statut}</Text>
        </View>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.infoText}><Text style={styles.infoLabel}>Type contrôle:</Text> {item.typeControle}</Text>
        <Text style={styles.infoText}><Text style={styles.infoLabel}>Date:</Text> {new Date(item.dateControle).toLocaleString()}</Text>
        <Text style={styles.infoText}><Text style={styles.infoLabel}>Commentaire:</Text> {item.commentaire || '-'}</Text>
        <Text style={styles.infoText}>
          <Text style={styles.infoLabel}>Vérifié par:</Text>
          {item.verifiePar?.nom ? ` ${item.verifiePar.nom}` : ' 🤖 Système automatique'}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1e3a8a" />
        <Text style={styles.loadingText}>Chargement des contrôles...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Conformité Douanière</Text>
        <Text style={styles.subtitle}>Vérification automatique des documents et contrôles douaniers</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.total || 0}</Text>
          <Text style={styles.statLabel}>Total contrôles</Text>
        </View>
        <View style={[styles.statCard, styles.successCard]}>
          <Text style={[styles.statValue, styles.successValue]}>{stats.conforme || 0}</Text>
          <Text style={styles.statLabel}>✅ Conformes</Text>
        </View>
        <View style={[styles.statCard, styles.dangerCard]}>
          <Text style={[styles.statValue, styles.dangerValue]}>{stats.nonConforme || 0}</Text>
          <Text style={styles.statLabel}>❌ Non conformes</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.douane || 0}</Text>
          <Text style={styles.statLabel}>Contrôles douane</Text>
        </View>
      </View>

      {/* Liste */}
      {conformites.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>Aucun contrôle enregistré</Text>
          <Text style={styles.emptySubtitle}>Les vérifications automatiques apparaîtront ici.</Text>
        </View>
      ) : (
        <FlatList
          data={conformites}
          keyExtractor={(item) => item._id}
          renderItem={renderConformiteItem}
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
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },

  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    marginTop: -10,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    width: '48%',
    margin: '1%',
    elevation: 2,
  },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#1e3a8a' },
  statLabel: { fontSize: 11, color: '#64748b', marginTop: 4 },
  successCard: { backgroundColor: '#dcfce7' },
  dangerCard: { backgroundColor: '#fee2e2' },
  successValue: { color: '#16a34a' },
  dangerValue: { color: '#dc2626' },

  conformiteCard: {
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
  documentType: { fontSize: 14, fontWeight: 'bold', color: '#1e3a8a' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusConforme: { backgroundColor: '#dcfce7' },
  statusNonConforme: { backgroundColor: '#fee2e2' },
  statusText: { fontSize: 11, fontWeight: '500' },
  cardBody: { gap: 6 },
  infoText: { fontSize: 13, color: '#64748b' },
  infoLabel: { fontWeight: '600', color: '#1e293b' },

  emptyState: { alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#64748b' },
  emptySubtitle: { fontSize: 13, color: '#94a3b8', marginTop: 4 },
});