// src/screens/commercial/ExportImport.js
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
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Picker } from '@react-native-picker/picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export default function ExportImport({ navigation }) {
  const [user, setUser] = useState(null);
  const [emissions, setEmissions] = useState([]);
  const [receptions, setReceptions] = useState([]);
  const [contrats, setContrats] = useState([]);
  const [pays, setPays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('emissions');
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedContrat, setSelectedContrat] = useState('');

  const IP = '192.168.1.114';
  const API_URL = `http://${IP}:5000/api`;

  useEffect(() => {
    loadUserData();
    fetchAllData();
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

  const fetchAllData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const [emissionsRes, receptionsRes, contratsRes, paysRes] = await Promise.all([
        axios.get(`${API_URL}/emissions`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/receptions`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/contrats`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/pays`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setEmissions(emissionsRes.data);
      setReceptions(receptionsRes.data);
      setContrats(contratsRes.data);
      setPays(paysRes.data);
    } catch (error) {
      console.error('Erreur:', error);
      Alert.alert('Erreur', 'Erreur de chargement');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleExport = async (format) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_URL}/export/${activeTab}/${format}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/pdf' });
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result.split(',')[1];
        const fileUri = FileSystem.documentDirectory + `${activeTab}_${Date.now()}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
        await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: FileSystem.EncodingType.Base64 });

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri);
        }
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      Alert.alert('Erreur', "Erreur lors de l'export");
    }
  };

  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'],
      });

      if (result.type === 'success') {
        const formData = new FormData();
        formData.append('file', {
          uri: result.uri,
          name: result.name,
          type: result.mimeType,
        });

        const token = await AsyncStorage.getItem('token');
        await axios.post(`${API_URL}/import/${activeTab}`, formData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        });
        Alert.alert('Succès', `Import ${activeTab} réussi`);
        fetchAllData();
      }
    } catch (error) {
      Alert.alert('Erreur', "Erreur lors de l'import");
    }
  };

  const handleAssociate = async () => {
    if (!selectedItem || !selectedContrat) {
      Alert.alert('Erreur', 'Sélectionnez un contrat');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      await axios.patch(
        `${API_URL}/associate/${activeTab === 'emissions' ? 'emission' : 'reception'}/${selectedItem._id}`,
        { contratId: selectedContrat },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Succès', 'Association réussie');
      setShowModal(false);
      setSelectedContrat('');
      setSelectedItem(null);
      fetchAllData();
    } catch (error) {
      Alert.alert('Erreur', "Erreur d'association");
    }
  };

  const handleDelete = async (id, numero) => {
    Alert.alert(
      'Confirmation',
      `Supprimer ${numero} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              await axios.delete(`${API_URL}/${activeTab === 'emissions' ? 'emissions' : 'receptions'}/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              Alert.alert('Succès', 'Supprimé avec succès');
              fetchAllData();
            } catch (error) {
              Alert.alert('Erreur', "Erreur lors de la suppression");
            }
          },
        },
      ]
    );
  };

  const currentList = activeTab === 'emissions' ? emissions : receptions;

  const onRefresh = () => {
    setRefreshing(true);
    fetchAllData();
  };

  const renderItem = ({ item }) => (
    <View style={styles.itemCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.itemNumber}>{activeTab === 'emissions' ? item.numeroEmission : item.numeroReception}</Text>
        <View style={[styles.contratBadge, item.contrat ? styles.associatedBadge : styles.notAssociatedBadge]}>
          <Text style={styles.contratText}>{item.contrat?.numeroContrat || 'Non associé'}</Text>
        </View>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.infoText}>
          <Text style={styles.infoLabel}>{activeTab === 'emissions' ? 'Destination:' : 'Origine:'}</Text>
          {activeTab === 'emissions' ? item.destination?.nom || '-' : item.origine?.nom || '-'}
        </Text>
        <Text style={styles.infoText}><Text style={styles.infoLabel}>Date:</Text> {new Date(item.dateEmission || item.dateReception).toLocaleDateString()}</Text>
        <Text style={styles.infoText}><Text style={styles.infoLabel}>Statut:</Text> {item.statut || '-'}</Text>
      </View>
      <View style={styles.cardActions}>
        {!item.contrat && (
          <TouchableOpacity style={styles.associateButton} onPress={() => {
            setSelectedItem(item);
            setShowModal(true);
          }}>
            <Text style={styles.buttonText}>🔗 Associer</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item._id, item.numeroEmission || item.numeroReception)}>
          <Text style={styles.buttonText}>🗑️ Supprimer</Text>
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
        <Text style={styles.title}>Export / Import</Text>
        <Text style={styles.subtitle}>Gestion des données d'exportation et d'importation</Text>
      </View>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={[styles.actionButton, styles.excelButton]} onPress={() => handleExport('excel')}>
          <Text style={styles.actionButtonText}>📊 Exporter Excel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.pdfButton]} onPress={() => handleExport('pdf')}>
          <Text style={styles.actionButtonText}>📄 Exporter PDF</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.importButton]} onPress={handleImport}>
          <Text style={styles.actionButtonText}>📥 Importer Excel</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'emissions' && styles.tabActive]}
          onPress={() => setActiveTab('emissions')}
        >
          <Text style={[styles.tabText, activeTab === 'emissions' && styles.tabTextActive]}>📤 Émissions ({emissions.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'receptions' && styles.tabActive]}
          onPress={() => setActiveTab('receptions')}
        >
          <Text style={[styles.tabText, activeTab === 'receptions' && styles.tabTextActive]}>📥 Réceptions ({receptions.length})</Text>
        </TouchableOpacity>
      </View>

      {/* Liste */}
      {currentList.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyTitle}>Aucune donnée</Text>
          <Text style={styles.emptySubtitle}>Aucune {activeTab === 'emissions' ? 'émission' : 'réception'} enregistrée.</Text>
        </View>
      ) : (
        <FlatList
          data={currentList}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          scrollEnabled={false}
        />
      )}

      {/* Modal Association */}
      <Modal visible={showModal} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Associer un contrat</Text>

            <Text style={styles.modalLabel}>Contrat *</Text>
            <Picker
              selectedValue={selectedContrat}
              onValueChange={(val) => setSelectedContrat(val)}
              style={styles.picker}
            >
              <Picker.Item label="-- Choisir un contrat --" value="" />
              {contrats.map(c => (
                <Picker.Item key={c._id} label={c.numeroContrat} value={c._id} />
              ))}
            </Picker>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowModal(false)}>
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleAssociate}>
                <Text style={styles.saveButtonText}>Associer</Text>
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
  loadingText: { marginTop: 10, color: '#64748b' },

  header: {
    backgroundColor: '#1e3a8a',
    padding: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: { fontSize: 22, fontWeight: 'bold', color: '#fff', fontFamily: 'Georgia' },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },

  actionsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 25,
    alignItems: 'center',
  },
  excelButton: { backgroundColor: '#10b981' },
  pdfButton: { backgroundColor: '#ef4444' },
  importButton: { backgroundColor: '#3b82f6' },
  actionButtonText: { color: '#fff', fontWeight: '600', fontSize: 12 },

  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 12,
  },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#1e3a8a' },
  tabText: { fontSize: 13, color: '#64748b' },
  tabTextActive: { color: '#1e3a8a', fontWeight: '600' },

  itemCard: {
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
  itemNumber: { fontSize: 14, fontWeight: 'bold', color: '#1e3a8a' },
  contratBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  associatedBadge: { backgroundColor: '#dcfce7' },
  notAssociatedBadge: { backgroundColor: '#fee2e2' },
  contratText: { fontSize: 11, fontWeight: '500' },
  cardBody: { gap: 6, marginBottom: 12 },
  infoText: { fontSize: 13, color: '#64748b' },
  infoLabel: { fontWeight: '600', color: '#1e293b' },
  cardActions: { flexDirection: 'row', gap: 8, marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  associateButton: { flex: 1, backgroundColor: '#f59e0b', paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  deleteButton: { flex: 1, backgroundColor: '#ef4444', paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 12, fontWeight: '500' },

  emptyState: { alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#64748b' },
  emptySubtitle: { fontSize: 13, color: '#94a3b8', marginTop: 4 },

  modalContainer: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 20, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  modalLabel: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 8, marginTop: 12 },
  picker: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, marginBottom: 8 },
  modalButtons: { flexDirection: 'row', marginTop: 20, gap: 12 },
  cancelButton: { flex: 1, backgroundColor: '#e2e8f0', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  cancelButtonText: { color: '#64748b', fontWeight: '600' },
  saveButton: { flex: 1, backgroundColor: '#1e3a8a', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontWeight: '600' },
});