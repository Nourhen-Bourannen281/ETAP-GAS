const Paiement = require('../models/Paiement');
const Facture = require('../models/Facture');
const Commande = require('../models/Commande');
const Notification = require('../models/Notification');
const ActionLog = require('../models/ActionLog');

// Fonction utilitaire pour normaliser les noms des modes de paiement
const normalizeModePaiement = (mode) => {
  const normalizationMap = {
    'cheque': 'Chèque',
    'cheque': 'Chèque',
    'espece': 'Espèces',
    'espèces': 'Espèces',
    'carte banquaire': 'Carte bancaire',
    'carte bancaire': 'Carte bancaire',
    'carte': 'Carte bancaire',
    'virement': 'Virement',
    'chèque': 'Chèque',
    'cash': 'Espèces',
    'card': 'Carte bancaire',
    'bank transfer': 'Virement'
  };
  
  const lowerMode = mode?.toLowerCase().trim();
  return normalizationMap[lowerMode] || mode;
};

// Liste des paiements
exports.getPaiements = async (req, res) => {
  try {
    const paiements = await Paiement.find()
      .populate('commande', 'numeroCommande montantTotal')
      .populate('facture', 'numeroFacture montantTotal')
      .populate('client', 'nom email')
      .populate('tiers', 'nom')
      .populate('validePar', 'nom email')
      .sort({ datePaiement: -1 });
    res.json(paiements);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Créer un paiement
exports.createPaiement = async (req, res) => {
  try {
    const { 
      commande, 
      facture, 
      client, 
      clientId, 
      clientNom,
      montant, 
      modePaiement,
      devise,
      reference,
      description
    } = req.body;

    // Validation des champs requis
    if (!montant) {
      return res.status(400).json({ message: 'Le montant est obligatoire' });
    }
    if (!modePaiement) {
      return res.status(400).json({ message: 'Le mode de paiement est obligatoire' });
    }

    // Normaliser le mode de paiement
    const normalizedModePaiement = normalizeModePaiement(modePaiement);
    console.log(`Mode de paiement normalisé: ${modePaiement} -> ${normalizedModePaiement}`);

    // Générer un numéro de paiement unique
    const numeroPaiement = `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Préparer les données du paiement
    const paiementData = {
      numeroPaiement,
      commande: commande || null,
      facture: facture || null,
      client: client || clientId || (req.user ? req.user._id || req.user.id : null),
      clientId: client || clientId || (req.user ? req.user._id || req.user.id : null),
      clientNom: clientNom || (req.user ? req.user.nom : 'Client'),
      montant: montant,
      devise: devise || 'TND',
      modePaiement: normalizedModePaiement, // Utiliser le mode normalisé
      statut: 'En attente',
      datePaiement: new Date(),
      reference: reference || null,
      description: description || `Paiement pour ${commande ? 'commande' : 'facture'}`
    };

    // Supprimer les champs undefined
    Object.keys(paiementData).forEach(key => {
      if (paiementData[key] === undefined || paiementData[key] === null) {
        delete paiementData[key];
      }
    });

    const paiement = await Paiement.create(paiementData);

    // Enregistrer dans le journal
    if (req.user && (req.user._id || req.user.id)) {
      try {
        const userId = req.user._id || req.user.id;
        await ActionLog.create({
          utilisateur: userId,
          action: 'CréationPaiement',
          details: `Paiement ${paiement.numeroPaiement} créé pour ${commande ? 'commande' : 'facture'} ${commande || facture || 'N/A'} avec mode: ${normalizedModePaiement}`,
          ipAddress: req.ip || req.headers['x-forwarded-for'] || 'unknown',
          dateAction: new Date()
        });
      } catch (logError) {
        console.error('Erreur création ActionLog:', logError.message);
      }
    }

    // Notification
    const userId = client || clientId || (req.user ? (req.user._id || req.user.id) : null);
    if (userId) {
      try {
        await Notification.create({
          utilisateur: userId,
          type: 'PaiementRecu',
          message: `Un nouveau paiement de ${montant} ${devise || 'TND'} a été enregistré. Mode: ${normalizedModePaiement}`,
          lien: `/paiements/${paiement._id}`,
          dateEnvoi: new Date()
        });
      } catch (notifError) {
        console.error('Erreur création Notification:', notifError.message);
      }
    }

    res.status(201).json(paiement);
  } catch (err) {
    console.error('Erreur création paiement:', err.message);
    res.status(400).json({ message: err.message });
  }
};

// Valider un paiement (Admin seulement)
exports.validerPaiement = async (req, res) => {
  try {
    const paiement = await Paiement.findByIdAndUpdate(
      req.params.id,
      { 
        statut: 'Validé', 
        validePar: req.user ? (req.user._id || req.user.id) : null, 
        dateValidation: new Date() 
      },
      { new: true }
    );

    if (!paiement) {
      return res.status(404).json({ message: 'Paiement non trouvé' });
    }

    // Mettre à jour le statut de la commande associée si elle existe
    if (paiement.commande) {
      await Commande.findByIdAndUpdate(
        paiement.commande,
        { 
          statut: 'Payée',
          paiementId: paiement._id
        }
      );
    }

    // Mettre à jour le statut de la facture associée si elle existe
    if (paiement.facture) {
      await Facture.findByIdAndUpdate(
        paiement.facture,
        { 
          statut: 'Payée',
          paiementId: paiement._id
        }
      );
    }

    // Enregistrer dans le journal
    if (req.user && (req.user._id || req.user.id)) {
      try {
        await ActionLog.create({
          utilisateur: req.user._id || req.user.id,
          action: 'ValidationPaiement',
          details: `Paiement ${paiement.numeroPaiement} validé par ${req.user.nom || req.user.email}`,
          ipAddress: req.ip || req.headers['x-forwarded-for'] || 'unknown',
          dateAction: new Date()
        });
      } catch (logError) {
        console.error('Erreur création ActionLog:', logError.message);
      }
    }

    // Notification de validation
    if (paiement.client || paiement.clientId) {
      try {
        await Notification.create({
          utilisateur: paiement.client || paiement.clientId,
          type: 'PaiementValide',
          message: `Votre paiement de ${paiement.montant} ${paiement.devise} a été validé.`,
          lien: `/paiements/${paiement._id}`,
          dateEnvoi: new Date()
        });
      } catch (notifError) {
        console.error('Erreur création Notification:', notifError.message);
      }
    }

    res.json(paiement);
  } catch (err) {
    console.error('Erreur validation paiement:', err.message);
    res.status(400).json({ message: err.message });
  }
};

// Récupérer les paiements d'un client
exports.getMesPaiements = async (req, res) => {
  try {
    const paiements = await Paiement.find({
      $or: [
        { client: req.user._id || req.user.id },
        { clientId: req.user._id || req.user.id }
      ]
    })
      .populate('commande', 'numeroCommande montantTotal')
      .populate('facture', 'numeroFacture montantTotal')
      .sort({ datePaiement: -1 });
    
    res.json(paiements);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Rejeter un paiement
exports.rejeterPaiement = async (req, res) => {
  try {
    const paiement = await Paiement.findByIdAndUpdate(
      req.params.id,
      { 
        statut: 'Rejeté', 
        validePar: req.user ? (req.user._id || req.user.id) : null, 
        dateValidation: new Date() 
      },
      { new: true }
    );

    if (!paiement) {
      return res.status(404).json({ message: 'Paiement non trouvé' });
    }

    if (req.user && (req.user._id || req.user.id)) {
      try {
        await ActionLog.create({
          utilisateur: req.user._id || req.user.id,
          action: 'RejetPaiement',
          details: `Paiement ${paiement.numeroPaiement} rejeté par ${req.user.nom || req.user.email}`,
          ipAddress: req.ip || req.headers['x-forwarded-for'] || 'unknown',
          dateAction: new Date()
        });
      } catch (logError) {
        console.error('Erreur création ActionLog:', logError.message);
      }
    }

    res.json(paiement);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Obtenir un paiement par ID
exports.getPaiementById = async (req, res) => {
  try {
    const paiement = await Paiement.findById(req.params.id)
      .populate('commande', 'numeroCommande montantTotal')
      .populate('facture', 'numeroFacture montantTotal')
      .populate('client', 'nom email')
      .populate('validePar', 'nom email');
    
    if (!paiement) {
      return res.status(404).json({ message: 'Paiement non trouvé' });
    }
    
    res.json(paiement);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Supprimer un paiement (Admin seulement)
exports.deletePaiement = async (req, res) => {
  try {
    const paiement = await Paiement.findById(req.params.id);
    
    if (!paiement) {
      return res.status(404).json({ message: 'Paiement non trouvé' });
    }
    
    await paiement.deleteOne();
    
    // Enregistrer dans le journal
    if (req.user && (req.user._id || req.user.id)) {
      await ActionLog.create({
        utilisateur: req.user._id || req.user.id,
        action: 'SuppressionPaiement',
        details: `Paiement ${paiement.numeroPaiement} supprimé`,
        ipAddress: req.ip || req.headers['x-forwarded-for'] || 'unknown',
        dateAction: new Date()
      });
    }
    
    res.json({ message: 'Paiement supprimé avec succès' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};