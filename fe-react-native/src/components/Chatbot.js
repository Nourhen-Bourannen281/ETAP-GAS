// src/components/Chatbot.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Animated,
} from 'react-native';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [role, setRole] = useState('Client');
  const flatListRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Charger le rôle depuis AsyncStorage
  useEffect(() => {
    loadRole();
  }, []);

  const loadRole = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        setRole(user.role || 'Client');
      }
    } catch (error) {
      console.error('Erreur chargement rôle:', error);
    }
  };

  // Message d'accueil
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage = getWelcomeMessage();
      setMessages([{
        id: Date.now(),
        text: welcomeMessage,
        isUser: false,
        timestamp: new Date().toLocaleTimeString(),
      }]);
    }
  }, [role]);

  // Animation à l'ouverture
  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOpen]);

  const getWelcomeMessage = () => {
    const roleMessages = {
      Admin: "👋 Bonjour Administrateur !\n\nJe peux vous aider avec :\n• 📊 Dashboard et statistiques\n• 👥 Gestion des utilisateurs\n• 📦 Suivi du stock\n• 💰 Factures et paiements\n\nQue souhaitez-vous savoir ?",
      Commercial: "👋 Bonjour Commercial !\n\nJe suis là pour :\n• 🛒 Gérer les commandes\n• 🚚 Créer des livraisons\n• 🧾 Établir des factures\n• 📄 Suivre les contrats\n\nComment puis-je vous aider ?",
      Client: "👋 Bonjour cher client !\n\nJe peux vous aider à :\n• 🛍️ Passer des commandes\n• 📍 Suivre vos livraisons\n• 💳 Payer vos factures\n• 📜 Voir votre historique\n\nQue désirez-vous faire ?",
      Transporteur: "👋 Bonjour Transporteur !\n\nMes compétences :\n• 🚚 Gérer vos livraisons\n• 📍 Mettre à jour les statuts\n• 📊 Voir votre planning\n• 📞 Contacter les commerciaux\n\nComment puis-je vous aider ?",
      Fournisseur: "👋 Bonjour Fournisseur !\n\nJe peux vous aider avec :\n• 📦 Gérer votre stock\n• ➕ Ajouter des produits\n• 📊 Voir les commandes\n• 📈 Analyser les ventes\n\nQue voulez-vous faire ?"
    };
    return roleMessages[role] || "👋 Bonjour ! Je suis votre assistant. Posez-moi toutes vos questions !";
  };

  const findResponse = (question, userRole) => {
    const q = question.toLowerCase();
    
    // Réponses par catégorie
    const responses = {
      commande: "📦 **Pour passer une commande :**\n1. Allez dans la section 'Commandes'\n2. Cliquez sur 'Nouvelle commande'\n3. Sélectionnez vos produits\n4. Validez la commande\n\n💡 Besoin d'aide ? Contactez votre commercial !",
      livraison: "🚚 **Pour suivre vos livraisons :**\n1. Allez dans 'Mes Livraisons'\n2. Cliquez sur la livraison concernée\n3. Le statut s'affiche en temps réel\n4. Vous pouvez télécharger le bon de livraison\n\n📍 Le transporteur est notifié automatiquement.",
      facture: "🧾 **Factures et paiements :**\n• Consultez vos factures dans 'Mes Factures'\n• Payez en ligne par carte bancaire\n• Téléchargez vos factures en PDF\n• Suivez l'état de vos paiements\n\n💳 Le délai de paiement est de 30 jours.",
      stock: "📦 **Gestion du stock :**\n• Voir le stock actuel dans 'Stock'\n• Ajouter du stock avec '+'\n• Définir des seuils d'alerte\n• Exporter l'inventaire en Excel\n\n⚠️ Les alertes s'affichent quand le stock est bas.",
      contrat: "📄 **Contrats :**\n• Consultez vos contrats dans 'Contrats'\n• Téléchargez les PDF\n• Suivez les échéances\n• Les contrats sont automatiquement renouvelés\n\n📅 La date de fin est indiquée sur chaque contrat.",
      user: "👥 **Gestion des utilisateurs :**\n• Créez des comptes avec '+'\n• Attribuez des rôles (Admin, Commercial...)\n• Activez/désactivez des comptes\n• Modifiez les informations\n\n🔐 Seuls les Admins ont accès à cette section.",
      paiement: "💰 **Paiements :**\n• Consultez vos factures impayées\n• Payez par carte bancaire\n• Suivez l'historique des paiements\n• Recevez des reçus par email\n\n💳 Le paiement est sécurisé.",
      support: "🆘 **Support :**\n• Email: support@etap-gas.com\n• Téléphone: +216 XX XXX XXX\n• Horaires: Lun-Ven 8h-17h\n\n📞 Notre équipe vous répond dans les 24h.",
      dashboard: "📊 **Dashboard :**\n• Vue d'ensemble des KPI\n• Graphiques d'évolution\n• Alertes et notifications\n• Accès rapide aux fonctionnalités\n\n📈 Personnalisez votre vue selon vos besoins."
    };
    
    for (const [key, response] of Object.entries(responses)) {
      if (q.includes(key)) {
        return response;
      }
    }
    return null;
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: input,
      isUser: true,
      timestamp: new Date().toLocaleTimeString(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);
    setShowSuggestions(false);

    setTimeout(() => {
      let botResponse = findResponse(input, role);
      
      if (!botResponse) {
        botResponse = "😕 Désolé, je n'ai pas bien compris.\n\n📋 **Voici ce que je peux faire :**\n• Répondre sur les commandes/livraisons\n• Aider avec les factures/paiements\n• Gérer le stock\n• Expliquer les fonctionnalités\n\n🔁 Pouvez-vous reformuler votre question ?";
      }
      
      setMessages(prev => [...prev, {
        id: Date.now(),
        text: botResponse,
        isUser: false,
        timestamp: new Date().toLocaleTimeString(),
      }]);
      setIsTyping(false);
    }, 800);
  };

  const getSuggestions = () => {
    const suggestions = {
      Admin: [
        { text: "Comment gérer les utilisateurs ?", icon: "👥" },
        { text: "Comment valider un paiement ?", icon: "💰" },
        { text: "Où voir l'historique ?", icon: "📝" },
        { text: "Comment ajouter un produit ?", icon: "📦" },
      ],
      Commercial: [
        { text: "Comment créer une livraison ?", icon: "🚚" },
        { text: "Comment établir une facture ?", icon: "🧾" },
        { text: "Où sont les contrats ?", icon: "📄" },
        { text: "Comment suivre les commandes ?", icon: "🛒" },
      ],
      Client: [
        { text: "Comment passer une commande ?", icon: "🛍️" },
        { text: "Comment payer ma facture ?", icon: "💳" },
        { text: "Où est ma livraison ?", icon: "📍" },
        { text: "Comment contacter le support ?", icon: "🆘" },
      ],
      Transporteur: [
        { text: "Comment voir mes livraisons ?", icon: "📦" },
        { text: "Comment mettre à jour le statut ?", icon: "🔄" },
        { text: "Comment contacter le commercial ?", icon: "📞" },
        { text: "Comment signaler un problème ?", icon: "⚠️" },
      ],
      Fournisseur: [
        { text: "Comment ajouter du stock ?", icon: "➕" },
        { text: "Comment voir mes produits ?", icon: "📋" },
        { text: "Comment gérer les commandes ?", icon: "📊" },
        { text: "Comment voir les alertes ?", icon: "⚠️" },
      ]
    };
    return suggestions[role] || suggestions.Client;
  };

  const handleSuggestion = (suggestion) => {
    setInput(suggestion);
    setTimeout(() => handleSend(), 100);
  };

  const clearChat = () => {
    setMessages([{
      id: Date.now(),
      text: getWelcomeMessage(),
      isUser: false,
      timestamp: new Date().toLocaleTimeString(),
    }]);
    setShowSuggestions(true);
  };

  const renderMessage = ({ item }) => (
    <View style={[styles.message, item.isUser ? styles.userMessage : styles.botMessage]}>
      {!item.isUser && <Text style={styles.messageAvatar}>🤖</Text>}
      <View style={[styles.messageContent, item.isUser ? styles.userContent : styles.botContent]}>
        <Text style={[styles.messageText, item.isUser && styles.userMessageText]}>
          {item.text}
        </Text>
        <Text style={styles.messageTime}>{item.timestamp}</Text>
      </View>
      {item.isUser && <Text style={styles.messageAvatarUser}>👤</Text>}
    </View>
  );

  const renderSuggestion = ({ item }) => (
    <TouchableOpacity style={styles.suggestionButton} onPress={() => handleSuggestion(item.text)}>
      <Text style={styles.suggestionIcon}>{item.icon}</Text>
      <Text style={styles.suggestionText}>{item.text}</Text>
    </TouchableOpacity>
  );

  if (!isOpen) {
    return (
      <TouchableOpacity style={styles.toggleButton} onPress={() => setIsOpen(true)}>
        <Text style={styles.toggleIcon}>💬</Text>
        <View style={styles.badge} />
      </TouchableOpacity>
    );
  }

  return (
    <Modal
      visible={isOpen}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setIsOpen(false)}
    >
      <KeyboardAvoidingView
        style={styles.modalContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Animated.View style={[
          styles.chatbotWindow,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }
        ]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerInfo}>
              <Text style={styles.headerAvatar}>🤖</Text>
              <View>
                <Text style={styles.headerTitle}>Assistant ETAP-GAS</Text>
                <View style={styles.statusContainer}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>En ligne</Text>
                </View>
              </View>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.headerAction} onPress={clearChat}>
                <Text style={styles.headerActionText}>🗑️</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeButton} onPress={() => setIsOpen(false)}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Messages */}
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderMessage}
            style={styles.messagesList}
            contentContainerStyle={styles.messagesContainer}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          />

          {/* Typing Indicator */}
          {isTyping && (
            <View style={styles.typingContainer}>
              <Text style={styles.typingAvatar}>🤖</Text>
              <View style={styles.typingBubble}>
                <Text style={styles.typingDot}>●</Text>
                <Text style={styles.typingDot}>●</Text>
                <Text style={styles.typingDot}>●</Text>
              </View>
            </View>
          )}

          {/* Suggestions */}
          {showSuggestions && messages.length === 1 && (
            <View style={styles.suggestionsContainer}>
              <Text style={styles.suggestionsTitle}>✨ Questions fréquentes :</Text>
              <FlatList
                data={getSuggestions()}
                keyExtractor={(item, index) => index.toString()}
                renderItem={renderSuggestion}
                scrollEnabled={false}
              />
            </View>
          )}

          {/* Input Area */}
          <View style={styles.inputArea}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="Posez votre question ici..."
              placeholderTextColor="#94a3b8"
              multiline
            />
            <TouchableOpacity
              style={[styles.sendButton, !input.trim() && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={!input.trim()}
            >
              <Text style={styles.sendButtonText}>➤</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  toggleButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  toggleIcon: { fontSize: 28, color: '#fff' },
  badge: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10b981',
  },
  chatbotWindow: {
    width: '100%',
    height: '80%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#667eea',
  },
  headerInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerAvatar: { fontSize: 36 },
  headerTitle: { fontSize: 16, fontWeight: '600', color: '#fff' },
  statusContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10b981' },
  statusText: { fontSize: 11, color: 'rgba(255,255,255,0.9)' },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerAction: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  headerActionText: { fontSize: 16, color: '#fff' },
  closeButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  closeButtonText: { fontSize: 18, color: '#fff' },
  messagesList: { flex: 1 },
  messagesContainer: { padding: 16, gap: 12, paddingBottom: 20 },
  message: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  userMessage: { justifyContent: 'flex-end' },
  botMessage: { justifyContent: 'flex-start' },
  messageAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#667eea', textAlign: 'center', textAlignVertical: 'center', fontSize: 18, overflow: 'hidden' },
  messageAvatarUser: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#e9ecef', textAlign: 'center', textAlignVertical: 'center', fontSize: 18, overflow: 'hidden' },
  messageContent: { maxWidth: '80%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  userContent: { backgroundColor: '#667eea', borderBottomRightRadius: 4 },
  botContent: { backgroundColor: '#f1f5f9', borderBottomLeftRadius: 4 },
  messageText: { fontSize: 14, lineHeight: 20 },
  userMessageText: { color: '#fff' },
  messageTime: { fontSize: 10, color: '#94a3b8', marginTop: 4, textAlign: 'right' },
  typingContainer: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 8 },
  typingAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#667eea', textAlign: 'center', textAlignVertical: 'center', fontSize: 18, overflow: 'hidden' },
  typingBubble: { backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, flexDirection: 'row', gap: 4 },
  typingDot: { fontSize: 12, color: '#667eea', opacity: 0.6 },
  suggestionsContainer: { padding: 16, borderTopWidth: 1, borderTopColor: '#e9ecef', maxHeight: 200 },
  suggestionsTitle: { fontSize: 12, color: '#6c757d', marginBottom: 10 },
  suggestionButton: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f8f9fa', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: '#e9ecef' },
  suggestionIcon: { fontSize: 14 },
  suggestionText: { fontSize: 12, color: '#495057', flex: 1 },
  inputArea: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#e9ecef', gap: 8 },
  input: { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e9ecef', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, maxHeight: 80 },
  sendButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#667eea', justifyContent: 'center', alignItems: 'center' },
  sendButtonDisabled: { opacity: 0.5 },
  sendButtonText: { fontSize: 18, color: '#fff' },
});