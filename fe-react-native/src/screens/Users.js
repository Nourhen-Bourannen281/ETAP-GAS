// src/screens/admin/Users.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Picker } from '@react-native-picker/picker';

export default function Users({ navigation }) {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    email: '',
    role: 'Client',
    motDePasse: '',
  });

  const IP = '192.168.1.114';
  const API_URL = `http://${IP}:5000/api`;

  useEffect(() => {
    loadUserData();
    fetchUsers();
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

  const fetchUsers = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Erreur:', error);
      Alert.alert('Erreur', 'Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSave = async () => {
    if (!form.nom || !form.prenom || !form.email) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      if (editUser) {
        const updateData = { nom: form.nom, prenom: form.prenom, email: form.email, role: form.role };
        if (form.motDePasse) updateData.motDePasse = form.motDePasse;
        await axios.put(`${API_URL}/users/${editUser._id}`, updateData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        Alert.alert('Succès', 'Utilisateur modifié');
      } else {
        await axios.post(`${API_URL}/users`, form, {
          headers: { Authorization: `Bearer ${token}` }
        });
        Alert.alert('Succès', 'Utilisateur créé');
      }
      setShowModal(false);
      resetForm();
      fetchUsers();
    } catch (error) {
      Alert.alert('Erreur', error.response?.data?.message || 'Une erreur est survenue');
    }
  };

  const resetForm = () => {
    setForm({ nom: '', prenom: '', email: '', role: 'Client', motDePasse: '' });
    setEditUser(null);
  };

  const handleToggle = async (userId, currentStatus) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.patch(`${API_URL}/users/${userId}/toggle`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Alert.alert('Info', 'Statut utilisateur modifié');
      fetchUsers();
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors du changement de statut');
    }
  };

  const confirmDelete = (id) => {
    setDeleteId(id);
    setShowConfirm(true);
  };

  const handleDelete = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.delete(`${API_URL}/users/${deleteId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Alert.alert('Succès', 'Utilisateur supprimé');
      fetchUsers();
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors de la suppression');
    } finally {
      setShowConfirm(false);
      setDeleteId(null);
    }
  };

  const getInitials = (nom, prenom) => {
    return `${nom?.charAt(0) || ''}${prenom?.charAt(0) || ''}`.toUpperCase();
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'Admin': return styles.badgeAdmin;
      case 'Commercial': return styles.badgeCommercial;
      case 'Client': return styles.badgeClient;
      case 'Transporteur': return styles.badgeTransporteur;
      case 'Fournisseur': return styles.badgeFournisseur;
      default: return styles.badgeDefault;
    }
  };

  const filteredUsers = users.filter(u =>
    `${u.nom} ${u.prenom}`.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const activeUsers = users.filter(u => u.actif).length;
  const inactiveUsers = users.filter(u => !u.actif).length;

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const renderUserItem = ({ item }) => (
    <View style={styles.userCard}>
      <View style={styles.userInfo}>
        <View style={styles.userAvatar}>
          <Text style={styles.avatarText}>{getInitials(item.nom, item.prenom)}</Text>
        </View>
        <View style={styles.userDetails}>
          <Text style={styles.userName}>{item.nom} {item.prenom}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
        </View>
      </View>
      <View style={styles.userMeta}>
        <View style={[styles.roleBadge, getRoleBadgeClass(item.role)]}>
          <Text style={styles.roleBadgeText}>{item.role}</Text>
        </View>
        <View style={[styles.statusDot, item.actif ? styles.statusActive : styles.statusInactive]}>
          <Text style={styles.statusText}>{item.actif ? 'Actif' : 'Inactif'}</Text>
        </View>
      </View>
      <View style={styles.userActions}>
        <TouchableOpacity style={styles.toggleButton} onPress={() => handleToggle(item._id, item.actif)}>
          <Text style={styles.toggleButtonText}>{item.actif ? '🔴' : '🟢'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.editButton} onPress={() => {
          setEditUser(item);
          setForm({ ...item, motDePasse: '' });
          setShowModal(true);
        }}>
          <Text style={styles.actionButtonText}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={() => confirmDelete(item._id)}>
          <Text style={styles.actionButtonText}>🗑️</Text>
        </TouchableOpacity>
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
        <View>
          <Text style={styles.title}>Gestion des Utilisateurs</Text>
          <Text style={styles.subtitle}>Gérez les comptes et les permissions</Text>
        </View>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{users.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{activeUsers}</Text>
            <Text style={styles.statLabel}>Actifs</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{inactiveUsers}</Text>
            <Text style={styles.statLabel}>Inactifs</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => { resetForm(); setShowModal(true); }}>
          <Text style={styles.addButtonText}>+ Nouvel utilisateur</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un utilisateur..."
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Liste */}
      {filteredUsers.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>👥</Text>
          <Text style={styles.emptyTitle}>Aucun utilisateur trouvé</Text>
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item._id}
          renderItem={renderUserItem}
          scrollEnabled={false}
        />
      )}

      {/* Modal */}
      <Modal visible={showModal} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editUser ? 'Modifier l\'utilisateur' : 'Créer un utilisateur'}</Text>

            <Text style={styles.modalLabel}>Nom</Text>
            <TextInput style={styles.modalInput} placeholder="Nom" value={form.nom} onChangeText={(val) => setForm({ ...form, nom: val })} />

            <Text style={styles.modalLabel}>Prénom</Text>
            <TextInput style={styles.modalInput} placeholder="Prénom" value={form.prenom} onChangeText={(val) => setForm({ ...form, prenom: val })} />

            <Text style={styles.modalLabel}>Email</Text>
            <TextInput style={styles.modalInput} placeholder="Email" value={form.email} onChangeText={(val) => setForm({ ...form, email: val })} keyboardType="email-address" />

            <Text style={styles.modalLabel}>Rôle</Text>
            <Picker selectedValue={form.role} onValueChange={(val) => setForm({ ...form, role: val })} style={styles.picker}>
              <Picker.Item label="Admin" value="Admin" />
              <Picker.Item label="Commercial" value="Commercial" />
              <Picker.Item label="Client" value="Client" />
              <Picker.Item label="Transporteur" value="Transporteur" />
              <Picker.Item label="Fournisseur" value="Fournisseur" />
            </Picker>

            {!editUser && (
              <>
                <Text style={styles.modalLabel}>Mot de passe</Text>
                <TextInput style={styles.modalInput} placeholder="Mot de passe" value={form.motDePasse} onChangeText={(val) => setForm({ ...form, motDePasse: val })} secureTextEntry />
              </>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowModal(false)}>
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>Enregistrer</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Confirm Dialog */}
      <Modal visible={showConfirm} animationType="fade" transparent={true}>
        <View style={styles.confirmContainer}>
          <View style={styles.confirmDialog}>
            <Text style={styles.confirmIcon}>⚠️</Text>
            <Text style={styles.confirmTitle}>Confirmer la suppression</Text>
            <Text style={styles.confirmText}>Cette action est irréversible. Voulez-vous vraiment supprimer cet utilisateur ?</Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity style={styles.confirmCancel} onPress={() => setShowConfirm(false)}>
                <Text>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmDelete} onPress={handleDelete}>
                <Text style={{ color: '#fff' }}>Supprimer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  },
  title: { fontSize: 22, fontWeight: 'bold', color: '#fff', fontFamily: 'Georgia' },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },

  statsContainer: { flexDirection: 'row', marginTop: 12, gap: 8 },
  statCard: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10, padding: 8, alignItems: 'center', flex: 1 },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.7)' },

  addButton: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, alignSelf: 'flex-start', marginTop: 12 },
  addButtonText: { color: '#fff', fontWeight: '600' },

  searchContainer: { padding: 16 },
  searchInput: { backgroundColor: '#fff', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0' },

  userCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  userInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  userAvatar: { width: 50, height: 50, borderRadius: 12, backgroundColor: '#1e3a8a', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  userDetails: { flex: 1 },
  userName: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  userEmail: { fontSize: 13, color: '#64748b', marginTop: 2 },
  userMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  roleBadgeText: { fontSize: 11, fontWeight: '500' },
  badgeAdmin: { backgroundColor: '#eef2ff' },
  badgeCommercial: { backgroundColor: '#dcfce7' },
  badgeClient: { backgroundColor: '#dbeafe' },
  badgeTransporteur: { backgroundColor: '#fef3c7' },
  badgeFournisseur: { backgroundColor: '#f3e8ff' },
  badgeDefault: { backgroundColor: '#e2e8f0' },
  statusDot: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusActive: { backgroundColor: '#dcfce7' },
  statusInactive: { backgroundColor: '#fee2e2' },
  statusText: { fontSize: 11, fontWeight: '500' },
  userActions: { flexDirection: 'row', gap: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  toggleButton: { flex: 1, backgroundColor: '#fef3c7', paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  editButton: { flex: 1, backgroundColor: '#dbeafe', paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  deleteButton: { flex: 1, backgroundColor: '#fee2e2', paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  toggleButtonText: { fontSize: 16 },
  actionButtonText: { fontSize: 16 },

  emptyState: { alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#64748b' },

  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 20, padding: 20, maxHeight: '80%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  modalLabel: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 8, marginTop: 12 },
  modalInput: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 12, fontSize: 14 },
  picker: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, marginBottom: 8 },
  modalButtons: { flexDirection: 'row', marginTop: 20, gap: 12 },
  cancelButton: { flex: 1, backgroundColor: '#e2e8f0', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  cancelButtonText: { color: '#64748b', fontWeight: '600' },
  saveButton: { flex: 1, backgroundColor: '#1e3a8a', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontWeight: '600' },

  confirmContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  confirmDialog: { backgroundColor: '#fff', borderRadius: 16, padding: 24, alignItems: 'center', width: '80%' },
  confirmIcon: { fontSize: 48, marginBottom: 16 },
  confirmTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  confirmText: { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 20 },
  confirmButtons: { flexDirection: 'row', gap: 12 },
  confirmCancel: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#e2e8f0', borderRadius: 8 },
  confirmDelete: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#dc2626', borderRadius: 8 },
});