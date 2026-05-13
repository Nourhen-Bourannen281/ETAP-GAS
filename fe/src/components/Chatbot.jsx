import React, { useState, useRef, useEffect } from 'react';
import { chatbotKnowledge, findResponse, getFAQsByRole } from '../data/chatbotKnowledge';
import '../css/Chatbot.css';

function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef(null);
  const role = localStorage.getItem('role') || 'Client';

  // Message d'accueil
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage = getWelcomeMessage();
      setMessages([{ 
        text: welcomeMessage, 
        isUser: false,
        timestamp: new Date().toLocaleTimeString()
      }]);
    }
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getWelcomeMessage = () => {
    const roleMessages = {
      Admin: "👋 Bonjour Administrateur ! Je suis votre assistant intelligent.\n\nJe peux vous aider avec :\n• 📊 La gestion des utilisateurs\n• 📦 Le suivi du stock\n• 💰 Les factures et paiements\n• 📈 Les rapports et analyses\n• 🔒 La sécurité et les logs\n\nQue souhaitez-vous savoir aujourd'hui ?",
      Commercial: "👋 Bonjour Commercial ! Ravi de vous aider.\n\nJe suis là pour :\n• 🛒 Gérer les commandes\n• 🚚 Créer des livraisons\n• 🧾 Établir des factures\n• 📄 Suivre les contrats\n• 📞 Contacter les clients\n\nComment puis-je vous assister ?",
      Client: "👋 Bonjour cher client ! Je suis votre assistant personnel.\n\nJe peux vous aider à :\n• 🛍️ Passer des commandes\n• 📍 Suivre vos livraisons\n• 💳 Payer vos factures\n• 📜 Voir votre historique\n• 🆘 Obtenir du support\n\nQue désirez-vous faire aujourd'hui ?",
      Transporteur: "👋 Bonjour Transporteur ! Je suis votre assistant logistique.\n\nMes compétences :\n• 🚚 Gérer vos livraisons\n• 📍 Mettre à jour les statuts\n• 📊 Voir votre planning\n• 📞 Contacter les commerciaux\n• ⚠️ Signaler des problèmes\n\nComment puis-je vous aider ?",
      Fournisseur: "👋 Bonjour Fournisseur ! Je suis votre assistant approvisionnement.\n\nJe peux vous aider avec :\n• 📦 Gérer votre stock\n• ➕ Ajouter des produits\n• 📊 Voir les commandes\n• 📈 Analyser les ventes\n• 🤝 Contacter l'administration\n\nQue voulez-vous faire ?"
    };
    return roleMessages[role] || "👋 Bonjour ! Je suis votre assistant. Posez-moi toutes vos questions sur l'application !";
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { 
      text: input, 
      isUser: true,
      timestamp: new Date().toLocaleTimeString()
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);
    setShowSuggestions(false);

    // Simuler une recherche intelligente
    setTimeout(() => {
      let botResponse = findResponse(input, role);
      
      if (!botResponse) {
        botResponse = getSmartFallbackResponse(input, role);
      }
      
      setMessages(prev => [...prev, { 
        text: botResponse, 
        isUser: false,
        timestamp: new Date().toLocaleTimeString()
      }]);
      setIsTyping(false);
    }, 800);
  };

  // Réponse intelligente quand aucune correspondance n'est trouvée
  const getSmartFallbackResponse = (question, userRole) => {
    const questionLower = question.toLowerCase();
    
    if (questionLower.includes("comment") || questionLower.includes("how")) {
      return "🤔 Je n'ai pas encore de réponse spécifique à cette question.\n\n💡 **Suggestions :**\n• Reformulez votre question\n• Utilisez des mots-clés plus simples\n• Consultez l'aide dans le menu principal\n• Contactez le support pour plus d'aide\n\n🔍 Essayez avec : " + getFAQsByRole(userRole).slice(0, 2).join(" ou ");
    }
    
    if (questionLower.includes("pourquoi") || questionLower.includes("why")) {
      return "❓ Je comprends votre interrogation.\n\nPour mieux vous aider, pourriez-vous :\n• Être plus précis dans votre question ?\n• Me donner plus de contexte ?\n• Vérifier si le sujet est dans la FAQ ?\n\nSinon, contactez le support pour une réponse détaillée.";
    }
    
    return "😕 Désolé, je n'ai pas bien compris votre question.\n\n📋 **Voici ce que je peux faire :**\n• Répondre sur les commandes et livraisons\n• Aider avec les factures et paiements\n• Gérer le stock et les produits\n• Expliquer les fonctionnalités\n• Donner l'accès au support\n\n🔁 Pouvez-vous reformuler votre question ?";
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleChatbot = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setShowSuggestions(true);
    }
  };

  // Suggestions rapides basées sur le rôle
  const getSuggestions = () => {
    const allSuggestions = {
      Admin: [
        { text: "Comment gérer les utilisaires ?", icon: "👥" },
        { text: "Comment valider un paiement ?", icon: "💰" },
        { text: "Où voir l'historique des actions ?", icon: "📝" },
        { text: "Comment ajouter un produit ?", icon: "📦" },
        { text: "Comment consulter les rapports ?", icon: "📊" },
        { text: "Comment configurer les alertes ?", icon: "🔔" }
      ],
      Commercial: [
        { text: "Comment créer une livraison ?", icon: "🚚" },
        { text: "Comment établir une facture ?", icon: "🧾" },
        { text: "Où sont les contrats ?", icon: "📄" },
        { text: "Comment suivre les commandes ?", icon: "🛒" },
        { text: "Comment exporter des données ?", icon: "📤" }
      ],
      Client: [
        { text: "Comment passer une commande ?", icon: "🛍️" },
        { text: "Comment payer ma facture ?", icon: "💳" },
        { text: "Où est ma livraison ?", icon: "📍" },
        { text: "Comment contacter le support ?", icon: "🆘" },
        { text: "Comment voir mon historique ?", icon: "📜" }
      ],
      Transporteur: [
        { text: "Comment voir mes livraisons ?", icon: "📦" },
        { text: "Comment mettre à jour le statut ?", icon: "🔄" },
        { text: "Comment contacter le commercial ?", icon: "📞" },
        { text: "Comment signaler un problème ?", icon: "⚠️" }
      ],
      Fournisseur: [
        { text: "Comment ajouter du stock ?", icon: "➕" },
        { text: "Comment voir mes produits ?", icon: "📋" },
        { text: "Comment gérer les commandes ?", icon: "📊" },
        { text: "Comment voir les alertes stock ?", icon: "⚠️" }
      ]
    };
    return allSuggestions[role] || allSuggestions.Client;
  };

  const handleSuggestion = (suggestion) => {
    setInput(suggestion);
    setTimeout(() => handleSend(), 100);
  };

  const clearChat = () => {
    setMessages([{ 
      text: getWelcomeMessage(), 
      isUser: false,
      timestamp: new Date().toLocaleTimeString()
    }]);
    setShowSuggestions(true);
  };

  return (
    <>
      {!isOpen && (
        <button className="chatbot-toggle-button" onClick={toggleChatbot}>
          <span className="chatbot-icon">💬</span>
          <span className="chatbot-badge">●</span>
        </button>
      )}

      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <div className="chatbot-header-info">
              <span className="chatbot-avatar">🤖</span>
              <div>
                <h3>Assistant ETAP-GAS</h3>
                <p className="chatbot-status">
                  <span className="status-dot"></span>
                  En ligne
                </p>
              </div>
            </div>
            <div className="header-actions">
              <button className="header-action-btn" onClick={clearChat} title="Nouvelle conversation">
                🗑️
              </button>
              <button className="chatbot-close" onClick={toggleChatbot}>
                ✕
              </button>
            </div>
          </div>

          <div className="chatbot-messages-container">
            <div className="chatbot-messages">
              {messages.map((msg, idx) => (
                <div key={idx} className={`message ${msg.isUser ? 'user' : 'bot'}`}>
                  {!msg.isUser && <span className="message-avatar">🤖</span>}
                  <div className="message-content">
                    {msg.text.split('\n').map((line, i) => (
                      <React.Fragment key={i}>
                        {line}
                        {i < msg.text.split('\n').length - 1 && <br />}
                      </React.Fragment>
                    ))}
                  </div>
                  {msg.isUser && <span className="message-avatar-user">👤</span>}
                </div>
              ))}
              {isTyping && (
                <div className="message bot">
                  <span className="message-avatar">🤖</span>
                  <div className="message-content typing">
                    <span>●</span>
                    <span>●</span>
                    <span>●</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Suggestions rapides */}
          {showSuggestions && messages.length === 1 && (
            <div className="chatbot-suggestions">
              <p className="suggestions-title">✨ Questions fréquentes :</p>
              <div className="suggestions-buttons">
                {getSuggestions().map((suggestion, idx) => (
                  <button
                    key={idx}
                    className="suggestion-button"
                    onClick={() => handleSuggestion(suggestion.text)}
                  >
                    <span className="suggestion-icon">{suggestion.icon}</span>
                    {suggestion.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="chatbot-input-area">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Posez votre question ici..."
              className="chatbot-input"
            />
            <button 
              onClick={handleSend} 
              className="chatbot-send-button"
              disabled={!input.trim()}
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default Chatbot;