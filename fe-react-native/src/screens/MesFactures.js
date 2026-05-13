// src/screens/client/MesFactures.js
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
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Picker } from '@react-native-picker/picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export default function MesFactures({ navigation }) {
  const [user, setUser] = useState(null);
  const [factures, setFactures] = useState([]);
  const [filteredFactures, setFilteredFactures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const IP = '192.168.1.114';
  const API_URL = `http://${IP}:5000/api`;

  useEffect(() => {
    loadUserData();
    fetchMesFactures();
  }, []);

  useEffect(() => {
    filterFactures();
  }, [searchTerm, statusFilter, factures]);

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

  const fetchMesFactures = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_URL}/factures`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFactures(response.data);
      setFilteredFactures(response.data);
      calculateStats(response.data);
    } catch (error) {
      console.error('Erreur:', error);
      Alert.alert('Erreur', 'Erreur lors du chargement des factures');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateStats = (data) => {
    const total = data.length;
    const enAttente = data.filter(f => f.statut === 'En attente').length;
    const payees = data.filter(f => f.statut === 'Payée').length;
    const totalMontant = data.reduce((sum, f) => sum + (f.montantTTC || 0), 0);
    setStats({ total, enAttente, payees, totalMontant });
  };

  const filterFactures = () => {
    let filtered = [...factures];

    if (searchTerm) {
      filtered = filtered.filter(f =>
        f.numeroFacture?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.contrat?.numeroContrat?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(f => f.statut === statusFilter);
    }

    setFilteredFactures(filtered);
  };

  const handleExportPDF = async (id, numeroFacture) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_URL}/factures/${id}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result.split(',')[1];
        const fileUri = FileSystem.documentDirectory + `facture_${numeroFacture}.pdf`;
        await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: FileSystem.EncodingType.Base64 });

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri);
        } else {
          Alert.alert('Info', 'Le partage n\'est pas disponible');
        }
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors du téléchargement');
    }
  };

  const getStatutClass = (statut) => {
    switch (statut) {
      case 'En attente':
        return styles.statusWarning;
      case 'Payée':
        return styles.statusSuccess;
      case 'Annulée':
        return styles.statusDanger;
      default:
        return styles.statusDefault;
    }
  };

  const getStatutText = (statut) => {
    switch (statut) {
      case 'En attente':
        return 'En attente de paiement';
      case 'Payée':
        return 'Payée';
      case 'Annulée':
        return 'Annulée';
      default:
        return statut;
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchMesFactures();
  };

  const renderFactureItem = ({ item }) => (
    <View style={styles.factureCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.factureNumber}>{item.numeroFacture}</Text>
        <Text style={styles.factureType}>{item.typeFacture?.nom}</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.infoText}><Text style={styles.infoLabel}>Contrat:</Text> {item.contrat?.numeroContrat || '-'}</Text>
        <Text style={styles.infoText}><Text style={styles.infoLabel}>Montant TTC:</Text> {item.montantTTC?.toLocaleString()} {item.devise}</Text>
        <Text style={styles.infoText}><Text style={styles.infoLabel}>Échéance:</Text> {item.dateEcheance ? new Date(item.dateEcheance).toLocaleDateString() : '-'}</Text>
        <View style={[styles.statusBadge, getStatutClass(item.statut)]}>
          <Text style={styles.statusText}>{getStatutText(item.statut)}</Text>
        </View>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.pdfButton} onPress={() => handleExportPDF(item._id, item.numeroFacture)}>
          <Text style={styles.buttonText}>📄 PDF</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1e3a8a" />
        <Text style={styles.loadingText}>Chargement de vos factures...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Mes Factures</Text>
      </View>

      {/* Stats */}
      {stats && (
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total Factures</Text>
          </View>
          <View style={[styles.statCard, styles.warningCard]}>
            <Text style={[styles.statValue, styles.warningValue]}>{stats.enAttente}</Text>
            <Text style={styles.statLabel}>En attente</Text>
          </View>
          <View style={[styles.statCard, styles.successCard]}>
            <Text style={[styles.statValue, styles.successValue]}>{stats.payees}</Text>
            <Text style={styles.statLabel}>Payées</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalMontant.toLocaleString()} TND</Text>
            <Text style={styles.statLabel}>Montant total</Text>
          </View>
        </View>
      )}

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher par numéro de facture ou contrat..."
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
        <View style={styles.filterPicker}>
          <Picker
            selectedValue={statusFilter}
            onValueChange={(val) => setStatusFilter(val)}
            style={styles.picker}
          >
            <Picker.Item label="Tous les statuts" value="all" />
            <Picker.Item label="En attente" value="En attente" />
            <Picker.Item label="Payée" value="Payée" />
            <Picker.Item label="Annulée" value="Annulée" />
          </Picker>
        </View>
      </View>

      {/* Factures List */}
      {filteredFactures.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📄</Text>
          <Text style={styles.emptyTitle}>Aucune facture trouvée</Text>
        </View>
      ) : (
        <FlatList
          data={filteredFactures}
          keyExtractor={(item) => item._id}
          renderItem={renderFactureItem}
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
  
  statsContainer: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, marginTop: -20 },
  statCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, alignItems: 'center', flex: 1, margin: 4, elevation: 2 },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#1e3a8a' },
  statLabel: { fontSize: 11, color: '#64748b', marginTop: 4 },
  warningCard: { backgroundColor: '#fef3c7' },
  successCard: { backgroundColor: '#dcfce7' },
  warningValue: { color: '#f59e0b' },
  successValue: { color: '#16a34a' },
  
  filtersContainer: { padding: 16, backgroundColor: '#fff', marginBottom: 8 },
  searchInput: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 10, marginBottom: 10, fontSize: 14 },
  filterPicker: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, overflow: 'hidden' },
  picker: { height: 50 },
  
  factureCard: { backgroundColor: '#fff', margin: 16, marginTop: 0, marginBottom: 12, padding: 16, borderRadius: 12, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  factureNumber: { fontSize: 14, fontWeight: 'bold', color: '#1e3a8a' },
  factureType: { fontSize: 12, color: '#64748b' },
  cardBody: { gap: 8, marginBottom: 12 },
  infoText: { fontSize: 13, color: '#1e293b' },
  infoLabel: { fontWeight: '600', color: '#64748b' },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  statusWarning: { backgroundColor: '#fef3c7' },
  statusSuccess: { backgroundColor: '#dcfce7' },
  statusDanger: { backgroundColor: '#fee2e2' },
  statusDefault: { backgroundColor: '#e2e8f0' },
  statusText: { fontSize: 11, fontWeight: '500' },
  cardActions: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  pdfButton: { backgroundColor: '#3b82f6', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  
  emptyState: { alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#64748b' },
});