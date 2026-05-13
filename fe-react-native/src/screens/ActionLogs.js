// src/screens/admin/ActionLogs.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Picker } from '@react-native-picker/picker';

export default function ActionLogs({ navigation }) {
  const [user, setUser] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('');
  const [filterType, setFilterType] = useState('');

  const IP = '192.168.1.114';
  const API_URL = `http://${IP}:5000/api`;

  useEffect(() => {
    loadUserData();
    fetchLogs();
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

  const fetchLogs = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_URL}/action-logs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLogs(response.data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getActionTypeStyle = (type) => {
    switch (type) {
      case 'CREATE':
        return styles.actionCreate;
      case 'UPDATE':
        return styles.actionUpdate;
      case 'DELETE':
        return styles.actionDelete;
      case 'LOGIN':
        return styles.actionLogin;
      case 'LOGOUT':
        return styles.actionLogout;
      default:
        return styles.actionDefault;
    }
  };

  const filteredLogs = logs.filter(log => {
    if (filter && !log.utilisateur?.nom?.toLowerCase().includes(filter.toLowerCase())) {
      return false;
    }
    if (filterType && log.action !== filterType) {
      return false;
    }
    return true;
  });

  const onRefresh = () => {
    setRefreshing(true);
    fetchLogs();
  };

  const renderLogItem = ({ item }) => (
    <View style={styles.logCard}>
      <View style={styles.logHeader}>
        <Text style={styles.logDate}>{new Date(item.dateAction).toLocaleString()}</Text>
        <View style={[styles.actionBadge, getActionTypeStyle(item.action)]}>
          <Text style={styles.actionBadgeText}>{item.action}</Text>
        </View>
      </View>
      <View style={styles.logBody}>
        <Text style={styles.logUser}>
          <Text style={styles.logLabel}>Utilisateur:</Text> {item.utilisateur?.nom || '-'}
        </Text>
        <Text style={styles.logRole}>
          <Text style={styles.logLabel}>Rôle:</Text> {item.utilisateur?.role || '-'}
        </Text>
        <Text style={styles.logDescription}>
          <Text style={styles.logLabel}>Description:</Text> {item.description}
        </Text>
        <Text style={styles.logIp}>
          <Text style={styles.logLabel}>IP:</Text> {item.ipAddress || '-'}
        </Text>
      </View>
    </View>
  );

  if (!isAdmin) {
    return (
      <View style={styles.center}>
        <Text style={styles.accessDeniedText}>⛔ Accès réservé aux administrateurs</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1e3a8a" />
        <Text style={styles.loadingText}>Chargement des journaux...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Journal des Actions</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={fetchLogs}>
          <Text style={styles.refreshButtonText}>🔄 Actualiser</Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <TextInput
          style={styles.filterInput}
          placeholder="Filtrer par utilisateur..."
          value={filter}
          onChangeText={setFilter}
        />
        <View style={styles.filterPicker}>
          <Picker
            selectedValue={filterType}
            onValueChange={(val) => setFilterType(val)}
            style={styles.picker}
          >
            <Picker.Item label="Tous les types" value="" />
            <Picker.Item label="Création" value="CREATE" />
            <Picker.Item label="Modification" value="UPDATE" />
            <Picker.Item label="Suppression" value="DELETE" />
            <Picker.Item label="Connexion" value="LOGIN" />
            <Picker.Item label="Déconnexion" value="LOGOUT" />
          </Picker>
        </View>
      </View>

      {/* Logs List */}
      {filteredLogs.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>Aucun journal trouvé</Text>
        </View>
      ) : (
        <FlatList
          data={filteredLogs}
          keyExtractor={(item) => item._id}
          renderItem={renderLogItem}
          scrollEnabled={false}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  accessDeniedText: { fontSize: 16, color: '#dc2626', fontWeight: '600' },
  loadingText: { marginTop: 10, color: '#64748b' },
  
  header: {
    backgroundColor: '#1e3a8a',
    padding: 20,
    paddingTop: 60,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontSize: 22, fontWeight: 'bold', color: '#fff', fontFamily: 'Georgia' },
  refreshButton: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  refreshButtonText: { color: '#fff', fontSize: 12 },
  
  filtersContainer: { padding: 16, backgroundColor: '#fff', marginBottom: 8 },
  filterInput: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 10, marginBottom: 10, fontSize: 14 },
  filterPicker: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, overflow: 'hidden' },
  picker: { height: 50 },
  
  logCard: { backgroundColor: '#fff', margin: 16, marginTop: 0, marginBottom: 12, padding: 16, borderRadius: 12, elevation: 2 },
  logHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  logDate: { fontSize: 12, color: '#64748b' },
  actionBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  actionBadgeText: { fontSize: 10, fontWeight: '600', color: '#fff' },
  actionCreate: { backgroundColor: '#10b981' },
  actionUpdate: { backgroundColor: '#3b82f6' },
  actionDelete: { backgroundColor: '#ef4444' },
  actionLogin: { backgroundColor: '#8b5cf6' },
  actionLogout: { backgroundColor: '#f59e0b' },
  actionDefault: { backgroundColor: '#64748b' },
  logBody: { gap: 6 },
  logUser: { fontSize: 13, color: '#1e293b' },
  logRole: { fontSize: 13, color: '#1e293b' },
  logDescription: { fontSize: 13, color: '#1e293b' },
  logIp: { fontSize: 13, color: '#1e293b' },
  logLabel: { fontWeight: '600', color: '#64748b' },
  
  emptyState: { alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#64748b' },
});