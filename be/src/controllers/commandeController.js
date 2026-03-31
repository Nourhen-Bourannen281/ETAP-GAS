const Commande = require('../models/Commande');
const Tiers = require('../models/Tiers');
const Stock = require('../models/Stock');
const Product = require('../models/Product');
const HistoriqueController = require('./historiqueController');

// Obtenir toutes les commandes
exports.getCommandes = async (req, res) => {
  try {
    let query = {};
    
    if (req.user.role === 'Client') {
      const client = await Tiers.findOne({ user: req.user.id });
      if (client) {
        query.client = client._id;
      }
    }
    
    const commandes = await Commande.find(query)
      .populate('client', 'raisonSociale email')
      .populate('produits.sousProduit', 'nom prixUnitaire uniteMesure')
      .populate('commercial', 'nom email')
      .sort({ dateCreation: -1 });
    
    res.json(commandes);
  } catch (err) {
    console.error('Erreur getCommandes:', err);
    res.status(500).json({ message: err.message });
  }
};

// Obtenir les commandes du client connecté
exports.getClientCommandes = async (req, res) => {
  try {
    console.log('=== getClientCommandes appelé ===');
    console.log('User ID:', req.user.id);
    
    let client = await Tiers.findOne({ user: req.user.id, type: 0 });
    
    if (!client) {
      console.log('Client avec type 0 non trouvé, recherche sans filtre type...');
      client = await Tiers.findOne({ user: req.user.id });
      
      if (client) {
        console.log('Client trouvé mais avec type:', client.type);
        if (client.type !== 0) {
          client.type = 0;
          await client.save();
          console.log('Type client mis à jour vers 0');
        }
      }
    }
    
    if (!client) {
      console.log('Aucun client trouvé pour l\'utilisateur:', req.user.id);
      
      const User = require('../models/User');
      const user = await User.findById(req.user.id);
      
      if (user) {
        console.log('Création automatique d\'un client pour:', user.email);
        client = await Tiers.create({
          user: req.user.id,
          type: 0,
          raisonSociale: user.nom || user.email,
          email: user.email,
          dateCreation: new Date()
        });
        console.log('Client créé avec succès:', client._id);
      } else {
        return res.status(404).json({ 
          message: 'Client non trouvé. Veuillez contacter l\'administrateur.',
          debug: {
            userId: req.user.id,
            userRole: req.user.role
          }
        });
      }
    }
    
    const commandes = await Commande.find({ client: client._id })
      .populate('produits.sousProduit', 'nom prixUnitaire uniteMesure')
      .populate('commercial', 'nom email')
      .sort({ dateCreation: -1 });
    
    console.log(`Commandes trouvées: ${commandes.length}`);
    
    const formattedCommandes = commandes.map(cmd => ({
      _id: cmd._id,
      numeroCommande: cmd.numeroCommande,
      dateCreation: cmd.dateCreation,
      statut: cmd.statut,
      montantTotal: cmd.montantTotal,
      paiementId: cmd.paiementId,
      produits: cmd.produits.map(p => ({
        sousProduit: p.sousProduit,
        quantite: p.quantite,
        prixUnitaire: p.prixUnitaire,
        uniteMesure: p.uniteMesure || p.sousProduit?.uniteMesure || 'Litre'
      }))
    }));
    
    res.json(formattedCommandes);
  } catch (err) {
    console.error('Erreur getClientCommandes:', err);
    res.status(500).json({ 
      message: 'Erreur lors du chargement des commandes',
      error: err.message 
    });
  }
};

// Obtenir une commande par ID
exports.getCommandeById = async (req, res) => {
  try {
    const commande = await Commande.findById(req.params.id)
      .populate('client', 'raisonSociale email')
      .populate('produits.sousProduit', 'nom prixUnitaire uniteMesure')
      .populate('commercial', 'nom email');
    
    if (!commande) {
      return res.status(404).json({ message: 'Commande non trouvée' });
    }
    
    res.json(commande);
  } catch (err) {
    console.error('Erreur getCommandeById:', err);
    res.status(500).json({ message: err.message });
  }
};

// Créer une commande
exports.createCommande = async (req, res) => {
  try {
    const { produits, numeroCommande, statut } = req.body;
    
    console.log('Création commande pour utilisateur:', req.user.id);
    
    let client = await Tiers.findOne({ user: req.user.id, type: 0 });
    
    if (!client) {
      client = await Tiers.findOne({ user: req.user.id });
      if (client) {
        client.type = 0;
        await client.save();
      } else {
        const User = require('../models/User');
        const user = await User.findById(req.user.id);
        
        if (user) {
          client = await Tiers.create({
            user: req.user.id,
            type: 0,
            raisonSociale: user.nom || user.email,
            email: user.email,
            dateCreation: new Date()
          });
        }
      }
    }
    
    if (!client) {
      return res.status(404).json({ 
        message: 'Client non trouvé. Veuillez contacter l\'administrateur.' 
      });
    }
    
    const enrichedProduits = [];
    for (const item of produits) {
      const product = await Product.findById(item.sousProduit);
      if (!product) {
        return res.status(400).json({ message: `Produit non trouvé` });
      }
      
      const stock = await Stock.findOne({ product: item.sousProduit });
      if (!stock || stock.quantity < item.quantite) {
        return res.status(400).json({ 
          message: `Stock insuffisant pour ${product.nom}. Disponible: ${stock?.quantity || 0} ${product.uniteMesure || 'unités'}` 
        });
      }
      
      enrichedProduits.push({
        sousProduit: item.sousProduit,
        quantite: item.quantite,
        prixUnitaire: item.prixUnitaire || product.prixUnitaire,
        uniteMesure: item.uniteMesure || product.uniteMesure || 'Litre'
      });
    }
    
    const numero = numeroCommande || 'CMD-' + Date.now();
    const commandeStatut = statut || (req.user.role === 'Client' ? 'En attente de paiement' : 'Attente');
    
    const commande = await Commande.create({
      numeroCommande: numero,
      client: client._id,
      produits: enrichedProduits,
      statut: commandeStatut,
      dateCreation: new Date()
    });
    
    const populatedCommande = await Commande.findById(commande._id)
      .populate('client', 'raisonSociale')
      .populate('produits.sousProduit', 'nom uniteMesure');
    
    const detailsProduits = enrichedProduits.map(p => {
      return `${p.quantite} x ${p.sousProduit}`;
    }).join(', ');
    
    if (HistoriqueController && HistoriqueController.addHistorique) {
      await HistoriqueController.addHistorique({
        entityType: "Commande",
        entityId: commande._id,
        action: "Création",
        details: `Commande #${numero} créée avec ${produits.length} produit(s): ${detailsProduits}`,
        utilisateur: req.user._id,
        ipAddress: req.ip,
      });
    }
    
    res.status(201).json(populatedCommande);
  } catch (err) {
    console.error('Erreur createCommande:', err);
    res.status(400).json({ message: err.message });
  }
};

// Mettre à jour une commande
exports.updateCommande = async (req, res) => {
  try {
    const { paiementId, statut } = req.body;
    
    const commande = await Commande.findById(req.params.id);
    
    if (!commande) {
      return res.status(404).json({ message: 'Commande non trouvée' });
    }
    
    if (paiementId) {
      commande.paiementId = paiementId;
    }
    
    if (statut) {
      commande.statut = statut;
    }
    
    commande.dateModification = new Date();
    await commande.save();
    
    try {
      if (HistoriqueController && HistoriqueController.addHistorique) {
        await HistoriqueController.addHistorique({
          entityType: "Commande",
          entityId: commande._id,
          action: "Modification",
          details: `Commande #${commande.numeroCommande} mise à jour: ${paiementId ? 'paiement ajouté' : ''} ${statut ? `statut: ${statut}` : ''}`,
          utilisateur: req.user?._id || req.user?.id,
          ipAddress: req.ip,
        });
      }
    } catch (logError) {
      console.error('Erreur ajout historique:', logError.message);
    }
    
    res.json(commande);
  } catch (err) {
    console.error('Erreur updateCommande:', err);
    res.status(400).json({ message: err.message });
  }
};

// Valider/Refuser une commande
exports.validerCommande = async (req, res) => {
  try {
    const { statut } = req.body;
    
    const commande = await Commande.findById(req.params.id)
      .populate('client', 'raisonSociale');
    
    if (!commande) {
      return res.status(404).json({ message: 'Commande non trouvée' });
    }
    
    const ancienStatut = commande.statut;
    
    if (commande.statut !== 'Attente' && commande.statut !== 'En attente de validation') {
      return res.status(400).json({ message: 'Cette commande a déjà été traitée' });
    }
    
    if (statut === 'Validée') {
      for (const item of commande.produits) {
        const stock = await Stock.findOne({ product: item.sousProduit });
        if (!stock || stock.quantity < item.quantite) {
          return res.status(400).json({ message: `Stock insuffisant` });
        }
      }
      
      for (const item of commande.produits) {
        await Stock.findOneAndUpdate(
          { product: item.sousProduit },
          { $inc: { quantity: -item.quantite } }
        );
      }
    }
    
    commande.statut = statut;
    commande.commercial = req.user.id;
    commande.dateValidation = Date.now();
    await commande.save();
    
    if (HistoriqueController && HistoriqueController.addHistorique) {
      let details = '';
      if (statut === 'Validée') {
        details = `Commande #${commande.numeroCommande} validée par ${req.user.nom || req.user.email}`;
      } else if (statut === 'Refusée') {
        details = `Commande #${commande.numeroCommande} refusée par ${req.user.nom || req.user.email}`;
      }
      
      await HistoriqueController.addHistorique({
        entityType: "Commande",
        entityId: commande._id,
        action: "Changement statut",
        ancienStatut: ancienStatut,
        nouveauStatut: statut,
        details: details,
        utilisateur: req.user._id,
        ipAddress: req.ip,
      });
    }
    
    res.json(commande);
  } catch (err) {
    console.error('Erreur validerCommande:', err);
    res.status(400).json({ message: err.message });
  }
};

// Supprimer une commande
exports.deleteCommande = async (req, res) => {
  try {
    const commande = await Commande.findById(req.params.id);
    
    if (!commande) {
      return res.status(404).json({ message: 'Commande non trouvée' });
    }
    
    if (commande.statut === 'Validée') {
      return res.status(400).json({ message: 'Impossible de supprimer une commande déjà validée' });
    }
    
    if (commande.statut === 'Livrée') {
      return res.status(400).json({ message: 'Impossible de supprimer une commande déjà livrée' });
    }
    
    const Livraison = require('../models/Livraison');
    const livraison = await Livraison.findOne({ commande: commande._id });
    if (livraison) {
      return res.status(400).json({ message: 'Impossible de supprimer une commande qui a déjà une livraison associée' });
    }
    
    if (HistoriqueController && HistoriqueController.addHistorique) {
      await HistoriqueController.addHistorique({
        entityType: "Commande",
        entityId: commande._id,
        action: "Suppression",
        details: `Commande #${commande.numeroCommande} supprimée (statut: ${commande.statut})`,
        utilisateur: req.user._id,
        ipAddress: req.ip,
      });
    }
    
    await Commande.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Commande supprimée avec succès' });
  } catch (err) {
    console.error('Erreur deleteCommande:', err);
    res.status(500).json({ message: err.message });
  }
};

// Vérifier le statut du client
exports.checkClientStatus = async (req, res) => {
  try {
    const user = req.user;
    const tiers = await Tiers.findOne({ user: req.user.id });
    
    res.json({
      user: {
        id: user._id,
        email: user.email,
        nom: user.nom,
        role: user.role
      },
      tiers: tiers ? {
        id: tiers._id,
        type: tiers.type,
        raisonSociale: tiers.raisonSociale,
        email: tiers.email
      } : null,
      message: tiers ? 'Client trouvé' : 'Aucun client associé'
    });
  } catch (err) {
    console.error('Erreur checkClientStatus:', err);
    res.status(500).json({ message: err.message });
  }
};