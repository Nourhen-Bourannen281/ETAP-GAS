// src/screens/admin/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [stockAlerts, setStockAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const IP = '192.168.1.114';
  const API_URL = `http://${IP}:5000/api`;

  const fetchAllData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        setLoading(false);
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      const [statsRes, alertsRes] = await Promise.all([
        axios.get(`${API_URL}/dashboard/stats`, { headers }),
        axios.get(`${API_URL}/dashboard/stock-alerts`, { headers })
      ]);
      
      if (statsRes.data.success) setStats(statsRes.data.data);
      if (alertsRes.data.success) setStockAlerts(alertsRes.data.data);
      
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Erreur:', error);
      if (error.response?.status === 401) {
        // Token invalide
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAllData();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1e3a8a" />
        <Text style={styles.loadingText}>Chargement du dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard Administrateur</Text>
        <Text style={styles.subtitle}>
          Dernière mise à jour: {lastUpdate.toLocaleTimeString('fr-FR')}
        </Text>
      </View>

      {/* KPI Cards */}
      <View style={styles.kpiGrid}>
        <View style={styles.kpiCard}>
          <View style={styles.kpiContent}>
            <View>
              <Text style={styles.kpiLabel}>Commandes en attente</Text>
              <Text style={styles.kpiValue}>{stats?.orders?.pending || 0}</Text>
            </View>
            <View style={[styles.kpiIcon, styles.iconYellow]}>
              <Text style={styles.iconText}>📦</Text>
            </View>
          </View>
        </View>

        <View style={styles.kpiCard}>
          <View style={styles.kpiContent}>
            <View>
              <Text style={styles.kpiLabel}>Chiffre d'affaires (mois)</Text>
              <Text style={styles.kpiValue}>
                {(stats?.revenue?.month || 0).toLocaleString()} TND
              </Text>
            </View>
            <View style={[styles.kpiIcon, styles.iconGreen]}>
              <Text style={styles.iconText}>💰</Text>
            </View>
          </View>
        </View>

        <View style={styles.kpiCard}>
          <View style={styles.kpiContent}>
            <View>
              <Text style={styles.kpiLabel}>Alertes stock</Text>
              <Text style={styles.kpiValue}>{stats?.stock?.lowStockCount || 0}</Text>
            </View>
            <View style={[styles.kpiIcon, styles.iconRed]}>
              <Text style={styles.iconText}>⚠️</Text>
            </View>
          </View>
        </View>

        <View style={styles.kpiCard}>
          <View style={styles.kpiContent}>
            <View>
              <Text style={styles.kpiLabel}>Utilisateurs actifs</Text>
              <Text style={styles.kpiValue}>{stats?.users?.active || 0}</Text>
            </View>
            <View style={[styles.kpiIcon, styles.iconBlue]}>
              <Text style={styles.iconText}>👥</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Alertes Stock */}
      <View style={styles.stockCard}>
        <View style={styles.stockHeader}>
          <Text style={styles.stockTitle}>⚠️ Alertes Stock ({stockAlerts?.length || 0})</Text>
        </View>
        {!stockAlerts || stockAlerts.length === 0 ? (
          <View style={styles.stockEmpty}>
            <Text style={styles.stockEmptyText}>✅ Aucune alerte stock</Text>
          </View>
        ) : (
          <View>
            {stockAlerts.slice(0, 5).map((alert, index) => (
              <View key={index} style={styles.stockItem}>
                <View>
                  <Text style={styles.stockName}>{alert.productName || 'Produit'}</Text>
                  <Text style={styles.stockDetails}>
                    Stock: {alert.quantity} | Seuil: {alert.seuilMin}
                  </Text>
                </View>
                <View style={styles.stockPercent}>
                  <Text style={styles.stockPercentText}>
                    {Math.round((alert.quantity / alert.seuilMin) * 100)}%
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Stats utilisateurs par rôle */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>👥 Utilisateurs par rôle</Text>
        {stats?.users?.byRole?.map((role, idx) => (
          <View key={idx} style={styles.roleItem}>
            <Text style={styles.roleName}>{role._id}</Text>
            <Text style={styles.roleCount}>{role.count}</Text>
          </View>
        ))}
      </View>

      {/* Commandes récentes */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>📋 Commandes récentes</Text>
        {stats?.recentOrders?.length === 0 ? (
          <Text style={styles.emptyText}>Aucune commande</Text>
        ) : (
          stats?.recentOrders?.slice(0, 5).map((order, idx) => (
            <View key={idx} style={styles.orderItem}>
              <View>
                <Text style={styles.orderNumber}>{order.numeroCommande}</Text>
                <Text style={styles.orderClient}>{order.client?.nom} {order.client?.prenom}</Text>
              </View>
              <View style={styles.orderRight}>
                <Text style={styles.orderAmount}>{order.montantTotal?.toLocaleString()} TND</Text>
                <View style={[styles.orderStatus, getStatusStyle(order.statut)]}>
                  <Text style={styles.orderStatusText}>{order.statut}</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const getStatusStyle = (statut) => {
  switch(statut) {
    case 'Attente': return { backgroundColor: '#fef3c7' };
    case 'Validée': return { backgroundColor: '#dbeafe' };
    case 'Livrée': return { backgroundColor: '#d1fae5' };
    default: return { backgroundColor: '#f1f5f9' };
  }
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },
  loadingText: { marginTop: 10, color: '#64748b' },

  header: {
    backgroundColor: '#1e3a8a',
    padding: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 4 },

  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    marginTop: -10,
  },
  kpiCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    width: '48%',
    margin: '1%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  kpiContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kpiLabel: { fontSize: 11, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 },
  kpiValue: { fontSize: 20, fontWeight: 'bold', color: '#1a2c3e' },
  kpiIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  iconText: { fontSize: 20 },
  iconYellow: { backgroundColor: '#fef3c7' },
  iconGreen: { backgroundColor: '#dcfce7' },
  iconRed: { backgroundColor: '#fee2e2' },
  iconBlue: { backgroundColor: '#dbeafe' },

  stockCard: {
    backgroundColor: '#fff',
    margin: 12,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
  },
  stockHeader: { padding: 14, backgroundColor: '#fff8f0', borderBottomWidth: 1, borderBottomColor: '#ffe4cc' },
  stockTitle: { fontSize: 14, fontWeight: '600', color: '#1a2c3e' },
  stockEmpty: { padding: 30, alignItems: 'center' },
  stockEmptyText: { color: '#10b981' },
  stockItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  stockName: { fontSize: 14, fontWeight: '500', color: '#1a2c3e' },
  stockDetails: { fontSize: 11, color: '#64748b', marginTop: 2 },
  stockPercent: { backgroundColor: '#fee2e2', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  stockPercentText: { fontSize: 11, fontWeight: '600', color: '#ef4444' },

  sectionCard: {
    backgroundColor: '#fff',
    margin: 12,
    marginTop: 0,
    padding: 14,
    borderRadius: 12,
    elevation: 2,
  },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#1a2c3e', marginBottom: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#eef2ff' },

  roleItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  roleName: { fontSize: 13, color: '#1a2c3e' },
  roleCount: { fontSize: 13, fontWeight: '600', color: '#3b82f6' },

  orderItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  orderNumber: { fontSize: 13, fontWeight: '600', color: '#1a2c3e' },
  orderClient: { fontSize: 11, color: '#64748b', marginTop: 2 },
  orderRight: { alignItems: 'flex-end' },
  orderAmount: { fontSize: 13, fontWeight: '600', color: '#10b981' },
  orderStatus: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, marginTop: 4 },
  orderStatusText: { fontSize: 10, fontWeight: '500', color: '#1a2c3e' },
  emptyText: { textAlign: 'center', padding: 20, color: '#64748b' },
});