// controllers/contratController.js
const Contrat = require('../models/Contrat');

// ==================== LISTE ====================
exports.getContrats = async (req, res) => {
  try {
    let contrats;
    const userRole = req.user.role;
    const userId = req.user._id;

    if (userRole === 'Admin' || userRole === 'Commercial') {
      contrats = await Contrat.find()
        .populate('tiers', 'raisonSociale type')
        .populate('produits.sousProduit', 'nom prixUnitaire uniteMesure')
        .sort({ dateCreation: -1 });
    } else if (userRole === 'Client') {
      contrats = await Contrat.find({
        type: 'Vente',
        tiers: userId
      })
        .populate('tiers', 'raisonSociale type')
        .populate('produits.sousProduit', 'nom prixUnitaire uniteMesure')
        .sort({ dateCreation: -1 });
    } else if (userRole === 'Fournisseur') {
      contrats = await Contrat.find({
        type: 'Achat',
        tiers: userId
      })
        .populate('tiers', 'raisonSociale type')
        .populate('produits.sousProduit', 'nom prixUnitaire uniteMesure')
        .sort({ dateCreation: -1 });
    } else {
      contrats = [];
    }

    res.json(contrats);
  } catch (err) {
    console.error('Erreur getContrats:', err);
    res.status(500).json({ message: err.message });
  }
};

// ==================== CRÉER ====================
exports.createContrat = async (req, res) => {
  try {
    // (authorizeRoles('Commercial') a déjà filtré, ce if est optionnel)
    if (req.user.role !== 'Commercial') {
      return res.status(403).json({
        message: `Accès refusé. Seuls les commerciaux peuvent créer des contrats. Votre rôle: ${req.user.role}`
      });
    }

    const contratData = {
      ...req.body,
      createdBy: req.user._id
    };

    const contrat = await Contrat.create(contratData);
    const populatedContrat = await Contrat.findById(contrat._id)
      .populate('tiers', 'raisonSociale type')
      .populate('produits.sousProduit', 'nom prixUnitaire uniteMesure');

    res.status(201).json(populatedContrat);
  } catch (err) {
    console.error('Erreur createContrat:', err);
    res.status(400).json({ message: err.message });
  }
};

// ==================== MODIFIER ====================
exports.updateContrat = async (req, res) => {
  try {
    if (req.user.role !== 'Commercial') {
      return res.status(403).json({
        message: `Accès refusé. Seuls les commerciaux peuvent modifier les contrats. Votre rôle: ${req.user.role}`
      });
    }

    const contrat = await Contrat.findById(req.params.id);
    if (!contrat) {
      return res.status(404).json({ message: 'Contrat non trouvé' });
    }

    if (contrat.statut === 'Validé') {
      return res.status(400).json({ message: 'Impossible de modifier un contrat déjà validé' });
    }

    const updatedData = {
      ...req.body,
      updatedAt: Date.now()
    };

    const updatedContrat = await Contrat.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true, runValidators: true }
    )
      .populate('tiers', 'raisonSociale type')
      .populate('produits.sousProduit', 'nom prixUnitaire uniteMesure');

    res.json(updatedContrat);
  } catch (err) {
    console.error('Erreur updateContrat:', err);
    res.status(400).json({ message: err.message });
  }
};

// ==================== SUPPRIMER ====================
exports.deleteContrat = async (req, res) => {
  try {
    if (req.user.role !== 'Commercial') {
      return res.status(403).json({
        message: `Accès refusé. Seuls les commerciaux peuvent supprimer les contrats. Votre rôle: ${req.user.role}`
      });
    }

    const contrat = await Contrat.findById(req.params.id);
    if (!contrat) {
      return res.status(404).json({ message: 'Contrat non trouvé' });
    }

    if (contrat.statut === 'Validé') {
      return res.status(400).json({ message: 'Impossible de supprimer un contrat déjà validé' });
    }

    await Contrat.findByIdAndDelete(req.params.id);
    res.json({ message: 'Contrat supprimé avec succès' });
  } catch (err) {
    console.error('Erreur deleteContrat:', err);
    res.status(400).json({ message: err.message });
  }
};

// ==================== VALIDER CONTRAT ====================
exports.validerContrat = async (req, res) => {
  try {
    if (req.user.role !== 'Commercial') {
      return res.status(403).json({
        message: `Accès refusé. Seuls les commerciaux peuvent valider les contrats. Votre rôle: ${req.user.role}`
      });
    }

    const contrat = await Contrat.findById(req.params.id);
    if (!contrat) {
      return res.status(404).json({ message: 'Contrat non trouvé' });
    }

    if (contrat.statut === 'Validé') {
      return res.status(400).json({ message: 'Ce contrat est déjà validé' });
    }

    contrat.statut = 'Validé';
    contrat.dateValidation = Date.now();
    await contrat.save();

    const populatedContrat = await Contrat.findById(contrat._id)
      .populate('tiers', 'raisonSociale type')
      .populate('produits.sousProduit', 'nom prixUnitaire uniteMesure');

    res.json({
      message: 'Contrat validé avec succès',
      contrat: populatedContrat
    });
  } catch (err) {
    console.error('Erreur validerContrat:', err);
    res.status(500).json({ message: err.message });
  }
};

// ==================== EXPORT PDF ====================
exports.exportContratPDF = async (req, res) => {
  try {
    const contrat = await Contrat.findById(req.params.id)
      .populate('tiers', 'raisonSociale type email telephone adresse')
      .populate('produits.sousProduit', 'nom prixUnitaire uniteMesure');

    if (!contrat) {
      return res.status(404).json({ message: 'Contrat non trouvé' });
    }

    const userRole = req.user.role;
    const userId = req.user._id.toString();
    const tiersId = contrat.tiers?._id?.toString() || contrat.tiers?.toString();

    let hasAccess = false;

    if (userRole === 'Admin' || userRole === 'Commercial') {
      hasAccess = true;
    } else if (userRole === 'Client' && contrat.type === 'Vente' && tiersId === userId) {
      hasAccess = true;
    } else if (userRole === 'Fournisseur' && contrat.type === 'Achat' && tiersId === userId) {
      hasAccess = true;
    }

    if (!hasAccess) {
      return res.status(403).json({ message: 'Accès non autorisé à ce contrat' });
    }

    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument();
    const chunks = [];

    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=contrat_${contrat.numeroContrat}.pdf`);
      res.send(pdfBuffer);
    });

    doc.fontSize(20).text('CONTRAT', { align: 'center' }).moveDown();
    doc.fontSize(14).text(`N°: ${contrat.numeroContrat}`).moveDown();
    doc.text(`Type: ${contrat.type}`);
    doc.text(`Statut: ${contrat.statut}`);
    doc.text(`Date: ${new Date(contrat.dateCreation).toLocaleDateString()}`);
    doc.text(`Tiers: ${contrat.tiers?.raisonSociale || '-'}`);
    doc.text(`Montant total: ${contrat.montantTotal?.toLocaleString()} ${contrat.devise}`);
    doc.moveDown();

    doc.text('Produits:');
    contrat.produits?.forEach(p => {
      doc.text(`- ${p.sousProduit?.nom}: ${p.quantite} x ${p.prixUnitaire} = ${p.quantite * p.prixUnitaire}`);
    });

    doc.end();
  } catch (error) {
    console.error('Erreur export PDF:', error);
    res.status(500).json({ message: error.message });
  }
};

// ==================== EXPORT TOUS LES CONTRATS PDF ====================
exports.exportAllContratsPDF = async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({
        message: 'Accès refusé. Seul l\'administrateur peut exporter tous les contrats.'
      });
    }

    const contrats = await Contrat.find()
      .populate('tiers', 'raisonSociale type')
      .populate('produits.sousProduit', 'nom prixUnitaire uniteMesure')
      .sort({ dateCreation: -1 });

    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument();
    const chunks = [];

    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=tous_les_contrats.pdf');
      res.send(pdfBuffer);
    });

    doc.fontSize(20).text('RAPPORT DES CONTRATS', { align: 'center' }).moveDown();
    doc.text(`Nombre total: ${contrats.length}`);
    doc.text(`Généré le: ${new Date().toLocaleDateString()}`).moveDown();

    for (const contrat of contrats) {
      doc.addPage();
      doc.fontSize(14).text(`Contrat: ${contrat.numeroContrat}`);
      doc.text(`Type: ${contrat.type}`);
      doc.text(`Statut: ${contrat.statut}`);
      doc.text(`Tiers: ${contrat.tiers?.raisonSociale}`);
      doc.text(`Montant: ${contrat.montantTotal} ${contrat.devise}`);
      doc.moveDown();
    }

    doc.end();
  } catch (error) {
    console.error('Erreur export tous contrats:', error);
    res.status(500).json({ message: error.message });
  }
};