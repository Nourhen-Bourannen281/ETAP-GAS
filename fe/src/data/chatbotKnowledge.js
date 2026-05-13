export const chatbotKnowledge = [
  // ==================== CATÉGORIE 1 : NAVIGATION & ACCÈS ====================
  {
    keywords: ["dashboard", "accueil", "tableau de bord", "page d'accueil", "mon dashboard", "comment accéder dashboard", "voir dashboard"],
    synonyms: ["tableau", "accueil", "principal"],
    response: "📊 **Accès au Dashboard :**\n\n• Clique sur le bouton 'Dashboard' dans la barre de navigation en haut\n• Ou utilise le menu latéral → Dashboard\n• Selon ton rôle (Admin/Commercial/Client/Transporteur/Fournisseur), tu verras un dashboard personnalisé",
    role: "all"
  },
  {
    keywords: ["contrat", "contrats", "mes contrats", "voir contrats", "liste contrats", "gestion contrats"],
    synonyms: ["accord", "convention", "contract"],
    response: "📄 **Accès aux Contrats :**\n\n• Va dans le menu principal → Contrats\n• Tu peux y voir tous tes contrats actifs et historiques\n• Les commerciaux peuvent créer de nouveaux contrats\n• Les clients peuvent consulter leurs contrats signés",
    role: "all"
  },
  {
    keywords: ["facture", "factures", "mes factures", "voir factures", "liste factures", "toutes factures"],
    synonyms: ["invoice", "facturation", "note d'honoraire"],
    response: "🧾 **Accès aux Factures :**\n\n• Admin/Commercial : Menu → Factures\n• Client/Fournisseur : Menu → Mes Factures\n• Tu peux visualiser, télécharger et imprimer tes factures\n• Les factures sont classées par date et par statut (payée/en attente)",
    role: "all"
  },
  {
    keywords: ["stock", "inventaire", "voir stock", "gestion stock", "état stock", "niveau stock"],
    synonyms: ["inventaire", "réserve", "disponibilité", "quantité"],
    response: "📦 **Gestion du Stock :**\n\n• Admin : Menu → Stock (vue complète)\n• Fournisseur : Menu → Produits\n• Tu peux voir :\n  - Quantités disponibles\n  - Seuils d'alerte\n  - Entrées/Sorties\n  - Historique des mouvements",
    role: "all"
  },

  // ==================== CATÉGORIE 2 : COMMANDES & LIVRAISONS ====================
  {
    keywords: ["commande", "passer commande", "nouvelle commande", "créer commande", "faire commande", "ajouter commande"],
    synonyms: ["order", "achat", "commander", "acheter"],
    response: "🛒 **Passer une Commande :**\n\n1. Va dans Commandes\n2. Clique sur 'Passer une commande' ou 'Nouvelle commande'\n3. Sélectionne les produits souhaités\n4. Choisis la quantité\n5. Valide ta commande\n6. Reçois une confirmation par notification\n\n⚠️ Réservé aux clients",
    role: "Client"
  },
  {
    keywords: ["commande validée", "validation commande", "statut commande", "état commande", "suivi commande"],
    synonyms: ["vérifier commande", "confirmation", "status"],
    response: "✅ **Statut de Commande :**\n\n• Va dans Mes Commandes\n• Regarde la colonne 'Statut' :\n  - En attente ⏳\n  - Validée ✓\n  - En livraison 🚚\n  - Livrée ✅\n  - Annulée ❌\n• Tu reçois des notifications à chaque changement",
    role: "Client"
  },
  {
    keywords: ["créer livraison", "nouvelle livraison", "ajouter livraison", "préparer livraison"],
    synonyms: ["expédition", "envoi", "shipping"],
    response: "🚚 **Créer une Livraison :**\n\n• Accès réservé aux Commerciaux\n• Va dans Commandes\n• Sélectionne une commande validée\n• Clique sur 'Créer livraison'\n• Remplis les infos de transport\n• Assigne un transporteur\n• Valide la création",
    role: "Commercial"
  },
  {
    keywords: ["livraison", "suivi livraison", "où est ma livraison", "tracking", "suivi colis"],
    synonyms: ["delivery", "transport", "expédition", "colis"],
    response: "📍 **Suivi de Livraison :**\n\n• Va dans Suivi Livraison ou Mes Livraisons\n• Tu peux voir :\n  - Position actuelle du colis\n  - Transporteur assigné\n  - Date estimée de livraison\n  - Historique des étapes\n  - Contacter le transporteur",
    role: "all"
  },
  {
    keywords: ["annuler commande", "modifier commande", "changer commande", "retour commande"],
    synonyms: ["cancel", "modification", "retour"],
    response: "🔄 **Modifier/Annuler une Commande :**\n\n• Tant que la commande n'est pas validée :\n  - Va dans Mes Commandes\n  - Clique sur 'Modifier' ou 'Annuler'\n• Après validation :\n  - Contacte le support commercial\n  - La modification peut nécessiter une approbation",
    role: "Client"
  },

  // ==================== CATÉGORIE 3 : FACTURES & PAIEMENTS ====================
  {
    keywords: ["créer facture", "nouvelle facture", "générer facture", "établir facture"],
    synonyms: ["invoice", "facturer", "émettre"],
    response: "💰 **Créer une Facture :**\n\n• Admin/Commercial uniquement\n• Va dans Factures\n• Clique sur 'Nouvelle facture'\n• Sélectionne la commande ou contrat\n• Vérifie les montants\n• Valide la création\n• La facture est envoyée au client automatiquement",
    role: "Commercial,Admin"
  },
  {
    keywords: ["payer facture", "régler facture", "paiement facture", "payer", "settlement"],
    synonyms: ["payment", "règlement", "payer", "acquitter"],
    response: "💳 **Payer une Facture :**\n\n• Client uniquement\n• Va dans Mes Factures\n• Clique sur 'Payer' sur la facture concernée\n• Choisis ton mode de paiement :\n  - Carte bancaire\n  - Virement\n  - Chèque\n  - Espèces (si retrait)\n• Confirme le paiement\n• Reçois une confirmation",
    role: "Client"
  },
  {
    keywords: ["valider paiement", "confirmer paiement", "approuver paiement", "valider transaction"],
    synonyms: ["approval", "confirmation", "validation"],
    response: "✓ **Validation des Paiements :**\n\n• Seul l'Admin peut valider les paiements\n• Va dans Paiements → Demandes en attente\n• Vérifie le justificatif\n• Clique sur 'Valider' ou 'Rejeter'\n• Le client reçoit une notification",
    role: "Admin"
  },
  {
    keywords: ["historique paiement", "anciens paiements", "paiements passés", "relevé"],
    synonyms: ["history", "ancien", "relevé", "compte"],
    response: "📜 **Historique des Paiements :**\n\n• Va dans Paiements ou Mes Paiements\n• Tu vois :\n  - Date du paiement\n  - Montant\n  - Mode de paiement\n  - Facture associée\n  - Statut\n• Tu peux télécharger les reçus",
    role: "all"
  },

  // ==================== CATÉGORIE 4 : STOCK & PRODUITS ====================
  {
    keywords: ["stock actuel", "niveau stock", "quantité disponible", "disponibilité stock"],
    synonyms: ["available", "en stock", "disponible", "quantité"],
    response: "📊 **Niveau de Stock Actuel :**\n\n• Admin : Va dans Stock → Vue d'ensemble\n• Autres rôles : Va dans Produits\n• Tu vois :\n  - Produit\n  - Quantité\n  - Seuil minimum\n  - Statut (OK/Stock bas/Rupture)\n• Export possible en Excel/PDF",
    role: "all"
  },
  {
    keywords: ["ajouter stock", "approvisionner", "réapprovisionner", "augmenter stock", "entrée stock"],
    synonyms: ["add", "supply", "restock", "approvisionnement"],
    response: "📦 **Ajouter du Stock :**\n\n• Fournisseur uniquement\n• Va dans Ajouter stock ou Gestion Stock\n• Clique sur 'Ajouter' ou 'Entrée stock'\n• Sélectionne le produit\n• Indique la quantité\n• Ajoute la date d'expiration (si applicable)\n• Valide l'opération",
    role: "Fournisseur"
  },
  {
    keywords: ["alerte stock", "stock bas", "seuil alerte", "notification stock"],
    synonyms: ["warning", "critique", "minimum", "danger"],
    response: "⚠️ **Alerte Stock Bas :**\n\n• Une alerte est déclenchée quand :\n  - Le stock descend sous le seuil minimum\n  - Un produit est presque en rupture\n• Tu reçois :\n  - Notification dans l'app\n  - Email (optionnel)\n• Action : Réapprovisionner rapidement",
    role: "all"
  },
  {
    keywords: ["produit", "type produit", "catégorie produit", "sous produit", "liste produits"],
    synonyms: ["item", "article", "marchandise", "bien"],
    response: "📋 **Gestion des Produits :**\n\n• Admin uniquement\n• Va dans Référentiels :\n  - Type Produits\n  - Sous Produits\n• Tu peux :\n  - Ajouter un produit\n  - Modifier les caractéristiques\n  - Définir les prix\n  - Gérer les fournisseurs",
    role: "Admin"
  },

  // ==================== CATÉGORIE 5 : NOTIFICATIONS & HISTORIQUE ====================
  {
    keywords: ["notification", "alerte", "message", "pourquoi notification", "j'ai reçu"],
    synonyms: ["alert", "message", "info", "information"],
    response: "🔔 **Comprendre les Notifications :**\n\n• Tu reçois des notifications pour :\n  ✓ Nouvelle commande\n  ✓ Validation de commande\n  ✓ Création de livraison\n  ✓ Facture émise\n  ✓ Paiement reçu\n  ✓ Paiement validé\n  ✓ Retard de livraison\n  ✓ Stock bas\n• Va dans Notifications pour tout voir",
    role: "all"
  },
  {
    keywords: ["historique", "journal", "logs", "actions logs", "trace", "activité"],
    synonyms: ["history", "traces", "enregistrements", "audit"],
    response: "📝 **Historique des Actions :**\n\n• Accès réservé à l'Admin\n• Va dans Action Logs ou Journal\n• Tu vois :\n  - Date et heure\n  - Utilisateur\n  - Action effectuée\n  - IP et navigateur\n  - Résultat\n• Filtrage par date, utilisateur, action\n• Export possible",
    role: "Admin"
  },

  // ==================== CATÉGORIE 6 : EXPORT & IMPORT ====================
  {
    keywords: ["export", "importer", "exportation", "importation", "exporter données"],
    synonyms: ["exporter", "excel", "pdf", "csv", "download"],
    response: "📤 **Export/Import de Données :**\n\n• Va dans Export-Import\n• Tu peux :\n  - Exporter :\n    • Commandes\n    • Factures\n    • Stock\n    • Rapports\n    • Format Excel, PDF, CSV\n  - Importer :\n    • Produits\n    • Tarifs\n    • Contacts\n• Planification automatique possible",
    role: "all"
  },

  // ==================== CATÉGORIE 7 : CONFORMITÉ & RÈGLEMENTATION ====================
  {
    keywords: ["conformité", "conformite", "réglementation", "normes", "certification", "legal"],
    synonyms: ["compliance", "règles", "lois", "standards"],
    response: "📜 **Conformité et Réglementation :**\n\n• Va dans Conformité\n• Documents disponibles :\n  - Certificats de conformité\n  - Normes ISO\n  - Licences d'exploitation\n  - Déclarations douanières\n  - Documents réglementaires\n• Téléchargement et visualisation",
    role: "all"
  },

  // ==================== CATÉGORIE 8 : RAPPORTS & STATISTIQUES ====================
  {
    keywords: ["rapport", "statistiques", "analyse", "indicateurs", "kpi", "performance"],
    synonyms: ["report", "stats", "chiffres", "données", "analytique"],
    response: "📈 **Rapports et Statistiques :**\n\n• Va dans Rapports\n• Types de rapports :\n  - Ventes par période\n  - Chiffre d'affaires\n  - Produits les plus vendus\n  - Clients actifs\n  - Performance transporteurs\n  - Délais de livraison\n• Graphiques interactifs\n• Export et partage",
    role: "all"
  },

  // ==================== CATÉGORIE 9 : GESTION DES UTILISATEURS ====================
  {
    keywords: ["utilisateur", "user", "compte", "créer compte", "ajouter utilisateur", "gérer utilisateurs"],
    synonyms: ["compte", "personne", "employé", "membre"],
    response: "👥 **Gestion des Utilisateurs :**\n\n• Admin uniquement\n• Va dans Utilisateurs\n• Tu peux :\n  - Ajouter un utilisateur\n  - Modifier les rôles (Admin/Commercial/Client/Transporteur/Fournisseur)\n  - Désactiver un compte\n  - Réinitialiser mot de passe\n  - Voir historique connexions",
    role: "Admin"
  },
  {
    keywords: ["rôle", "rôles", "droit", "permission", "accès", "qui peut"],
    synonyms: ["role", "droit", "privilège", "autorisation"],
    response: "🎭 **Les 5 Rôles de l'Application :**\n\n1. **Admin** : Accès total, gestion utilisateurs, validation paiements\n2. **Commercial** : Commandes, livraisons, factures, contrats\n3. **Client** : Passer commandes, suivre livraisons, payer factures\n4. **Transporteur** : Gérer livraisons, mise à jour statut\n5. **Fournisseur** : Gérer stock, approvisionnement",
    role: "all"
  },

  // ==================== CATÉGORIE 10 : TIERS & PARTENAIRES ====================
  {
    keywords: ["tiers", "partenaire", "fournisseur", "client externe", "société"],
    synonyms: ["partner", "external", "entreprise", "société"],
    response: "🤝 **Gestion des Tiers :**\n\n• Va dans Tiers\n• Tu peux gérer :\n  - Clients\n  - Fournisseurs\n  - Transporteurs\n  - Partenaires\n• Informations :\n  - Coordonnées\n  - Contrats\n  - Historique transactions\n  - Documents",
    role: "Admin,Commercial"
  },

  // ==================== CATÉGORIE 11 : PARAMÈTRES & CONFIGURATION ====================
  {
    keywords: ["paramètre", "configuration", "réglage", "préférence", "setting"],
    synonyms: ["setting", "config", "préférence", "option"],
    response: "⚙️ **Paramètres :**\n\n• Va dans Paramètres\n• Tu peux configurer :\n  - Profil utilisateur\n  - Notifications (email/push)\n  - Langue (Français/Anglais)\n  - Thème (Clair/Sombre)\n  - Sécurité (2FA, mot de passe)\n  - Préférences d'affichage",
    role: "all"
  },

  // ==================== CATÉGORIE 12 : AIDE & SUPPORT ====================
  {
    keywords: ["aide", "support", "assistance", "contacter support", "help", "problème"],
    synonyms: ["assistance", "service", "contact", "urgence"],
    response: "🆘 **Support et Assistance :**\n\n• Email : support@etap-gas.tn\n• Téléphone : +216 70 000 000 (8h-17h)\n• Chat en ligne disponible\n• FAQ dans l'aide\n• Tickets de support\n• Réponse sous 24h ouvrées",
    role: "all"
  },
  {
    keywords: ["déconnexion", "se déconnecter", "logout", "sign out", "quitter"],
    synonyms: ["exit", "log out", "sortir"],
    response: "🚪 **Déconnexion :**\n\n• Clique sur ton avatar/profil en haut à droite\n• Sélectionne 'Déconnexion'\n• Tu seras redirigé vers la page d'accueil\n• Pour des raisons de sécurité, déconnecte-toi sur les ordinateurs partagés",
    role: "all"
  },

  // ==================== CATÉGORIE 13 : RECHERCHE & FILTRES ====================
  {
    keywords: ["recherche", "chercher", "filtre", "trouver", "search", "filter"],
    synonyms: ["find", "locate", "rechercher"],
    response: "🔍 **Recherche et Filtres :**\n\n• Utilise la barre de recherche en haut\n• Filtres disponibles :\n  - Par date\n  - Par statut\n  - Par montant\n  - Par produit\n  - Par client\n• Recherche avancée disponible\n• Sauvegarde des filtres favoris",
    role: "all"
  },

  // ==================== CATÉGORIE 14 : APPLICATION MOBILE ====================
  {
    keywords: ["mobile", "application mobile", "app", "téléphone", "android", "ios", "télécharger"],
    synonyms: ["smartphone", "appli", "portable"],
    response: "📱 **Application Mobile :**\n\n• Disponible sur :\n  - Google Play (Android)\n  - App Store (iOS)\n• Fonctionnalités :\n  - Notifications push\n  - Scan de codes-barres\n  - Signature électronique\n  - Géolocalisation livraisons\n  - Mode hors ligne partiel",
    role: "all"
  },

  // ==================== CATÉGORIE 15 : SÉCURITÉ ====================
  {
    keywords: ["sécurité", "securité", "mot de passe", "password", "confidentiel", "données"],
    synonyms: ["security", "safe", "protect", "privacy"],
    response: "🔒 **Sécurité :**\n\n• Chiffrement des données\n• Authentification à deux facteurs (2FA)\n• Session expirée après inactivité\n• Connexion sécurisée HTTPS\n• Sauvegarde automatique\n• Audit des accès\n• Protection des données personnelles (RGPD)",
    role: "all"
  },

  // ==================== CATÉGORIE 16 : SALUTATIONS & GÉNÉRAL ====================
  {
    keywords: ["bonjour", "salut", "hello", "hi", "coucou", "hey"],
    synonyms: ["good morning", "good afternoon", "yo"],
    response: "👋 Bonjour ! Comment puis-je vous aider aujourd'hui ?\n\nJe peux vous renseigner sur :\n• Les commandes et livraisons\n• Les factures et paiements\n• La gestion du stock\n• L'export/import de données\n• Et bien plus encore !",
    role: "all"
  },
  {
    keywords: ["merci", "thanks", "merci beaucoup", "thank you", "super"],
    synonyms: ["thx", "merci infiniment", "bravo"],
    response: "😊 Avec plaisir ! N'hésitez pas si vous avez d'autres questions.\n\nPassez une excellente journée !",
    role: "all"
  },
  {
    keywords: ["au revoir", "bye", "à plus", "à bientôt", "ciao", "adieu"],
    synonyms: ["goodbye", "see you", "bye bye"],
    response: "👋 Au revoir ! À bientôt sur ETAP-GAS.\n\nSi vous avez besoin d'aide, je suis là !",
    role: "all"
  },

  // ==================== CATÉGORIE 17 : QUESTIONS GÉNÉRALES SUR L'APPLICATION ====================
  {
    keywords: ["utiliser application", "comment utiliser", "fonctionnement", "guide", "tutoriel"],
    synonyms: ["usage", "utilisation", "comment ça marche"],
    response: "📚 **Guide d'utilisation d'ETAP-GAS :**\n\n1. **Connexion** : Utilise tes identifiants\n2. **Dashboard** : Vue d'ensemble de ton activité\n3. **Navigation** : Menu principal à gauche\n4. **Actions** : Boutons pour créer/modifier\n5. **Notifications** : En haut à droite\n6. **Profil** : Gère ton compte\n\n🔗 Un tutoriel détaillé est disponible dans Aide → Tutoriels",
    role: "all"
  },
  {
    keywords: ["etap gas", "etap-gas", "application", "plateforme", "site"],
    synonyms: ["platform", "system", "logiciel"],
    response: "🏢 **ETAP-GAS - Plateforme de Gestion**\n\nETAP-GAS est une solution complète pour :\n• Gérer les commandes et livraisons\n• Suivre les factures et paiements\n• Contrôler le stock\n• Exporter des données\n• Assurer la conformité\n\nVersion : 2.0 | Dernière mise à jour : Mars 2026",
    role: "all"
  }
];

// Fonction améliorée pour trouver la réponse
export function findResponse(question, userRole) {
  const normalizedQuestion = question.toLowerCase().trim();
  
  // Score de correspondance
  let bestMatch = null;
  let bestScore = 0;
  
  for (let item of chatbotKnowledge) {
    // Vérifier le rôle
    const roles = item.role.split(',');
    const hasAccess = item.role === "all" || roles.includes(userRole);
    
    if (hasAccess) {
      let score = 0;
      
      // Vérifier les mots-clés principaux
      for (let keyword of item.keywords) {
        if (normalizedQuestion.includes(keyword)) {
          score += 10;
        }
      }
      
      // Vérifier les synonymes
      if (item.synonyms) {
        for (let synonym of item.synonyms) {
          if (normalizedQuestion.includes(synonym)) {
            score += 5;
          }
        }
      }
      
      // Vérifier la longueur de la question (bonus si plusieurs mots correspondent)
      const questionWords = normalizedQuestion.split(' ');
      for (let word of questionWords) {
        for (let keyword of item.keywords) {
          if (keyword.includes(word) && word.length > 3) {
            score += 2;
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
      "Comment consulter tous les rapports ?"
    ],
    Commercial: [
      "Comment créer une livraison ?",
      "Comment établir une facture ?",
      "Où sont les contrats ?",
      "Comment suivre les commandes ?",
      "Comment contacter un client ?"
    ],
    Client: [
      "Comment passer une commande ?",
      "Comment payer ma facture ?",
      "Où est ma livraison ?",
      "Comment contacter le support ?",
      "Comment voir mon historique ?"
    ],
    Transporteur: [
      "Comment voir mes livraisons ?",
      "Comment mettre à jour le statut ?",
      "Comment contacter le commercial ?",
      "Comment signaler un problème ?"
    ],
    Fournisseur: [
      "Comment ajouter du stock ?",
      "Comment voir mes produits ?",
      "Comment gérer les commandes ?",
      "Comment contacter l'admin ?"
    ]
  };
  
  return faqs[role] || faqs.Client;
}