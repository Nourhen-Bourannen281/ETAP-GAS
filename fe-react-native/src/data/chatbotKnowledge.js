// src/data/chatbotKnowledge.js
export const chatbotKnowledge = [
  // Navigation & Accès
  {
    keywords: ["dashboard", "accueil", "tableau de bord", "page d'accueil", "voir dashboard"],
    synonyms: ["tableau", "principal"],
    response: "📊 **Accès au Dashboard :**\n\n• Clique sur le menu latéral → Dashboard\n• Selon ton rôle, tu verras un dashboard personnalisé\n• Tu peux voir les indicateurs clés de ton activité",
    role: "all"
  },
  {
    keywords: ["commande", "passer commande", "nouvelle commande", "créer commande", "commander"],
    synonyms: ["order", "achat", "acheter"],
    response: "🛒 **Passer une Commande :**\n\n1. Va dans Commandes\n2. Clique sur 'Nouvelle commande'\n3. Sélectionne les produits souhaités\n4. Choisis la quantité\n5. Valide ta commande\n6. Reçois une confirmation par notification",
    role: "Client"
  },
  {
    keywords: ["facture", "mes factures", "voir factures", "liste factures", "facturation"],
    synonyms: ["invoice", "facturer"],
    response: "🧾 **Accès aux Factures :**\n\n• Va dans Mes Factures\n• Tu peux visualiser, télécharger et imprimer tes factures\n• Les factures sont classées par date et par statut",
    role: "all"
  },
  {
    keywords: ["livraison", "suivi livraison", "où est ma livraison", "tracking", "colis"],
    synonyms: ["delivery", "transport", "expédition"],
    response: "📍 **Suivi de Livraison :**\n\n• Va dans Suivi Livraison\n• Tu peux voir :\n  - Position actuelle du colis\n  - Transporteur assigné\n  - Date estimée de livraison\n  - Historique des étapes",
    role: "all"
  },
  {
    keywords: ["payer", "payer facture", "régler facture", "paiement", "settlement"],
    synonyms: ["payment", "règlement", "acquitter"],
    response: "💳 **Payer une Facture :**\n\n• Va dans Mes Factures\n• Clique sur 'Payer' sur la facture concernée\n• Choisis ton mode de paiement\n• Confirme le paiement\n• Reçois une confirmation",
    role: "Client"
  },
  {
    keywords: ["stock", "inventaire", "voir stock", "gestion stock", "état stock"],
    synonyms: ["inventaire", "réserve", "disponibilité"],
    response: "📦 **Gestion du Stock :**\n\n• Admin : Menu → Stock\n• Fournisseur : Menu → Produits\n• Tu peux voir :\n  - Quantités disponibles\n  - Seuils d'alerte\n  - Entrées/Sorties",
    role: "all"
  },
  {
    keywords: ["contrat", "mes contrats", "voir contrats", "gestion contrats"],
    synonyms: ["accord", "convention", "contract"],
    response: "📄 **Accès aux Contrats :**\n\n• Va dans Contrats\n• Tu peux voir tous tes contrats actifs\n• Les commerciaux peuvent créer de nouveaux contrats",
    role: "all"
  },
  {
    keywords: ["notification", "alerte", "message", "j'ai reçu"],
    synonyms: ["alert", "info"],
    response: "🔔 **Notifications :**\n\n• Tu reçois des notifications pour :\n  ✓ Nouvelle commande\n  ✓ Validation de commande\n  ✓ Facture émise\n  ✓ Paiement reçu\n  ✓ Stock bas\n• Va dans Notifications pour tout voir",
    role: "all"
  },
  {
    keywords: ["historique", "journal", "logs", "actions", "activité"],
    synonyms: ["history", "traces", "audit"],
    response: "📝 **Historique des Actions :**\n\n• Accès réservé à l'Admin\n• Va dans Journal\n• Tu vois :\n  - Date et heure\n  - Utilisateur\n  - Action effectuée\n  - Résultat",
    role: "Admin"
  },
  {
    keywords: ["utilisateur", "user", "compte", "créer compte", "gérer utilisateurs"],
    synonyms: ["compte", "personne", "membre"],
    response: "👥 **Gestion des Utilisateurs :**\n\n• Admin uniquement\n• Va dans Utilisateurs\n• Tu peux :\n  - Ajouter un utilisateur\n  - Modifier les rôles\n  - Désactiver un compte\n  - Réinitialiser mot de passe",
    role: "Admin"
  },
  {
    keywords: ["rapport", "statistiques", "analyse", "kpi", "performance"],
    synonyms: ["report", "stats", "chiffres"],
    response: "📈 **Rapports et Statistiques :**\n\n• Va dans Rapports\n• Types de rapports :\n  - Ventes par période\n  - Chiffre d'affaires\n  - Produits les plus vendus\n  - Clients actifs",
    role: "all"
  },
  {
    keywords: ["aide", "support", "assistance", "contacter support", "problème"],
    synonyms: ["help", "service", "contact"],
    response: "🆘 **Support :**\n\n• Email : support@etap-gas.tn\n• Téléphone : +216 70 000 000\n• Chat en ligne disponible\n• Réponse sous 24h ouvrées",
    role: "all"
  },
  {
    keywords: ["déconnexion", "se déconnecter", "logout", "quitter"],
    synonyms: ["exit", "log out"],
    response: "🚪 **Déconnexion :**\n\n• Clique sur l'icône déconnexion dans la topbar\n• Tu seras redirigé vers la page d'accueil",
    role: "all"
  },
  {
    keywords: ["bonjour", "salut", "hello", "hi", "coucou"],
    synonyms: ["good morning", "hey"],
    response: "👋 Bonjour ! Comment puis-je vous aider aujourd'hui ?\n\nJe peux vous renseigner sur :\n• Les commandes et livraisons\n• Les factures et paiements\n• La gestion du stock\n• Et bien plus encore !",
    role: "all"
  },
  {
    keywords: ["merci", "thanks", "merci beaucoup", "thank you"],
    synonyms: ["thx", "bravo"],
    response: "😊 Avec plaisir ! N'hésitez pas si vous avez d'autres questions.\n\nPassez une excellente journée !",
    role: "all"
  },
  {
    keywords: ["au revoir", "bye", "à plus", "à bientôt"],
    synonyms: ["goodbye", "see you"],
    response: "👋 Au revoir ! À bientôt sur ETAP-GAS.\n\nSi vous avez besoin d'aide, je suis là !",
    role: "all"
  },
];

// Fonction pour trouver la réponse
export function findResponse(question, userRole) {
  const normalizedQuestion = question.toLowerCase().trim();
  
  let bestMatch = null;
  let bestScore = 0;
  
  for (let item of chatbotKnowledge) {
    const roles = item.role.split(',');
    const hasAccess = item.role === "all" || roles.includes(userRole);
    
    if (hasAccess) {
      let score = 0;
      
      for (let keyword of item.keywords) {
        if (normalizedQuestion.includes(keyword)) {
          score += 10;
        }
      }
      
      if (item.synonyms) {
        for (let synonym of item.synonyms) {
          if (normalizedQuestion.includes(synonym)) {
            score += 5;
          }
        }
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = item;
      }
    }
  }
  
  if (bestMatch && bestScore >= 5) {
    return bestMatch.response;
  }
  
  return null;
}

// Fonction pour obtenir les questions fréquentes par rôle
export function getFAQsByRole(role) {
  const faqs = {
    Admin: [
      "Comment gérer les utilisateurs ?",
      "Comment valider un paiement ?",
      "Où voir l'historique des actions ?",
      "Comment ajouter un produit ?",
    ],
    Commercial: [
      "Comment créer une livraison ?",
      "Comment établir une facture ?",
      "Où sont les contrats ?",
      "Comment suivre les commandes ?",
    ],
    Client: [
      "Comment passer une commande ?",
      "Comment payer ma facture ?",
      "Où est ma livraison ?",
      "Comment contacter le support ?",
    ],
    Transporteur: [
      "Comment voir mes livraisons ?",
      "Comment mettre à jour le statut ?",
      "Comment contacter le commercial ?",
      "Comment signaler un problème ?",
    ],
    Fournisseur: [
      "Comment ajouter du stock ?",
      "Comment voir mes produits ?",
      "Comment gérer les commandes ?",
      "Comment contacter l'admin ?",
    ]
  };
  
  return faqs[role] || faqs.Client;
}