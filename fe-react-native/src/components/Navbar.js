// src/components/Navbar.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faTachometerAlt,
  faUsers,
  faBoxOpen,
  faBuilding,
  faFileContract,
  faShoppingCart,
  faTruckFast,
  faFileInvoiceDollar,
  faCheckCircle,
  faHistory,
  faBars,
  faRightFromBracket,
  faExchangeAlt,
  faCreditCard,
  faBell,
  faHome,
  faOilCan,
  faTimes
} from '@fortawesome/free-solid-svg-icons';

function Navbar({ navigation }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [role, setRole] = useState('Admin');
  const [userName, setUserName] = useState('');

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        setRole(user.role || 'Admin');
        setUserName(`${user.nom || ''} ${user.prenom || ''}`.trim() || user.email);
      }
    } catch (error) {
      console.error('Erreur chargement user:', error);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.clear();
    navigation.navigate('Login');
  };

  const styles = StyleSheet.create({
    topbar: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 60,
      backgroundColor: '#1a2c3e',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      zIndex: 1000,
    },
    burgerBtn: { padding: 8 },
    topbarRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    topbarRole: {
      color: '#94a3b8',
      fontSize: 12,
      backgroundColor: 'rgba(255,255,255,0.1)',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 20,
    },
    topbarLogout: { padding: 8 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
    sidebar: {
      position: 'absolute',
      top: 0,
      left: 0,
      bottom: 0,
      width: 280,
      backgroundColor: '#0f172a',
      zIndex: 1001,
    },
    sidebarHeader: {
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: '#1e293b',
      alignItems: 'center',
    },
    sidebarLogo: { fontSize: 18, fontWeight: 'bold', color: '#3b82f6', marginBottom: 8 },
    sidebarUserName: { fontSize: 12, color: '#94a3b8', marginBottom: 4 },
    sidebarRole: { fontSize: 11, color: '#64748b' },
    sidebarNav: { flex: 1, paddingVertical: 16 },
    sidebarLink: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 20,
      gap: 12,
    },
    sidebarLinkText: { fontSize: 14, color: '#94a3b8' },
    closeBtn: {
      position: 'absolute',
      top: 15,
      right: 15,
      padding: 8,
      zIndex: 1002,
    },
  });

  const renderLink = (screenName, icon, label) => (
    <TouchableOpacity
      key={screenName}
      style={styles.sidebarLink}
      onPress={() => {
        navigation.navigate(screenName);
        setIsSidebarOpen(false);
      }}
    >
      <FontAwesomeIcon icon={icon} size={18} color="#94a3b8" />
      <Text style={styles.sidebarLinkText}>{label}</Text>
    </TouchableOpacity>
  );

  const adminLinks = [
    { name: 'AdminDashboard', icon: faTachometerAlt, label: 'Dashboard' },
    { name: 'Users', icon: faUsers, label: 'Utilisateurs' },
    { name: 'Referentiel', icon: faBuilding, label: 'Référentiels' },
    { name: 'GestionStock', icon: faBoxOpen, label: 'Stock' },
    { name: 'Contrats', icon: faFileContract, label: 'Contrats' },
    { name: 'Commandes', icon: faShoppingCart, label: 'Commandes' },
    { name: 'Livraisons', icon: faTruckFast, label: 'Livraisons' },
    { name: 'Factures', icon: faFileInvoiceDollar, label: 'Factures' },
    { name: 'ExportImport', icon: faExchangeAlt, label: 'Export' },
    { name: 'Conformite', icon: faCheckCircle, label: 'Conformité' },
    { name: 'Historique', icon: faHistory, label: 'Historique' },
    { name: 'Paiements', icon: faCreditCard, label: 'Paiements' },
    { name: 'Notifications', icon: faBell, label: 'Notifications' },
    { name: 'VenteLocale', icon: faHome, label: 'Vente Locale' },
    { name: 'Cabotage', icon: faOilCan, label: 'Cabotage' }
  ];

  return (
    <>
      <View style={styles.topbar}>
        <TouchableOpacity style={styles.burgerBtn} onPress={() => setIsSidebarOpen(true)}>
          <FontAwesomeIcon icon={faBars} size={22} color="white" />
        </TouchableOpacity>
        <View style={styles.topbarRight}>
          <Text style={styles.topbarRole}>{role}</Text>
          <TouchableOpacity style={styles.topbarLogout} onPress={handleLogout}>
            <FontAwesomeIcon icon={faRightFromBracket} size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={isSidebarOpen}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsSidebarOpen(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setIsSidebarOpen(false)}
        >
          <View style={styles.sidebar}>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setIsSidebarOpen(false)}>
              <FontAwesomeIcon icon={faTimes} size={20} color="#94a3b8" />
            </TouchableOpacity>
            
            <View style={styles.sidebarHeader}>
              <Text style={styles.sidebarLogo}>OFPPT Logistique</Text>
              <Text style={styles.sidebarUserName}>{userName}</Text>
              <Text style={styles.sidebarRole}>{role}</Text>
            </View>

            <ScrollView style={styles.sidebarNav}>
              {adminLinks.map(link => renderLink(link.name, link.icon, link.label))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

export default Navbar;