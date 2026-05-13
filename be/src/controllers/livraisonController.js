const Livraison = require('../models/Livraison');
const Commande = require('../models/Commande');
const Tiers = require('../models/Tiers');
const User = require('../models/User');
const PDFDocument = require('pdfkit');
const HistoriqueController = require('./historiqueController');

// ==================== UTILITAIRES ====================
const getEtatText = (etat) => {
  switch(etat) {
    case 'À préparer': return '⏳ À préparer';
    case 'Prête': return '✅ Prête';
    case 'En cours': return '🚚 En cours';
    case 'Livrée': return '📦 Livrée';
    case 'Annulée': return '❌ Annulée';
    default: return etat;
  }
};

// ==================== LISTE DES LIVRAISONS ====================
exports.getLivraisons = async (req, res) => {
  try {
    let query = {};
    const userRole = req.user.role;
    const userId = req.user._id;
    
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
      .populate('transporteur', 'nom prenom raisonSociale email telephone adresse') // ✅ Populer User
      .sort({ dateCreation: -1 });
    
    console.log(`📦 ${livraisons.length} livraisons chargées`);
    res.json(livraisons);
  } catch (err) {
    console.error('❌ Erreur getLivraisons:', err);
    res.status(500).json({ message: err.message });
  }
};

// ==================== RÉCUPÉRER LES TRANSPORTEURS ====================
exports.getTransporteurs = async (req, res) => {
  try {
    console.log('📌 Récupération des transporteurs...');
    const transporteurs = await User.find({ role: 'Transporteur' })
      .select('nom prenom raisonSociale email telephone adresse');
    
    console.log(`✅ ${transporteurs.length} transporteurs trouvés`);
    res.json(transporteurs);
  } catch (err) {
    console.error('❌ Erreur getTransporteurs:', err);
    res.status(500).json({ message: err.message });
  }
};

// ==================== CRÉER LIVRAISON DEPUIS COMMANDE ====================
exports.createLivraisonFromCommande = async (req, res) => {
  try {
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
    
    // Vérifier si une livraison existe déjà
    const existingLivraison = await Livraison.findOne({ commande: commande._id });
    if (existingLivraison) {
      return res.status(400).json({ message: 'Une livraison existe déjà pour cette commande' });
    }
    
    const count = await Livraison.countDocuments();
    const numeroLivraison = `LIV-${(count + 1).toString().padStart(4, '0')}`;
    
    const livraison = await Livraison.create({
      numeroLivraison,
      commande: commande._id,
      etat: 'À préparer',
      dateDepot: new Date(),
      dateCreation: new Date(),
      dateDerniereMiseAJour: new Date()
    });
    
    // Ajout de l'historique
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
      .populate('transporteur', 'nom prenom raisonSociale email');
    
    res.status(201).json(populatedLivraison);
  } catch (err) {
    console.error('❌ Erreur createLivraisonFromCommande:', err);
    res.status(400).json({ message: err.message });
  }
};

// ==================== METTRE À JOUR ÉTAT LIVRAISON ====================
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
    
    // Vérifier les transitions
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
    
    if (etat === 'Livrée') {
      livraison.dateLivraison = Date.now();
    }
    
    await livraison.save();
    
    // Ajout de l'historique
    await HistoriqueController.addHistorique({
      entityType: "Livraison",
      entityId: livraison._id,
      action: "Changement statut",
      details: `État changé de ${getEtatText(ancienEtat)} à ${getEtatText(etat)}${commentaire ? ` - Commentaire: ${commentaire}` : ''}`,
      utilisateur: req.user._id,
      ipAddress: req.ip,
    });
    
    const populatedLivraison = await Livraison.findById(livraison._id)
      .populate('commande', 'numeroCommande montantTotal')
      .populate('transporteur', 'nom prenom raisonSociale email');
    
    res.json(populatedLivraison);
  } catch (err) {
    console.error('❌ Erreur updateEtatLivraison:', err);
    res.status(400).json({ message: err.message });
  }
};

// ==================== ASSIGNER TRANSPORTEUR (CORRIGÉ) ====================
exports.assignTransporteur = async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Accès non autorisé. Seul l\'administrateur peut assigner un transporteur.' });
    }
    
    const { transporteurId } = req.body;
    
    console.log('📌 Assignation - Livraison ID:', req.params.id);
    console.log('📌 Transporteur ID:', transporteurId);
    
    if (!transporteurId) {
      return res.status(400).json({ message: 'Veuillez sélectionner un transporteur' });
    }
    
    // Récupérer le transporteur
    const transporteur = await User.findById(transporteurId);
    
    if (!transporteur) {
      return res.status(404).json({ message: 'Transporteur non trouvé' });
    }
    
    if (transporteur.role !== 'Transporteur') {
      return res.status(400).json({ message: 'L\'utilisateur sélectionné n\'est pas un transporteur' });
    }
    
    // Mettre à jour la livraison
    const livraison = await Livraison.findById(req.params.id);
    
    if (!livraison) {
      return res.status(404).json({ message: 'Livraison non trouvée' });
    }
    
    // ✅ Assigner le transporteur
    livraison.transporteur = transporteurId;
    livraison.dateDerniereMiseAJour = Date.now();
    
    await livraison.save();
    
    console.log('✅ Livraison mise à jour:', livraison._id);
    console.log('✅ Transporteur assigné:', livraison.transporteur);
    
    // Recharger avec populate
    const livraisonPopulated = await Livraison.findById(livraison._id)
      .populate('commande', 'numeroCommande montantTotal dateCreation')
      .populate('transporteur', 'nom prenom raisonSociale email telephone adresse role');
    
    console.log('✅ Transporteur peuplé:', livraisonPopulated.transporteur);
    
    // Ajout de l'historique
    await HistoriqueController.addHistorique({
      entityType: "Livraison",
      entityId: livraison._id,
      action: "Modification",
      details: `Transporteur assigné: ${transporteur.raisonSociale || transporteur.nom || transporteur.email}`,
      utilisateur: req.user._id,
      ipAddress: req.ip,
    });
    
    res.json({
      success: true,
      message: `Transporteur "${transporteur.raisonSociale || transporteur.nom}" assigné avec succès`,
      livraison: livraisonPopulated
    });
    
  } catch (err) {
    console.error('❌ Erreur assignTransporteur:', err);
    res.status(500).json({ message: err.message });
  }
};

// ==================== GÉNÉRER BON DE LIVRAISON PDF ====================
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
      .populate('transporteur', 'nom prenom raisonSociale email telephone adresse');
    
    if (!livraison) {
      return res.status(404).json({ message: 'Livraison non trouvée' });
    }
    
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks = [];
    
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=bon_livraison_${livraison.numeroLivraison}.pdf`);
      res.send(pdfBuffer);
    });
    
    // En-tête
    doc.fontSize(20)
      .font('Helvetica-Bold')
      .fillColor('#1a2c3e')
      .text('BON DE LIVRAISON', { align: 'center' })
      .moveDown();
    
    doc.fontSize(12)
      .font('Helvetica')
      .text(`N°: ${livraison.numeroLivraison}`, { align: 'center' })
      .moveDown();
    
    doc.strokeColor('#000000')
      .lineWidth(1)
      .moveTo(50, doc.y)
      .lineTo(550, doc.y)
      .stroke()
      .moveDown();
    
    // Informations
    doc.fontSize(14).font('Helvetica-Bold').text('Informations de livraison', { underline: true }).moveDown(0.5);
    doc.fontSize(10).font('Helvetica');
    doc.text(`État: ${getEtatText(livraison.etat)}`);
    doc.text(`Date de création: ${new Date(livraison.dateCreation).toLocaleDateString('fr-FR')}`);
    doc.text(`Commande: ${livraison.commande?.numeroCommande || 'N/A'}`);
    doc.moveDown();
    
    // Transporteur
    if (livraison.transporteur) {
      doc.fontSize(14).font('Helvetica-Bold').text('Transporteur', { underline: true }).moveDown(0.5);
      doc.fontSize(10).font('Helvetica');
      doc.text(`Nom: ${livraison.transporteur.raisonSociale || livraison.transporteur.nom || '-'}`);
      doc.text(`Email: ${livraison.transporteur.email || '-'}`);
      doc.text(`Téléphone: ${livraison.transporteur.telephone || '-'}`);
      doc.moveDown();
    }
    
    // Produits
    doc.fontSize(14).font('Helvetica-Bold').text('Produits', { underline: true }).moveDown(0.5);
    
    let y = doc.y;
    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('Produit', 50, y);
    doc.text('Quantité', 250, y);
    doc.text('Prix unitaire', 350, y);
    doc.text('Total', 450, y);
    
    y += 20;
    let totalGeneral = 0;
    
    livraison.commande?.produits?.forEach((produit) => {
      const nom = produit.sousProduit?.nom || 'Produit';
      const quantite = produit.quantite;
      const prixUnitaire = produit.prixUnitaire;
      const total = quantite * prixUnitaire;
      totalGeneral += total;
      
      doc.font('Helvetica').fontSize(9);
      doc.text(nom, 50, y);
      doc.text(`${quantite}`, 250, y);
      doc.text(`${prixUnitaire.toLocaleString()} TND`, 350, y);
      doc.text(`${total.toLocaleString()} TND`, 450, y);
      y += 20;
    });
    
    y += 10;
    doc.font('Helvetica-Bold').fontSize(11);
    doc.text('Total général:', 350, y);
    doc.text(`${totalGeneral.toLocaleString()} TND`, 450, y);
    
    // Signatures
    y += 50;
    doc.fontSize(10).font('Helvetica-Bold').text('Signatures', { underline: true }).moveDown(0.5);
    
    doc.rect(70, y, 200, 60).stroke();
    doc.fontSize(8).text('Signature du transporteur', 170, y + 25, { align: 'center' });
    
    doc.rect(340, y, 200, 60).stroke();
    doc.text('Signature du client', 440, y + 25, { align: 'center' });
    
    doc.fontSize(8).font('Helvetica');
    doc.text('Document généré le ' + new Date().toLocaleDateString('fr-FR'), 50, 750, { align: 'center' });
    
    doc.end();
    
  } catch (error) {
    console.error('❌ Erreur generateBonLivraisonPDF:', error);
    res.status(500).json({ message: error.message });
  }
};

// ==================== SUPPRIMER LIVRAISON ====================
exports.deleteLivraison = async (req, res) => {
  try {
    const livraison = await Livraison.findById(req.params.id);
    
    if (!livraison) {
      return res.status(404).json({ message: 'Livraison non trouvée' });
    }
    
    if (livraison.etat === 'En cours' || livraison.etat === 'Livrée') {
      return res.status(400).json({ message: 'Impossible de supprimer une livraison en cours ou déjà livrée' });
    }
    
    await HistoriqueController.addHistorique({
      entityType: "Livraison",
      entityId: livraison._id,
      action: "Suppression",
      details: `Livraison #${livraison.numeroLivraison} supprimée`,
      utilisateur: req.user._id,
      ipAddress: req.ip,
    });
    
    await Livraison.findByIdAndDelete(req.params.id);
    res.json({ message: 'Livraison supprimée avec succès' });
  } catch (err) {
    console.error('❌ Erreur deleteLivraison:', err);
    res.status(500).json({ message: err.message });
  }
};