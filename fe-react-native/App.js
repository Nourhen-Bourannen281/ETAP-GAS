// App.js
import React from 'react';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, StyleSheet } from 'react-native';
import Navbar from './src/components/Navbar';

// Imports des écrans
import LandingScreen from './src/screens/LandingScreen';
import LoginScreen from './src/screens/LoginScreen';
import AdminDashboard from './src/screens/admin/AdminDashboard';
import CommercialDashboard from './src/screens/commercial/CommercialDashboard';
import ClientDashboard from './src/screens/client/ClientDashboard';
import FournisseurDashboard from './src/screens/fournisseur/FournisseurDashboard';
import TransporteurDashboard from './src/screens/transporteur/TransporteurDashboard';
import Users from './src/screens/Users';
import Referentiel from './src/screens/admin/referentiels/Referentiel';
import GestionStock from './src/screens/admin/GestionStock';
import Contrats from './src/screens/commercial/Contrats';
import Commandes from './src/screens/Commandes';
import Livraisons from './src/screens/Livraisons';
import Factures from './src/screens/Factures';
import ExportImport from './src/screens/ExportImport';
import Conformite from './src/screens/Conformite';
import Historique from './src/screens/Historiques';
import Paiements from './src/screens/Paiements';
import Notifications from './src/screens/Notifications';
import Rapports from './src/screens/Rapports';
import ActionLogs from './src/screens/ActionLogs';
import MesFactures from './src/screens/MesFactures';
import TransporteurLivraisons from './src/screens/transporteur/TransporteurLivraions';
import Chatbot from './src/components/Chatbot';
import Cabotage from './src/screens/Cabotage';
import VenteLocale from './src/screens/VenteLocale';

const Stack = createStackNavigator();

// Composant avec Navbar - utilise useNavigation() à l'intérieur
function ProtectedLayout({ children }) {
  const navigation = useNavigation(); // ✅ Utiliser useNavigation ici
  return (
    <View style={styles.protectedContainer}>
      <Navbar navigation={navigation} />
      <View style={styles.protectedContent}>
        {children}
      </View>
      {/*<Chatbot />*/}
    </View>
  );
}

// Écrans protégés - version simplifiée
function AdminDashboardScreen() {
  return (
    <ProtectedLayout>
      <AdminDashboard />
    </ProtectedLayout>
  );
}

function CommercialDashboardScreen() {
  return (
    <ProtectedLayout>
      <CommercialDashboard />
    </ProtectedLayout>
  );
}

function ClientDashboardScreen() {
  return (
    <ProtectedLayout>
      <ClientDashboard />
    </ProtectedLayout>
  );
}

function FournisseurDashboardScreen() {
  return (
    <ProtectedLayout>
      <FournisseurDashboard />
    </ProtectedLayout>
  );
}

function TransporteurDashboardScreen() {
  return (
    <ProtectedLayout>
      <TransporteurDashboard />
    </ProtectedLayout>
  );
}

function UsersScreen() {
  return (
    <ProtectedLayout>
      <Users />
    </ProtectedLayout>
  );
}

function ReferentielScreen() {
  return (
    <ProtectedLayout>
      <Referentiel />
    </ProtectedLayout>
  );
}

function GestionStockScreen() {
  return (
    <ProtectedLayout>
      <GestionStock />
    </ProtectedLayout>
  );
}

function ContratsScreen() {
  return (
    <ProtectedLayout>
      <Contrats />
    </ProtectedLayout>
  );
}

function CommandesScreen() {
  return (
    <ProtectedLayout>
      <Commandes />
    </ProtectedLayout>
  );
}

function LivraisonsScreen() {
  return (
    <ProtectedLayout>
      <Livraisons />
    </ProtectedLayout>
  );
}

function FacturesScreen() {
  return (
    <ProtectedLayout>
      <Factures />
    </ProtectedLayout>
  );
}

function ExportImportScreen() {
  return (
    <ProtectedLayout>
      <ExportImport />
    </ProtectedLayout>
  );
}

function ConformiteScreen() {
  return (
    <ProtectedLayout>
      <Conformite />
    </ProtectedLayout>
  );
}

function HistoriqueScreen() {
  return (
    <ProtectedLayout>
      <Historique />
    </ProtectedLayout>
  );
}

function PaiementsScreen() {
  return (
    <ProtectedLayout>
      <Paiements />
    </ProtectedLayout>
  );
}

function NotificationsScreen() {
  return (
    <ProtectedLayout>
      <Notifications />
    </ProtectedLayout>
  );
}

function RapportsScreen() {
  return (
    <ProtectedLayout>
      <Rapports />
    </ProtectedLayout>
  );
}

function ActionLogsScreen() {
  return (
    <ProtectedLayout>
      <ActionLogs />
    </ProtectedLayout>
  );
}

function MesFacturesScreen() {
  return (
    <ProtectedLayout>
      <MesFactures />
    </ProtectedLayout>
  );
}

function TransporteurLivraisonsScreen() {
  return (
    <ProtectedLayout>
      <TransporteurLivraisons />
    </ProtectedLayout>
  );
}

function CabotageScreen() {
  return (
    <ProtectedLayout>
      <Cabotage />
    </ProtectedLayout>
  );
}

function VenteLocaleScreen() {
  return (
    <ProtectedLayout>
      <VenteLocale />
    </ProtectedLayout>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, presentation: 'card' }}>
        {/* Écrans sans navbar */}
        <Stack.Screen name="Landing" component={LandingScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        
        {/* Écrans protégés */}
        <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
        <Stack.Screen name="CommercialDashboard" component={CommercialDashboardScreen} />
        <Stack.Screen name="ClientDashboard" component={ClientDashboardScreen} />
        <Stack.Screen name="FournisseurDashboard" component={FournisseurDashboardScreen} />
        <Stack.Screen name="TransporteurDashboard" component={TransporteurDashboardScreen} />
        <Stack.Screen name="Users" component={UsersScreen} />
        <Stack.Screen name="Referentiel" component={ReferentielScreen} />
        <Stack.Screen name="GestionStock" component={GestionStockScreen} />
        <Stack.Screen name="Contrats" component={ContratsScreen} />
        <Stack.Screen name="Commandes" component={CommandesScreen} />
        <Stack.Screen name="Livraisons" component={LivraisonsScreen} />
        <Stack.Screen name="Factures" component={FacturesScreen} />
        <Stack.Screen name="ExportImport" component={ExportImportScreen} />
        <Stack.Screen name="Conformite" component={ConformiteScreen} />
        <Stack.Screen name="Historique" component={HistoriqueScreen} />
        <Stack.Screen name="Paiements" component={PaiementsScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="Rapports" component={RapportsScreen} />
        <Stack.Screen name="ActionLogs" component={ActionLogsScreen} />
        <Stack.Screen name="MesFactures" component={MesFacturesScreen} />
        <Stack.Screen name="TransporteurLivraisons" component={TransporteurLivraisonsScreen} />
        <Stack.Screen name="Cabotage" component={CabotageScreen} />
        <Stack.Screen name="VenteLocale" component={VenteLocaleScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  protectedContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  protectedContent: {
    flex: 1,
    marginTop: 60,
  },
});