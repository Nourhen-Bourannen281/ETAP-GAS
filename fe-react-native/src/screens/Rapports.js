// src/screens/shared/Rapports.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export default function Rapports({ navigation }) {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const IP = '192.168.1.114';
  const API_URL = `http://${IP}:5000/api`;

  useEffect(() => {
    loadUserData();
    fetchStats();
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

  const fetchStats = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_URL}/rapports/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Erreur:', error);
      Alert.alert('Erreur', 'Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const exportPDF = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_URL}/rapports/export-pdf`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result.split(',')[1];
        const fileUri = FileSystem.documentDirectory + `rapport_${Date.now()}.pdf`;
        await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: FileSystem.EncodingType.Base64 });

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri);
        } else {
          Alert.alert('Info', 'Le partage n\'est pas disponible');
        }
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors de la génération du PDF');
    }
  };

  const exportExcel = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_URL}/rapports/export-excel`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result.split(',')[1];
        const fileUri = FileSystem.documentDirectory + `rapport_${Date.now()}.xlsx`;
        await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: FileSystem.EncodingType.Base64 });

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri);
        } else {
          Alert.alert('Info', 'Le partage n\'est pas disponible');
        }
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors de la génération du Excel');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1e3a8a" />
        <Text style={styles.loadingText}>Chargement des statistiques...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Tableau de Bord Reporting</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total Factures</Text>
          <Text style={styles.statValue}>{stats.totalFactures || 0}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total Commandes</Text>
          <Text style={styles.statValue}>{stats.totalCommandes || 0}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>CA du Mois</Text>
          <Text style={styles.statValue}>{stats.caMois?.toLocaleString() || 0} TND</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>CA Total</Text>
          <Text style={styles.statValue}>{stats.caTotal?.toLocaleString() || 0} TND</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Paiements en attente</Text>
          <Text style={styles.statValue}>{stats.paiementsEnAttente || 0}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Livraisons en cours</Text>
          <Text style={styles.statValue}>{stats.livraisonsEnCours || 0}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Clients actifs</Text>
          <Text style={styles.statValue}>{stats.clientsActifs || 0}</Text>
        </View>
      </View>

      {isAdmin && (
        <View style={styles.exportButtons}>
          <TouchableOpacity style={[styles.exportButton, styles.pdfButton]} onPress={exportPDF}>
            <Text style={styles.exportButtonText}>📄 Exporter PDF</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.exportButton, styles.excelButton]} onPress={exportExcel}>
            <Text style={styles.exportButtonText}>📊 Exporter Excel</Text>
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
  
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '48%',
    margin: '1%',
    elevation: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  
  exportButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 16,
    gap: 16,
  },
  exportButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  pdfButton: {
    backgroundColor: '#ef4444',
  },
  excelButton: {
    backgroundColor: '#10b981',
  },
  exportButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});