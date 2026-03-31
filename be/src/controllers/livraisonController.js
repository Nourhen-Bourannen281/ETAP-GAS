const Livraison = require('../models/Livraison');
const Commande = require('../models/Commande');
const Tiers = require('../models/Tiers');
const User = require('../models/User');
const PDFDocument = require('pdfkit');
const HistoriqueController = require('./historiqueController');

// ==================== LISTE DES LIVRAISONS ====================
exports.getLivraisons = async (req, res) => {
  try {
    let query = {};
    const userRole = req.user.role;
    const userId = req.user.id;
    
    // Si c'est un transporteur, filtrer par ses livraisons
    if (userRole === 'Transporteur') {
      query.transporteur = userId;
    }
    
    const livraisons = await Livraison.find(query)
      .populate({
        path: 'commande',
        select: 'numeroCommande montantTotal dateCreation produits',
        populate: {
          path: 'produits.sousProduit',
          model: 'SousProduit',
          select: 'nom uniteMesure prixUnitaire'
        }
      })
      .populate('transporteur', 'nom email telephone adresse raisonSociale')
      .sort({ dateCreation: -1 });
    
    res.json(livraisons);
  } catch (err) {
    console.error('Erreur getLivraisons:', err);
    res.status(500).json({ message: err.message });
  }
};

// ==================== CRÉER LIVRAISON DEPUIS COMMANDE (AVEC HISTORIQUE) ====================
exports.createLivraisonFromCommande = async (req, res) => {
  try {
    // Vérifier que l'utilisateur est Commercial ou Admin
    if (req.user.role !== 'Commercial' && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Accès non autorisé. Seuls les commerciaux et administrateurs peuvent créer des livraisons.' });
    }
    
    const commande = await Commande.findById(req.params.commandeId)
      .populate('produits.sousProduit', 'nom uniteMesure');
    
    if (!commande) {
      return res.status(404).json({ message: 'Commande non trouvée' });
    }
    
    if (commande.statut !== 'Validée') {
      return res.status(400).json({ message: 'La commande doit être validée pour créer une livraison' });
    }
    
    // Vérifier si une livraison existe déjà pour cette commande
    const existingLivraison = await Livraison.findOne({ commande: commande._id });
    if (existingLivraison) {
      return res.status(400).json({ message: 'Une livraison existe déjà pour cette commande' });
    }
    
    const numeroLivraison = 'LIV-' + Date.now();
    
    const livraison = await Livraison.create({
      numeroLivraison: numeroLivraison,
      commande: commande._id,
      etat: 'À préparer',
      dateDepot: new Date(),
      dateCreation: new Date(),
      dateDerniereMiseAJour: new Date()
    });
    
    // ➜ AJOUT DE L'HISTORIQUE POUR LA CRÉATION
    await HistoriqueController.addHistorique({
      entityType: "Livraison",
      entityId: livraison._id,
      action: "Création",
      details: `Livraison #${numeroLivraison} créée pour la commande #${commande.numeroCommande}`,
      utilisateur: req.user._id,
      ipAddress: req.ip,
    });
    
    const populatedLivraison = await Livraison.findById(livraison._id)
      .populate('commande', 'numeroCommande montantTotal dateCreation')
      .populate('transporteur', 'nom raisonSociale email');
    
    res.status(201).json(populatedLivraison);
  } catch (err) {
    console.error('Erreur createLivraisonFromCommande:', err);
    
    await HistoriqueController.addHistorique({
      entityType: "Livraison",
      action: "Création",
      details: `Erreur création livraison: ${err.message}`,
      utilisateur: req.user?._id,
      ipAddress: req.ip
    });
    
    res.status(400).json({ message: err.message });
  }
};

// ==================== METTRE À JOUR ÉTAT LIVRAISON (AVEC HISTORIQUE) ====================
exports.updateEtatLivraison = async (req, res) => {
  try {
    const { etat, commentaire } = req.body;
    const userRole = req.user.role;
    
    const livraison = await Livraison.findById(req.params.id)
      .populate('commande', 'numeroCommande');
    
    if (!livraison) {
      return res.status(404).json({ message: 'Livraison non trouvée' });
    }
    
    const ancienEtat = livraison.etat;
    
    // Vérifier les droits selon l'état
    const transitionsValides = {
      'À préparer': { next: ['Prête', 'Annulée'], roles: ['Commercial', 'Admin'] },
      'Prête': { next: ['En cours', 'Annulée'], roles: ['Commercial', 'Admin', 'Transporteur'] },
      'En cours': { next: ['Livrée', 'Annulée'], roles: ['Commercial', 'Admin', 'Transporteur'] },
      'Livrée': { next: [], roles: [] },
      'Annulée': { next: [], roles: [] }
    };
    
    const transition = transitionsValides[livraison.etat];
    if (!transition || !transition.next.includes(etat)) {
      return res.status(400).json({ 
        message: `Transition invalide de ${livraison.etat} vers ${etat}` 
      });
    }
    
    if (!transition.roles.includes(userRole)) {
      return res.status(403).json({ 
        message: `Seuls ${transition.roles.join(', ')} peuvent changer l'état de ${livraison.etat} vers ${etat}` 
      });
    }
    
    livraison.etat = etat;
    if (commentaire) livraison.commentaire = commentaire;
    livraison.dateDerniereMiseAJour = Date.now();
    
    // Si la livraison est livrée, enregistrer la date
    if (etat === 'Livrée') {
      livraison.dateLivraison = Date.now();
    }
    
    await livraison.save();
    
    // ➜ AJOUT DE L'HISTORIQUE POUR LE CHANGEMENT D'ÉTAT
    let details = `État changé de ${exports.getEtatText(ancienEtat)} à ${exports.getEtatText(etat)}`;
    if (commentaire) {
      details += ` - Commentaire: ${commentaire}`;
    }
    
    await HistoriqueController.addHistorique({
      entityType: "Livraison",
      entityId: livraison._id,
      action: "Changement statut",
      ancienStatut: ancienEtat,
      nouveauStatut: etat,
      details: details,
      utilisateur: req.user._id,
      ipAddress: req.ip,
    });
    
    const populatedLivraison = await Livraison.findById(livraison._id)
      .populate('commande', 'numeroCommande montantTotal')
      .populate('transporteur', 'nom raisonSociale email');
    
    res.json(populatedLivraison);
  } catch (err) {
    console.error('Erreur updateEtatLivraison:', err);
    
    await HistoriqueController.addHistorique({
      entityType: "Livraison",
      entityId: req.params.id,
      action: "Changement statut",
      details: `Erreur changement état: ${err.message}`,
      utilisateur: req.user?._id,
      ipAddress: req.ip
    });
    
    res.status(400).json({ message: err.message });
  }
};

// ==================== ASSIGNER TRANSPORTEUR (AVEC HISTORIQUE) ====================
exports.assignTransporteur = async (req, res) => {
  try {
    // Vérifier que l'utilisateur est Admin
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Accès non autorisé. Seul l\'administrateur peut assigner un transporteur.' });
    }
    
    const { transporteurId } = req.body;
    
    if (!transporteurId) {
      return res.status(400).json({ message: 'Veuillez sélectionner un transporteur' });
    }
    
    // Récupérer le transporteur depuis la collection User
    const transporteur = await User.findById(transporteurId);
    if (!transporteur || transporteur.role !== 'Transporteur') {
      return res.status(404).json({ message: 'Transporteur non trouvé' });
    }
    
    const livraison = await Livraison.findById(req.params.id);
    if (!livraison) {
      return res.status(404).json({ message: 'Livraison non trouvée' });
    }
    
    const ancienTransporteur = livraison.transporteur;
    
    const livraisonUpdated = await Livraison.findByIdAndUpdate(
      req.params.id,
      { 
        transporteur: transporteurId, 
        dateDerniereMiseAJour: Date.now() 
      },
      { new: true }
    )
      .populate('commande', 'numeroCommande montantTotal')
      .populate('transporteur', 'nom raisonSociale email telephone adresse');
    
    // ➜ AJOUT DE L'HISTORIQUE POUR L'ASSIGNATION DU TRANSPORTEUR
    let details = `Transporteur assigné: ${transporteur.raisonSociale || transporteur.nom}`;
    if (ancienTransporteur) {
      const ancienTransporteurData = await User.findById(ancienTransporteur);
      details += ` (remplace ${ancienTransporteurData?.raisonSociale || ancienTransporteurData?.nom || 'précédent'})`;
    }
    
    await HistoriqueController.addHistorique({
      entityType: "Livraison",
      entityId: livraison._id,
      action: "Modification",
      details: details,
      utilisateur: req.user._id,
      ipAddress: req.ip,
    });
    
    res.json(livraisonUpdated);
  } catch (err) {
    console.error('Erreur assignTransporteur:', err);
    
    await HistoriqueController.addHistorique({
      entityType: "Livraison",
      entityId: req.params.id,
      action: "Modification",
      details: `Erreur assignation transporteur: ${err.message}`,
      utilisateur: req.user?._id,
      ipAddress: req.ip
    });
    
    res.status(400).json({ message: err.message });
  }
};

// ==================== GÉNÉRER BON DE LIVRAISON PDF (AVEC HISTORIQUE) ====================
exports.generateBonLivraisonPDF = async (req, res) => {
  try {
    const livraison = await Livraison.findById(req.params.id)
      .populate({
        path: 'commande',
        select: 'numeroCommande montantTotal dateCreation produits',
        populate: {
          path: 'produits.sousProduit',
          model: 'SousProduit',
          select: 'nom uniteMesure prixUnitaire'
        }
      })
      .populate('transporteur', 'nom raisonSociale email telephone adresse');
    
    if (!livraison) {
      return res.status(404).json({ message: 'Livraison non trouvée' });
    }
    
    // Vérifier les droits d'accès
    const userRole = req.user.role;
    const userId = req.user.id;
    
    if (userRole === 'Transporteur') {
      if (livraison.transporteur?._id?.toString() !== userId) {
        return res.status(403).json({ message: 'Accès non autorisé' });
      }
    }
    
    // ➜ AJOUT DE L'HISTORIQUE POUR L'EXPORT PDF
    await HistoriqueController.addHistorique({
      entityType: "Livraison",
      entityId: livraison._id,
      action: "Modification",
      details: `Export PDF du bon de livraison #${livraison.numeroLivraison} par ${req.user.nom || req.user.email}`,
      utilisateur: req.user._id,
      ipAddress: req.ip,
    });
    
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks = [];
    
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=bon_livraison_${livraison.numeroLivraison}.pdf`);
      res.setHeader('Content-Length', pdfBuffer.length);
      res.send(pdfBuffer);
    });
    doc.on('error', (err) => {
      console.error('Erreur PDF:', err);
      res.status(500).json({ message: err.message });
    });
    
    // En-tête
    doc.fontSize(20)
      .font('Helvetica-Bold')
      .text('BON DE LIVRAISON', { align: 'center' })
      .moveDown();
    
    doc.fontSize(12)
      .font('Helvetica')
      .text(`N° Livraison: ${livraison.numeroLivraison}`, { align: 'center' })
      .moveDown();
    
    // Ligne de séparation
    doc.strokeColor('#000000')
      .lineWidth(1)
      .moveTo(50, doc.y)
      .lineTo(550, doc.y)
      .stroke()
      .moveDown();
    
    // Informations de la livraison
    doc.fontSize(14)
      .font('Helvetica-Bold')
      .text('Informations de livraison', { underline: true })
      .moveDown(0.5);
    
    doc.fontSize(10)
      .font('Helvetica')
      .text(`État: ${exports.getEtatText(livraison.etat)}`)
      .text(`Date de dépôt: ${new Date(livraison.dateDepot).toLocaleDateString('fr-FR')}`)
      .text(`Date de création: ${new Date(livraison.dateCreation).toLocaleDateString('fr-FR')}`);
    
    if (livraison.dateArriveePrevue) {
      doc.text(`Date d'arrivée prévue: ${new Date(livraison.dateArriveePrevue).toLocaleDateString('fr-FR')}`);
    }
    if (livraison.dateLivraison) {
      doc.text(`Date de livraison: ${new Date(livraison.dateLivraison).toLocaleDateString('fr-FR')}`);
    }
    if (livraison.commentaire) {
      doc.text(`Commentaire: ${livraison.commentaire}`);
    }
    doc.moveDown();
    
    // Informations du transporteur
    if (livraison.transporteur) {
      doc.fontSize(14)
        .font('Helvetica-Bold')
        .text('Transporteur', { underline: true })
        .moveDown(0.5);
      
      doc.fontSize(10)
        .font('Helvetica')
        .text(`Nom: ${livraison.transporteur.raisonSociale || livraison.transporteur.nom || '-'}`)
        .text(`Email: ${livraison.transporteur.email || '-'}`)
        .text(`Téléphone: ${livraison.transporteur.telephone || '-'}`)
        .text(`Adresse: ${livraison.transporteur.adresse || '-'}`)
        .moveDown();
    }
    
    // Informations de la commande
    doc.fontSize(14)
      .font('Helvetica-Bold')
      .text('Détails de la commande', { underline: true })
      .moveDown(0.5);
    
    doc.fontSize(10)
      .font('Helvetica')
      .text(`N° Commande: ${livraison.commande?.numeroCommande || '-'}`)
      .text(`Date commande: ${livraison.commande?.dateCreation ? new Date(livraison.commande.dateCreation).toLocaleDateString('fr-FR') : '-'}`)
      .moveDown();
    
    // Produits
    doc.fontSize(12)
      .font('Helvetica-Bold')
      .text('Produits', { underline: true })
      .moveDown(0.5);
    
    const startY = doc.y;
    const productX = 50;
    const qtyX = 250;
    const priceX = 350;
    const totalX = 450;
    
    doc.fontSize(9)
      .font('Helvetica-Bold')
      .text('Produit', productX, startY)
      .text('Quantité', qtyX, startY)
      .text('Prix unitaire', priceX, startY)
      .text('Total', totalX, startY);
    
    let y = startY + 20;
    let totalGeneral = 0;
    
    livraison.commande?.produits?.forEach((produit) => {
      const nom = produit.sousProduit?.nom || 'Produit';
      const quantite = produit.quantite;
      const prixUnitaire = produit.prixUnitaire;
      const total = quantite * prixUnitaire;
      totalGeneral += total;
      
      doc.font('Helvetica')
        .fontSize(9)
        .text(nom, productX, y)
        .text(`${quantite} ${produit.sousProduit?.uniteMesure || ''}`, qtyX, y)
        .text(`${prixUnitaire.toLocaleString()} TND`, priceX, y)
        .text(`${total.toLocaleString()} TND`, totalX, y);
      
      y += 20;
    });
    
    y += 10;
    doc.font('Helvetica-Bold')
      .fontSize(11)
      .text('Total général:', totalX - 80, y)
      .text(`${totalGeneral.toLocaleString()} TND`, totalX, y);
    
    // Pied de page
    doc.fontSize(8)
      .font('Helvetica')
      .text('Document généré le ' + new Date().toLocaleDateString('fr-FR'), 50, 750, { align: 'center' });
    
    doc.end();
    
  } catch (error) {
    console.error('Erreur generateBonLivraisonPDF:', error);
    res.status(500).json({ message: error.message });
  }
};

// ==================== GET ETAT TEXTE ====================
exports.getEtatText = (etat) => {
  switch(etat) {
    case 'À préparer': return '⏳ À préparer';
    case 'Prête': return '✅ Prête';
    case 'En cours': return '🚚 En cours';
    case 'Livrée': return '📦 Livrée';
    case 'Annulée': return '❌ Annulée';
    default: return etat;
  }
};

// ==================== ROUTE POUR RÉCUPÉRER LES TRANSPORTEURS ====================
exports.getTransporteurs = async (req, res) => {
  try {
    const transporteurs = await User.find({ role: 'Transporteur' })
      .select('nom raisonSociale email telephone adresse');
    res.json(transporteurs);
  } catch (err) {
    console.error('Erreur getTransporteurs:', err);
    res.status(500).json({ message: err.message });
  }
};

// ==================== SUPPRIMER UNE LIVRAISON (AJOUTÉ) ====================
exports.deleteLivraison = async (req, res) => {
  try {
    const livraison = await Livraison.findById(req.params.id);
    
    if (!livraison) {
      return res.status(404).json({ message: 'Livraison non trouvée' });
    }
    
    // Vérifier si la livraison peut être supprimée
    if (livraison.etat === 'En cours' || livraison.etat === 'Livrée') {
      return res.status(400).json({ message: 'Impossible de supprimer une livraison en cours ou déjà livrée' });
    }
    
    // ➜ AJOUT DE L'HISTORIQUE AVANT SUPPRESSION
    await HistoriqueController.addHistorique({
      entityType: "Livraison",
      entityId: livraison._id,
      action: "Suppression",
      details: `Livraison #${livraison.numeroLivraison} supprimée (État: ${livraison.etat})`,
      utilisateur: req.user._id,
      ipAddress: req.ip,
    });
    
    await Livraison.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Livraison supprimée avec succès' });
  } catch (err) {
    console.error('Erreur deleteLivraison:', err);
    res.status(500).json({ message: err.message });
  }
};