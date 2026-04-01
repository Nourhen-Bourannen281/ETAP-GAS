// controllers/factureController.js
const Facture = require('../models/Facture');
const Contrat = require('../models/Contrat');
const Commande = require('../models/Commande');
const Livraison = require('../models/Livraison');
const Document = require('../models/Document');
const TypeFacture = require('../models/TypeFacture');
const User = require('../models/User');
const pdfGenerator = require('../utils/pdfGenerator');
const { addHistorique } = require("./historiqueController");
const Tiers = require('../models/Tiers');

// Helper pour déterminer le filtre selon le rôle
const getFactureFilter = async (user) => {
  let query = {};

  switch(user.role) {
    case 'Admin':
    case 'Commercial':
      query = {}; // voit tout
      break;

    case 'Client':
      // Trouver le tiers lié à ce user
      const tiersClient = await Tiers.findOne({ user: user._id, type: 0 });
      if (!tiersClient) {
        console.log('No client tier found for user:', user._id);
        return { _id: null };
      }

      // Récupérer les contrats liés à ce tiers
      const contratsClient = await Contrat.find({ tiers: tiersClient._id });
      const contratIdsClient = contratsClient.map(c => c._id);
      
      if (contratIdsClient.length === 0) {
        return { _id: null };
      }
      
      query = { contrat: { $in: contratIdsClient } };
      break;

    case 'Fournisseur':
      const tiersFournisseur = await Tiers.findOne({ user: user._id, type: 1 });
      if (!tiersFournisseur) {
        console.log('No fournisseur tier found for user:', user._id);
        return { _id: null };
      }

      const contratsFournisseur = await Contrat.find({ tiers: tiersFournisseur._id });
      const contratIdsFournisseur = contratsFournisseur.map(c => c._id);
      
      if (contratIdsFournisseur.length === 0) {
        return { _id: null };
      }
      
      query = { contrat: { $in: contratIdsFournisseur } };
      break;

    default:
      query = {};
  }

  return query;
};

// Helper pour vérifier les droits d'accès à une facture spécifique
const canAccessFacture = async (user, facture) => {
  switch(user.role) {
    case 'Admin':
      return true;
      
    case 'Commercial':
      return true;
      
    case 'Client':
      if (facture.contrat) {
        const contrat = await Contrat.findById(facture.contrat).populate('tiers');
        return contrat && contrat.tiers && contrat.tiers.user && 
               contrat.tiers.user.toString() === user._id.toString();
      }
      return false;

    case 'Fournisseur':
      if (facture.contrat) {
        const contrat = await Contrat.findById(facture.contrat).populate('tiers');
        return contrat && contrat.tiers && contrat.tiers.user && 
               contrat.tiers.user.toString() === user._id.toString();
      }
      return false;
      
    case 'Transporteur':
      return false;
      
    default:
      return false;
  }
};

// Obtenir toutes les factures (avec filtrage par rôle)
exports.getFactures = async (req, res) => {
  try {
    const filter = await getFactureFilter(req.user);
    
    // Si le filtre retourne { _id: null }, retourner un tableau vide
    if (filter._id === null) {
      return res.json([]);
    }

    let factures = await Facture.find(filter)
      .populate({
        path: 'contrat',
        populate: { 
          path: 'tiers', 
          select: 'raisonSociale user type nom prenom email'
        }
      })
      .populate('typeFacture', 'nom devise')
      .populate('commande', 'numeroCommande')
      .populate('livraison', 'numeroLivraison')
      .sort({ dateCreation: -1 });

    // Filtrer côté serveur pour les clients et fournisseurs (sécurité supplémentaire)
    if (req.user.role === 'Client' || req.user.role === 'Fournisseur') {
      factures = factures.filter(facture => {
        // Vérifier que le contrat existe et est peuplé
        if (!facture.contrat || !facture.contrat.tiers) {
          return false;
        }
        
        // Vérifier que le tiers a un user associé
        if (!facture.contrat.tiers.user) {
          return false;
        }
        
        // Comparer l'ID utilisateur
        return facture.contrat.tiers.user.toString() === req.user._id.toString();
      });
    }

    res.json(factures);
  } catch (err) {
    console.error('Erreur getFactures:', err);
    res.status(500).json({ message: err.message });
  }
};

// Obtenir une facture par ID (avec vérification des droits)
exports.getFactureById = async (req, res) => {
  try {
    const facture = await Facture.findById(req.params.id)
      .populate({
        path: 'contrat',
        populate: { 
          path: 'tiers', 
          select: 'raisonSociale user type nom prenom email'
        }
      })
      .populate('typeFacture', 'nom devise')
      .populate('commande', 'numeroCommande')
      .populate('livraison', 'numeroLivraison');
      
    if (!facture) {
      return res.status(404).json({ message: 'Facture non trouvée' });
    }
    
    // Vérifier les droits d'accès
    const hasAccess = await canAccessFacture(req.user, facture);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Accès non autorisé à cette facture' });
    }
    
    res.json(facture);
  } catch (err) {
    console.error('Erreur getFactureById:', err);
    res.status(500).json({ message: err.message });
  }
};

// Statistiques des factures (avec filtrage par rôle)
exports.getFacturesStats = async (req, res) => {
  try {
    const filter = await getFactureFilter(req.user);
    
    // Si le filtre retourne { _id: null }, retourner des statistiques vides
    if (filter._id === null) {
      return res.json({
        total: 0,
        enAttente: 0,
        payees: 0,
        annulees: 0,
        totalMontant: 0,
        parType: []
      });
    }
    
    const total = await Facture.countDocuments(filter);
    const enAttente = await Facture.countDocuments({ ...filter, statut: 'En attente' });
    const payees = await Facture.countDocuments({ ...filter, statut: 'Payée' });
    const annulees = await Facture.countDocuments({ ...filter, statut: 'Annulée' });
    
    const totalMontant = await Facture.aggregate([
      { $match: filter },
      { $group: { _id: null, total: { $sum: '$montantTTC' } } }
    ]);
    
    // Statistiques par type de facture
    const parType = await Facture.aggregate([
      { $match: filter },
      { $group: { _id: '$typeFacture', count: { $sum: 1 }, montant: { $sum: '$montantTTC' } } },
      { $lookup: { from: 'typefactures', localField: '_id', foreignField: '_id', as: 'typeInfo' } }
    ]);
    
    res.json({
      total,
      enAttente,
      payees,
      annulees,
      totalMontant: totalMontant[0]?.total || 0,
      parType
    });
  } catch (err) {
    console.error('Erreur getFacturesStats:', err);
    res.status(500).json({ message: err.message });
  }
};

// Créer une facture
exports.createFacture = async (req, res) => {
  try {
    const { typeFacture, contrat, commande, livraison, montantHT, dateEcheance } = req.body;
    
    // Seul Admin et Commercial peuvent créer
    if (!['Admin', 'Commercial'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Accès non autorisé pour créer une facture' });
    }
    
    // Vérifier les champs obligatoires
    if (!typeFacture || !montantHT || !dateEcheance) {
      return res.status(400).json({ message: 'Champs obligatoires manquants' });
    }
    
    // Récupérer le type de facture
    const typeFactureData = await TypeFacture.findById(typeFacture);
    if (!typeFactureData) {
      return res.status(404).json({ message: 'Type de facture non trouvé' });
    }
    
    // Récupérer la devise depuis le type de facture
    const devise = typeFactureData.devise;
    
    // Calculer TVA (19% pour TND, 0% pour USD)
    const tauxTVA = devise === 'TND' ? 0.19 : 0;
    const montantTVA = montantHT * tauxTVA;
    const montantTTC = montantHT + montantTVA;
    
    // Générer numéro de facture
    const count = await Facture.countDocuments();
    let prefix = 'FACT';
    if (typeFactureData.nom === 'Export USD') prefix = 'EXP';
    if (typeFactureData.nom === 'Proforma') prefix = 'PRO';
    if (typeFactureData.nom === 'Avoir') prefix = 'AVR';
    
    const numeroFacture = `${prefix}-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
    
    const factureData = {
      numeroFacture,
      typeFacture,
      contrat: contrat || null,
      commande: commande || null,
      livraison: livraison || null,
      montantHT,
      montantTVA,
      montantTTC,
      devise,
      dateEcheance,
      statut: 'En attente',
      dateEmission: new Date(),
      dateCreation: new Date(),
      dateModification: new Date()
    };
    
    const facture = await Facture.create(factureData);
    
    // Historique
    if (addHistorique) {
      await addHistorique({
        entityType: "Facture",
        entityId: facture._id,
        action: "Création",
        details: `Facture #${numeroFacture} créée (Type: ${typeFactureData.nom}, Montant: ${montantTTC.toLocaleString()} ${devise})`,
        utilisateur: req.user._id,
        ipAddress: req.ip
      });
    }
    
    // Générer PDF
    try {
      if (pdfGenerator && pdfGenerator.generateFacturePDF) {
        const pdfPath = await pdfGenerator.generateFacturePDF(facture);
        facture.pdfPath = pdfPath;
        await facture.save();
        
        if (Document) {
          await Document.create({
            type: 'Facture',
            referenceId: facture._id,
            filePath: pdfPath,
            generePar: req.user._id,
            dateGeneration: new Date()
          });
        }
      }
    } catch (pdfError) {
      console.error('Erreur génération PDF:', pdfError);
    }
    
    const populated = await Facture.findById(facture._id)
      .populate('typeFacture', 'nom devise')
      .populate('contrat', 'numeroContrat')
      .populate('commande', 'numeroCommande')
      .populate('livraison', 'numeroLivraison');
    
    res.status(201).json(populated);
  } catch (err) {
    console.error('Erreur createFacture:', err);
    res.status(400).json({ message: err.message });
  }
};

// Mettre à jour le statut
exports.updateStatut = async (req, res) => {
  try {
    const { statut } = req.body;
    
    // Vérifier les droits
    if (!['Admin', 'Commercial'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Accès non autorisé pour modifier le statut' });
    }
    
    const statutsValides = ['En attente', 'Payée', 'Annulée'];
    if (!statutsValides.includes(statut)) {
      return res.status(400).json({ message: 'Statut invalide' });
    }
    
    const ancienneFacture = await Facture.findById(req.params.id);
    if (!ancienneFacture) {
      return res.status(404).json({ message: 'Facture non trouvée' });
    }
    
    if (ancienneFacture.statut === 'Payée' && statut !== 'Payée') {
      return res.status(400).json({ message: 'Une facture payée ne peut pas changer de statut' });
    }
    
    const facture = await Facture.findByIdAndUpdate(
      req.params.id,
      { statut, dateModification: Date.now() },
      { new: true }
    );
    
    if (addHistorique) {
      await addHistorique({
        entityType: "Facture",
        entityId: facture._id,
        action: "Changement statut",
        details: `Statut changé de ${ancienneFacture.statut} à ${statut} pour la facture #${facture.numeroFacture}`,
        utilisateur: req.user._id,
        ipAddress: req.ip
      });
    }
    
    res.json(facture);
  } catch (err) {
    console.error('Erreur updateStatut:', err);
    res.status(400).json({ message: err.message });
  }
};

// Supprimer une facture (Admin seulement)
exports.deleteFacture = async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Seul l\'administrateur peut supprimer des factures' });
    }
    
    const facture = await Facture.findById(req.params.id);
    if (!facture) {
      return res.status(404).json({ message: 'Facture non trouvée' });
    }
    
    if (facture.statut === 'Payée') {
      return res.status(400).json({ message: 'Impossible de supprimer une facture déjà payée' });
    }
    
    if (addHistorique) {
      await addHistorique({
        entityType: "Facture",
        entityId: facture._id,
        action: "Suppression",
        details: `Facture #${facture.numeroFacture} supprimée`,
        utilisateur: req.user._id,
        ipAddress: req.ip
      });
    }
    
    await Facture.findByIdAndDelete(req.params.id);
    
    if (Document) {
      await Document.deleteMany({ referenceId: facture._id });
    }
    
    res.json({ message: 'Facture supprimée avec succès' });
  } catch (err) {
    console.error('Erreur deleteFacture:', err);
    res.status(500).json({ message: err.message });
  }
};

// Exporter PDF
exports.exportFacturePDF = async (req, res) => {
  try {
    const facture = await Facture.findById(req.params.id)
      .populate({
        path: 'contrat',
        populate: { 
          path: 'tiers', 
          select: 'raisonSociale user type nom prenom email adresse telephone'
        }
      })
      .populate('typeFacture', 'nom devise')
      .populate('commande', 'numeroCommande')
      .populate('livraison', 'numeroLivraison');
    
    if (!facture) {
      return res.status(404).json({ message: 'Facture non trouvée' });
    }
    
    // Vérifier les droits d'accès
    const hasAccess = await canAccessFacture(req.user, facture);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }
    
    if (addHistorique) {
      await addHistorique({
        entityType: "Facture",
        entityId: facture._id,
        action: "Export PDF",
        details: `Export PDF de la facture #${facture.numeroFacture}`,
        utilisateur: req.user._id,
        ipAddress: req.ip
      });
    }
    
    // Générer PDF avec pdfkit
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks = [];
    
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=facture_${facture.numeroFacture}.pdf`);
      res.send(pdfBuffer);
    });
    
    // En-tête avec logo (optionnel)
    try {
      // Ajouter un logo si disponible
      // doc.image('path/to/logo.png', 50, 45, { width: 100 });
    } catch (e) {
      // Ignorer si logo n'existe pas
    }
    
    // Titre
    doc.fontSize(24)
      .font('Helvetica-Bold')
      .fillColor('#333333')
      .text('FACTURE', { align: 'center' })
      .moveDown(0.5);
    
    // Numéro et dates
    doc.fontSize(10)
      .font('Helvetica')
      .fillColor('#666666')
      .text(`N° Facture: ${facture.numeroFacture}`, { align: 'center' })
      .text(`Date d'émission: ${new Date(facture.dateEmission).toLocaleDateString('fr-FR')}`, { align: 'center' })
      .text(`Date d'échéance: ${new Date(facture.dateEcheance).toLocaleDateString('fr-FR')}`, { align: 'center' })
      .moveDown();
    
    // Ligne de séparation
    doc.strokeColor('#CCCCCC')
      .lineWidth(1)
      .moveTo(50, doc.y)
      .lineTo(550, doc.y)
      .stroke()
      .moveDown(0.5);
    
    // Informations client/fournisseur
    if (facture.contrat && facture.contrat.tiers) {
      doc.fontSize(12)
        .font('Helvetica-Bold')
        .fillColor('#333333')
        .text('Informations client', { underline: true })
        .moveDown(0.3);
      
      doc.fontSize(10)
        .font('Helvetica')
        .fillColor('#666666')
        .text(`Raison Sociale: ${facture.contrat.tiers.raisonSociale || '-'}`)
        .text(`Nom: ${facture.contrat.tiers.nom || '-'}`)
        .text(`Email: ${facture.contrat.tiers.email || '-'}`)
        .text(`Téléphone: ${facture.contrat.tiers.telephone || '-'}`);
      
      if (facture.contrat.tiers.adresse) {
        doc.text(`Adresse: ${facture.contrat.tiers.adresse}`);
      }
      doc.moveDown();
    }
    
    // Ligne de séparation
    doc.strokeColor('#CCCCCC')
      .lineWidth(1)
      .moveTo(50, doc.y)
      .lineTo(550, doc.y)
      .stroke()
      .moveDown(0.5);
    
    // Informations de la facture
    doc.fontSize(12)
      .font('Helvetica-Bold')
      .fillColor('#333333')
      .text('Informations facture', { underline: true })
      .moveDown(0.3);
    
    doc.fontSize(10)
      .font('Helvetica')
      .fillColor('#666666')
      .text(`Type de facture: ${facture.typeFacture?.nom || '-'}`)
      .text(`Contrat: ${facture.contrat?.numeroContrat || '-'}`)
      .text(`Commande: ${facture.commande?.numeroCommande || '-'}`)
      .text(`Livraison: ${facture.livraison?.numeroLivraison || '-'}`)
      .text(`Statut: ${facture.statut}`)
      .moveDown();
    
    // Ligne de séparation
    doc.strokeColor('#CCCCCC')
      .lineWidth(1)
      .moveTo(50, doc.y)
      .lineTo(550, doc.y)
      .stroke()
      .moveDown(0.5);
    
    // Détails financiers
    doc.fontSize(12)
      .font('Helvetica-Bold')
      .fillColor('#333333')
      .text('Détails financiers', { underline: true })
      .moveDown(0.3);
    
    doc.fontSize(10)
      .font('Helvetica')
      .fillColor('#666666')
      .text(`Montant HT: ${facture.montantHT.toLocaleString()} ${facture.devise}`)
      .text(`TVA (${facture.devise === 'TND' ? '19%' : '0%'}): ${facture.montantTVA.toLocaleString()} ${facture.devise}`)
      .moveDown();
    
    // Total
    doc.fontSize(16)
      .font('Helvetica-Bold')
      .fillColor('#333333')
      .text(`Montant TTC: ${facture.montantTTC.toLocaleString()} ${facture.devise}`, { align: 'center' })
      .moveDown();
    
    // Pied de page
    const pageHeight = doc.page.height - 50;
    doc.fontSize(8)
      .font('Helvetica')
      .fillColor('#999999')
      .text('Document généré automatiquement', 50, pageHeight, { align: 'center' });
    
    doc.end();
    
  } catch (error) {
    console.error('Erreur export PDF:', error);
    res.status(500).json({ message: error.message });
  }
};