// src/screens/admin/Referentiel.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';

// Import des composants référentiels
import TypeProduits from './TypeProduits';
import SousProduits from './SousProduits';
import Pays from './Pays';
import Banques from './Banques';
import Navires from './Navires';
import ModesPaiement from './ModePaiement';
import TypesFacture from './TypesFactures';
import Products from './Prodcts';

const initialLayout = { width: Dimensions.get('window').width };

export default function Referentiel({ navigation }) {
  const [user, setUser] = useState(null);
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'typeProduits', title: 'Types de Produits' },
    { key: 'sousProduits', title: 'Sous-Produits' },
    { key: 'pays', title: 'Pays' },
    { key: 'banques', title: 'Banques' },
    { key: 'navires', title: 'Navires' },
    { key: 'modesPaiement', title: 'Modes de Paiement' },
    { key: 'typesFacture', title: 'Types de Facture' },
    { key: 'products', title: 'Produits' },
  ]);

  useEffect(() => {
    loadUserData();
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

  // Vérifier si l'utilisateur est admin
  if (!isAdmin) {
    return (
      <View style={styles.center}>
        <Text style={styles.accessDeniedText}>
          ⛔ Accès réservé aux administrateurs
        </Text>
      </View>
    );
  }

  // Configuration des scènes pour TabView
  const renderScene = SceneMap({
    typeProduits: () => <TypeProduits navigation={navigation} />,
    sousProduits: () => <SousProduits navigation={navigation} />,
    pays: () => <Pays navigation={navigation} />,
    banques: () => <Banques navigation={navigation} />,
    navires: () => <Navires navigation={navigation} />,
    modesPaiement: () => <ModesPaiement navigation={navigation} />,
    typesFacture: () => <TypesFacture navigation={navigation} />,
    products: () => <Products navigation={navigation} />,
  });

  // Barre d'onglets personnalisée
  const renderTabBar = (props) => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.tabBarScroll}
      contentContainerStyle={styles.tabBarContent}
    >
      {props.navigationState.routes.map((route, i) => (
        <TouchableOpacity
          key={route.key}
          style={[
            styles.tabButton,
            index === i && styles.tabButtonActive,
          ]}
          onPress={() => setIndex(i)}
        >
          <Text
            style={[
              styles.tabButtonText,
              index === i && styles.tabButtonTextActive,
            ]}
          >
            {route.title}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Gestion du Référentiel</Text>
          <Text style={styles.subtitle}>Paramétrage général de l'application</Text>
        </View>
      </View>

      {/* TabView avec onglets */}
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        renderTabBar={renderTabBar}
        onIndexChange={setIndex}
        initialLayout={initialLayout}
        swipeEnabled={true}
        style={styles.tabView}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  accessDeniedText: {
    fontSize: 16,
    color: '#dc2626',
    fontWeight: '500',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  headerContent: {
    maxWidth: 1200,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: 'Georgia',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  tabView: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  tabBarScroll: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tabBarContent: {
    paddingHorizontal: 16,
  },
  tabButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginHorizontal: 2,
    borderRadius: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    backgroundColor: 'rgba(224, 242, 254, 0.8)',
    borderBottomColor: '#38bdf8',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  tabButtonTextActive: {
    color: '#1e3a8a',
  },
});