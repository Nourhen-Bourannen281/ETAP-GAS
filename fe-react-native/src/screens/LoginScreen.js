// src/screens/LoginScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Animation values
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // 🔥 CONFIGURATION IMPORTANTE - Change selon ton environnement
  // Pour émulateur Android:
  // const API_URL = 'http://10.0.2.2:5000/api';
  
  // Pour vrai téléphone (même WiFi):
  const API_URL = 'http://192.168.1.114:5000/api'; // Remplace par ton IP
  
  // Pour tester si le backend répond
  const testBackendConnection = async () => {
    try {
      const response = await axios.get(`${API_URL.replace('/api', '')}/api/test`);
      console.log('Backend connecté:', response.data);
    } catch (error) {
      console.error('Backend non accessible:', error.message);
      Alert.alert('Erreur', 'Impossible de contacter le serveur. Vérifie que le backend tourne.');
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    
    try {
      console.log('Tentative de connexion avec:', { email });
      console.log('URL API:', `${API_URL}/auth/login`);
      
      // 🔥 Format des données - À ajuster selon ton backend
      const response = await axios.post(`${API_URL}/auth/login`, {
        email: email,
        motDePasse: password,
        // Si ton backend utilise "password" au lieu de "motDePasse", utilise:
        // password: password
      }, {
        timeout: 10000, // 10 secondes timeout
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log('Réponse reçue:', response.data);

      const { token, user } = response.data;

      if (token && user) {
        await AsyncStorage.setItem('token', token);
        await AsyncStorage.setItem('role', user.role);
        await AsyncStorage.setItem('user', JSON.stringify(user));

        Alert.alert('Succès', 'Connexion réussie !');

        // Redirection basée sur le rôle
        setTimeout(() => {
          if (user.role === 'Admin') {
            navigation.replace('AdminDashboard');
          } else if (user.role === 'Commercial') {
            navigation.replace('CommercialDashboard');
          } else if (user.role === 'Client') {
            navigation.replace('ClientDashboard');
          } else if (user.role === 'Transporteur') {
            navigation.replace('TransporteurDashboard');
          } else {
            navigation.replace('Dashboard');
          }
        }, 500);
      } else {
        Alert.alert('Erreur', 'Réponse du serveur invalide');
      }
      
    } catch (error) {
      console.error('Erreur complète:', error);
      
      if (error.code === 'ECONNABORTED') {
        Alert.alert('Erreur', 'Le serveur ne répond pas. Vérifie qu\'il est bien démarré.');
      } else if (error.response) {
        // Le serveur a répondu avec une erreur
        console.log('Erreur serveur:', error.response.data);
        Alert.alert(
          'Erreur de connexion',
          error.response.data?.message || error.response.data?.error || 'Email ou mot de passe incorrect'
        );
      } else if (error.request) {
        // La requête a été faite mais pas de réponse
        Alert.alert('Erreur', 'Impossible de contacter le serveur. Vérifie que le backend tourne sur ' + API_URL);
      } else {
        Alert.alert('Erreur', 'Une erreur est survenue: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Left Side - Branding */}
        <Animated.View 
          style={[
            styles.brandSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          <View style={styles.iconWrapper}>
            <View style={styles.icon}>
              <Text style={styles.iconText}>⛽</Text>
            </View>
          </View>
          <Text style={styles.title}>ETAP-GAS</Text>
          <Text style={styles.subtitle}>Gérez vos opérations gaz avec précision</Text>
          
          <View style={styles.features}>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>✓</Text>
              <Text style={styles.featureText}>Gestion des stocks</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>✓</Text>
              <Text style={styles.featureText}>Suivi des commandes</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>✓</Text>
              <Text style={styles.featureText}>Tableau de bord analytics</Text>
            </View>
          </View>
        </Animated.View>

        {/* Right Side - Form */}
        <Animated.View 
          style={[
            styles.formSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Bienvenue</Text>
            <Text style={styles.formSubtitle}>Connectez-vous à votre compte</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputIcon}>📧</Text>
                <TextInput
                  style={styles.input}
                  placeholder="votre@email.com"
                  placeholderTextColor="#94a3b8"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mot de passe</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="••••••••"
                  placeholderTextColor="#94a3b8"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Text style={styles.toggleIcon}>{showPassword ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.optionsRow}>
              <TouchableOpacity style={styles.checkboxRow}>
                <View style={styles.checkbox} />
                <Text style={styles.checkboxLabel}>Se souvenir de moi</Text>
              </TouchableOpacity>
              <TouchableOpacity>
                <Text style={styles.forgotLink}>Mot de passe oublié ?</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginButtonText}>Se connecter</Text>
              )}
            </TouchableOpacity>

            {/* Bouton de test */}
            <TouchableOpacity 
              style={styles.testButton}
              onPress={testBackendConnection}
            >
              <Text style={styles.testButtonText}>Tester la connexion au serveur</Text>
            </TouchableOpacity>

            <Text style={styles.footerText}>© 2024 ETAP-GAS. Tous droits réservés.</Text>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  brandSection: {
    backgroundColor: '#1e3a8a',
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  iconWrapper: {
    marginBottom: 20,
  },
  icon: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 24,
  },
  features: {
    width: '100%',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureIcon: {
    width: 24,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    textAlign: 'center',
    textAlignVertical: 'center',
    color: '#fff',
    marginRight: 12,
    fontSize: 12,
    fontWeight: 'bold',
  },
  featureText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
  },
  formSection: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 5,
  },
  formTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e3a8a',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  formSubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
  },
  inputIcon: {
    fontSize: 18,
    marginRight: 8,
    color: '#94a3b8',
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1e293b',
  },
  toggleIcon: {
    fontSize: 18,
    padding: 8,
    color: '#94a3b8',
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 16,
    height: 16,
    borderWidth: 2,
    borderColor: '#1e3a8a',
    borderRadius: 4,
    marginRight: 8,
  },
  checkboxLabel: {
    fontSize: 13,
    color: '#64748b',
  },
  forgotLink: {
    fontSize: 13,
    color: '#1e3a8a',
  },
  loginButton: {
    backgroundColor: '#1e3a8a',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  testButton: {
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 16,
  },
  testButtonText: {
    color: '#64748b',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  footerText: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
  },
});