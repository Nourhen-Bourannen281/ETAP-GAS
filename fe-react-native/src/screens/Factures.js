// src/screens/commercial/Factures.js
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
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export default function Factures({ navigation }) {
  const [user, setUser] = useState(null);
  const [factures, setFactures] = useState([]);
  const [typesFacture, setTypesFacture] = useState([]);
  const [contrats, setContrats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    typeFacture: '',
    contrat: '',
    montantHT: '',
    dateEcheance: '',
  });

  const IP = '192.168.1.114';
  const API_URL = `http://${IP}:5000/api`;

  useEffect(() => {
    loadUserData();
    fetchFactures();
    fetchTypesFacture();
    fetchContrats();
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
  const isCommercial = user?.role === 'Commercial';

  const fetchFactures = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_URL}/factures`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFactures(response.data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchTypesFacture = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_URL}/types-facture`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTypesFacture(response.data);
    } catch (error) {
      console.error('Erreur types facture:', error);
    }
  };

  const fetchContrats = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_URL}/contrats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setContrats(response.data);
    } catch (error) {
      console.error('Erreur contrats:', error);
    }
  };

  const handleCreateFacture = async () => {
    if (!formData.typeFacture || !formData.contrat || !formData.montantHT || !formData.dateEcheance) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      await axios.post(`${API_URL}/factures`, {
        ...formData,
        montantHT: parseFloat(formData.montantHT),
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Alert.alert('Succès', 'Facture créée avec succès');
      setShowModal(false);
      setFormData({ typeFacture: '', contrat: '', montantHT: '', dateEcheance: '' });
      fetchFactures();
    } catch (error) {
      Alert.alert('Erreur', error.response?.data?.message || 'Erreur lors de la création');
    }
  };

  const handleUpdateStatut = async (id, newStatut) => {
    Alert.alert(
      'Confirmation',
      `Changer le statut de cette facture en "${newStatut}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              await axios.patch(`${API_URL}/factures/${id}/statut`, { statut: newStatut }, {
                headers: { Authorization: `Bearer ${token}` }
              });
              Alert.alert('Succès', 'Statut mis à jour');
              fetchFactures();
            } catch (error) {
              Alert.alert('Erreur', 'Erreur lors de la mise à jour');
            }
          },
        },
      ]
    );
  };

  const handleDeleteFacture = async (id) => {
    Alert.alert(
      'Confirmation',
      'Supprimer cette facture ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              await axios.delete(`${API_URL}/factures/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              Alert.alert('Succès', 'Facture supprimée');
              fetchFactures();
            } catch (error) {
              Alert.alert('Erreur', 'Erreur lors de la suppression');
            }
          },
        },
      ]
    );
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

  const onRefresh = () => {
    setRefreshing(true);
    fetchFactures();
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
          <Text style={styles.statusText}>{item.statut}</Text>
        </View>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.pdfButton} onPress={() => handleExportPDF(item._id, item.numeroFacture)}>
          <Text style={styles.buttonText}>📄 PDF</Text>
        </TouchableOpacity>
        {item.statut !== 'Payée' && (
          <>
            <TouchableOpacity style={styles.payButton} onPress={() => handleUpdateStatut(item._id, 'Payée')}>
              <Text style={styles.buttonText}>✓ Payer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => handleUpdateStatut(item._id, 'Annulée')}>
              <Text style={styles.buttonText}>✗ Annuler</Text>
            </TouchableOpacity>
          </>
        )}
        <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteFacture(item._id)}>
          <Text style={styles.buttonText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1e3a8a" />
        <Text style={styles.loadingText}>Chargement des factures...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Gestion des Factures</Text>
        {(isAdmin || isCommercial) && (
          <TouchableOpacity style={styles.newButton} onPress={() => setShowModal(true)}>
            <Text style={styles.newButtonText}>+ Nouvelle Facture</Text>
          </TouchableOpacity>
        )}
      </View>

      {factures.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📄</Text>
          <Text style={styles.emptyTitle}>Aucune facture</Text>
        </View>
      ) : (
        <FlatList
          data={factures}
          keyExtractor={(item) => item._id}
          renderItem={renderFactureItem}
          scrollEnabled={false}
        />
      )}

      {/* Modal Création Facture */}
      <Modal visible={showModal} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalTitle}>Créer une facture</Text>

            <Text style={styles.modalLabel}>Type de facture *</Text>
            <Picker selectedValue={formData.typeFacture} onValueChange={(val) => setFormData({ ...formData, typeFacture: val })} style={styles.picker}>
              <Picker.Item label="Sélectionner un type" value="" />
              {typesFacture.map(t => <Picker.Item key={t._id} label={`${t.nom} (${t.devise})`} value={t._id} />)}
            </Picker>

            <Text style={styles.modalLabel}>Contrat *</Text>
            <Picker selectedValue={formData.contrat} onValueChange={(val) => setFormData({ ...formData, contrat: val })} style={styles.picker}>
              <Picker.Item label="Sélectionner un contrat" value="" />
              {contrats.map(c => <Picker.Item key={c._id} label={c.numeroContrat} value={c._id} />)}
            </Picker>

            <Text style={styles.modalLabel}>Montant HT *</Text>
            <TextInput style={styles.modalInput} placeholder="Montant HT" value={formData.montantHT} onChangeText={(val) => setFormData({ ...formData, montantHT: val })} keyboardType="numeric" />

            <Text style={styles.modalLabel}>Date d'échéance *</Text>
            <TextInput style={styles.modalInput} placeholder="YYYY-MM-DD" value={formData.dateEcheance} onChangeText={(val) => setFormData({ ...formData, dateEcheance: val })} />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowModal(false)}>
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleCreateFacture}>
                <Text style={styles.saveButtonText}>Créer</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontSize: 22, fontWeight: 'bold', color: '#fff', fontFamily: 'Georgia' },
  newButton: { backgroundColor: '#10b981', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  newButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  
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
  cardActions: { flexDirection: 'row', gap: 8, marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  pdfButton: { flex: 1, backgroundColor: '#3b82f6', paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  payButton: { flex: 1, backgroundColor: '#10b981', paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  cancelButton: { flex: 1, backgroundColor: '#f59e0b', paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  deleteButton: { backgroundColor: '#ef4444', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 12, fontWeight: '500' },
  
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
  saveButton: { flex: 1, backgroundColor: '#1e3a8a', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontWeight: '600' },
});