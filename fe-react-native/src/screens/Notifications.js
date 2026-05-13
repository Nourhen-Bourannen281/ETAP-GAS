// src/screens/shared/Notifications.js
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

export default function Notifications({ navigation }) {
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const IP = '192.168.1.114';
  const API_URL = `http://${IP}:5000/api`;

  useEffect(() => {
    loadUserData();
    fetchNotifications();
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

  const fetchNotifications = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(response.data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.patch(`${API_URL}/notifications/${id}/lu`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNotifications();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.patch(`${API_URL}/notifications/mark-all-read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNotifications();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const deleteNotification = async (id) => {
    Alert.alert(
      'Confirmation',
      'Supprimer cette notification ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              await axios.delete(`${API_URL}/notifications/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              fetchNotifications();
            } catch (error) {
              console.error('Erreur:', error);
            }
          },
        },
      ]
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const renderNotificationItem = ({ item }) => (
    <View style={[styles.notificationCard, !item.lu && styles.unreadCard]}>
      <View style={styles.notifHeader}>
        <Text style={styles.notifType}>{item.type}</Text>
        <Text style={styles.notifDate}>{new Date(item.dateEnvoi).toLocaleString()}</Text>
      </View>
      <Text style={styles.notifMessage}>{item.message}</Text>
      <View style={styles.notifActions}>
        {!item.lu && (
          <TouchableOpacity style={styles.readButton} onPress={() => markAsRead(item._id)}>
            <Text style={styles.readButtonText}>✓ Marquer comme lu</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.deleteButton} onPress={() => deleteNotification(item._id)}>
          <Text style={styles.deleteButtonText}>🗑️ Supprimer</Text>
        </TouchableOpacity>
      </View>
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
        <Text style={styles.title}>Notifications</Text>
        {notifications.some(n => !n.lu) && (
          <TouchableOpacity style={styles.markAllButton} onPress={markAllAsRead}>
            <Text style={styles.markAllButtonText}>✓ Tout marquer comme lu</Text>
          </TouchableOpacity>
        )}
      </View>

      {notifications.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🔔</Text>
          <Text style={styles.emptyTitle}>Aucune notification</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id}
          renderItem={renderNotificationItem}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontSize: 22, fontWeight: 'bold', color: '#fff', fontFamily: 'Georgia' },
  markAllButton: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  markAllButtonText: { color: '#fff', fontSize: 12 },
  
  notificationCard: { backgroundColor: '#fff', margin: 16, marginTop: 0, marginBottom: 12, padding: 16, borderRadius: 12, elevation: 2 },
  unreadCard: { borderLeftWidth: 4, borderLeftColor: '#3b82f6', backgroundColor: '#eff6ff' },
  notifHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  notifType: { fontSize: 12, fontWeight: '600', color: '#1e3a8a' },
  notifDate: { fontSize: 11, color: '#64748b' },
  notifMessage: { fontSize: 14, color: '#1e293b', marginBottom: 12, lineHeight: 20 },
  notifActions: { flexDirection: 'row', gap: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  readButton: { flex: 1, backgroundColor: '#3b82f6', paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  readButtonText: { color: '#fff', fontSize: 12, fontWeight: '500' },
  deleteButton: { flex: 1, backgroundColor: '#ef4444', paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  deleteButtonText: { color: '#fff', fontSize: 12, fontWeight: '500' },
  
  emptyState: { alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#64748b' },
});