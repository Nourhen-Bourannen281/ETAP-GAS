// src/screens/LandingScreen.js
import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Animated,
  Dimensions,
} from 'react-native';

const { width, height } = Dimensions.get('window');

export default function LandingScreen({ navigation }) {
  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const navbarOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const FeatureCard = ({ icon, title, description }) => (
    <Animated.View style={[styles.featureCard, { opacity: fadeAnim }]}>
      <View style={styles.featureIcon}>
        <Text style={styles.featureIconText}>{icon}</Text>
      </View>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDescription}>{description}</Text>
    </Animated.View>
  );

  const StatCard = ({ value, label }) => (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Navbar animée */}
      <Animated.View style={[styles.navbar, { opacity: navbarOpacity }]}>
        <View style={styles.navbarInner}>
          <Text style={styles.logo}>
            Gas<Text style={styles.logoAccent}>Pro</Text>
          </Text>
          <TouchableOpacity 
            style={styles.ctaNav}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.ctaNavText}>Portail Client</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Hero Section */}
        <Animated.View style={[styles.hero, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.heroBadge}>
            <View style={styles.pulseDot} />
            <Text style={styles.heroBadgeText}>Plateforme Officielle ETAP</Text>
          </View>
          <Text style={styles.heroTitle}>
            Gérez votre stock avec <Text style={styles.heroTitleAccent}>précision et élégance</Text>
          </Text>
          <Text style={styles.heroSubtitle}>
            ETAP-GAS simplifie la gestion de vos hydrocarbures, contrats et opérations logistiques
          </Text>
          <TouchableOpacity 
            style={styles.btnPrimary}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.btnPrimaryText}>Accéder au Dashboard</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Features Section */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Solutions Avancées</Text>
          <Text style={styles.sectionSubtitle}>
            Une architecture logicielle robuste pour des opérations sans compromis.
          </Text>

          <FeatureCard icon="📄" title="Gestion des Contrats" description="Suivi automatisé des contrats d'achat et de vente" />
          <FeatureCard icon="📊" title="Inventaire Stratégique" description="Visualisation en temps réel des stocks critiques" />
          <FeatureCard icon="🛒" title="Pilotage Commercial" description="Cycle de commande complet et validation" />
          <FeatureCard icon="📋" title="Suivi Douanier" description="Traçabilité totale des cargaisons" />
          <FeatureCard icon="💰" title="Facturation Multidevise" description="Factures en TND et USD" />
          <FeatureCard icon="📈" title="Analyse Décisionnelle" description="Tableaux de bord dynamiques" />
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <View style={styles.statsGrid}>
            <StatCard value="100%" label="Digitalisation des Flux" />
            <StatCard value="< 2h" label="Traitement des Commandes" />
            <StatCard value="Multi" label="Devises (TND / USD)" />
            <StatCard value="24/7" label="Monitoring Stocks" />
          </View>
        </View>

        {/* CTA Section */}
        <View style={styles.ctaSection}>
          <View style={styles.ctaCard}>
            <Text style={styles.ctaTitle}>Prêt à optimiser vos ressources ?</Text>
            <Text style={styles.ctaText}>
              Rejoignez l'écosystème ETAP-GAS et transformez vos opérations commerciales.
            </Text>
            <TouchableOpacity 
              style={styles.btnPrimary}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.btnPrimaryText}>Commencer l'expérience</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2026 ETAP-GAS — Tous droits réservés.</Text>
          <Text style={styles.footerCredit}>Propulsé par l'Ingénierie MERN</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  navbar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingTop: 50,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(30, 58, 138, 0.06)',
  },
  navbarInner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 },
  logo: { fontSize: 24, fontWeight: '800', color: '#1e3a8a' },
  logoAccent: { color: '#38bdf8' },
  ctaNav: { paddingHorizontal: 20, paddingVertical: 8, backgroundColor: '#1e3a8a', borderRadius: 10 },
  ctaNavText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  hero: { paddingTop: 120, paddingHorizontal: 20, paddingBottom: 60, alignItems: 'center', backgroundColor: '#f8fafc' },
  heroBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, backgroundColor: 'rgba(56, 189, 248, 0.1)', borderRadius: 50, marginBottom: 20 },
  pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#38bdf8', marginRight: 8 },
  heroBadgeText: { fontSize: 12, fontWeight: '500', color: '#0284c7' },
  heroTitle: { fontSize: 32, fontWeight: '800', textAlign: 'center', color: '#0f172a', marginBottom: 16 },
  heroTitleAccent: { color: '#1e3a8a' },
  heroSubtitle: { fontSize: 16, color: '#64748b', textAlign: 'center', marginBottom: 32 },
  btnPrimary: { backgroundColor: '#1e3a8a', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 12 },
  btnPrimaryText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  featuresSection: { padding: 20 },
  sectionTitle: { fontSize: 28, fontWeight: '700', textAlign: 'center', color: '#0f172a', marginBottom: 12 },
  sectionSubtitle: { fontSize: 15, color: '#64748b', textAlign: 'center', marginBottom: 30 },
  featureCard: { backgroundColor: '#f8fafc', borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  featureIcon: { width: 52, height: 52, borderRadius: 14, backgroundColor: '#1e3a8a', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  featureIconText: { fontSize: 24 },
  featureTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginBottom: 8 },
  featureDescription: { fontSize: 14, color: '#64748b' },
  statsSection: { paddingVertical: 60, paddingHorizontal: 20, backgroundColor: '#1e3a8a' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statItem: { width: '48%', alignItems: 'center', marginBottom: 30 },
  statValue: { fontSize: 32, fontWeight: '800', color: '#fff', marginBottom: 4 },
  statLabel: { fontSize: 12, color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center' },
  ctaSection: { paddingVertical: 60, paddingHorizontal: 20, backgroundColor: '#f8fafc' },
  ctaCard: { backgroundColor: '#fff', borderRadius: 24, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  ctaTitle: { fontSize: 24, fontWeight: '700', textAlign: 'center', color: '#0f172a', marginBottom: 12 },
  ctaText: { fontSize: 15, color: '#64748b', textAlign: 'center', marginBottom: 24 },
  footer: { paddingVertical: 40, paddingHorizontal: 20, backgroundColor: '#0f172a', alignItems: 'center' },
  footerText: { fontSize: 12, color: 'rgba(255, 255, 255, 0.5)', marginBottom: 8 },
  footerCredit: { fontSize: 11, color: 'rgba(255, 255, 255, 0.3)' },
});