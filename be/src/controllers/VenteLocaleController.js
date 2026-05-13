const VenteLocale = require('../models/VenteLocale');
const Tiers = require('../models/Tiers');
const Product = require('../models/Product');
const Facture = require('../models/Facture');

// ==================== LISTER LES VENTES LOCALES ====================
exports.getVentesLocales = async (req, res) => {
  try {
    let query = {};
    const userRole = req.user.role;
    
    if (userRole === 'Client') {
      const tiers = await Tiers.findOne({ user: req.user._id, type: 0 });
      if (tiers) query.client = tiers._id;
    }
    
    const ventes = await VenteLocale.find(query)
      .populate('client', 'raisonSociale nom prenom email telephone adresse')
      .populate('produit', 'nom code prixUnitaire uniteMesure')
      .populate('factureId', 'numeroFacture montantTotal')
      .populate('createdBy', 'nom prenom email')
      .sort({ dateCreation: -1 });
    
    res.json(ventes);
  } catch (err) {
    console.error('Erreur getVentesLocales:', err);
    res.status(500).json({ message: err.message });
  }
};

// ==================== CRÉER UNE VENTE LOCALE ====================
exports.createVenteLocale = async (req, res) => {
  try {
    if (req.user.role !== 'Commercial' && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }
    
    const { client, produit, quantite, prixUnitaire, devise, dateLivraisonPrevue, commentaire } = req.body;
    
    // Vérifier que le client existe
    const clientExists = await Tiers.findById(client);
    if (!clientExists) {
      return res.status(404).json({ message: 'Client non trouvé' });
    }
    
    // Vérifier que le produit existe
    const produitExists = await Product.findById(produit);
    if (!produitExists) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }
    
    // Générer le numéro de vente
    const count = await VenteLocale.countDocuments();
    const numeroVente = `VL-${(count + 1).toString().padStart(4, '0')}`;
    
    const vente = await VenteLocale.create({
      numeroVente,
      client,
      produit,
      quantite,
      prixUnitaire,
      devise: devise || 'TND',
      dateLivraisonPrevue,
      commentaire,
      createdBy: req.user._id,
      statut: 'En attente'
    });
    
    const populatedVente = await VenteLocale.findById(vente._id)
      .populate('client', 'raisonSociale nom prenom')
      .populate('produit', 'nom code uniteMesure')
      .populate('createdBy', 'nom prenom');
    
    res.status(201).json(populatedVente);
  } catch (err) {
    console.error('Erreur createVenteLocale:', err);
    res.status(400).json({ message: err.message });
  }
};

// ==================== METTRE À JOUR LE STATUT ====================
exports.updateStatut = async (req, res) => {
  try {
    const { statut, dateLivraisonReelle } = req.body;
    
    const vente = await VenteLocale.findById(req.params.id);
    if (!vente) {
      return res.status(404).json({ message: 'Vente non trouvée' });
    }
    
    vente.statut = statut;
    vente.dateModification = Date.now();
    
    if (dateLivraisonReelle) {
      vente.dateLivraisonReelle = dateLivraisonReelle;
    }
    
    if (statut === 'Livrée' && !vente.dateLivraisonReelle) {
      vente.dateLivraisonReelle = Date.now();
    }
    
    await vente.save();
    
    const populatedVente = await VenteLocale.findById(vente._id)
      .populate('client', 'raisonSociale nom prenom')
      .populate('produit', 'nom code uniteMesure');
    
    res.json(populatedVente);
  } catch (err) {
    console.error('Erreur updateStatut:', err);
    res.status(400).json({ message: err.message });
  }
};

// ==================== MODIFIER UNE VENTE ====================
exports.updateVenteLocale = async (req, res) => {
  try {
    if (req.user.role !== 'Commercial' && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }
    
    const vente = await VenteLocale.findById(req.params.id);
    if (!vente) {
      return res.status(404).json({ message: 'Vente non trouvée' });
    }
    
    if (vente.statut === 'Facturée' || vente.statut === 'Livrée') {
      return res.status(400).json({ message: 'Impossible de modifier une vente déjà facturée ou livrée' });
    }
    
    const { quantite, prixUnitaire, dateLivraisonPrevue, commentaire } = req.body;
    
    if (quantite) vente.quantite = quantite;
    if (prixUnitaire) vente.prixUnitaire = prixUnitaire;
    if (dateLivraisonPrevue) vente.dateLivraisonPrevue = dateLivraisonPrevue;
    if (commentaire) vente.commentaire = commentaire;
    vente.dateModification = Date.now();
    
    await vente.save();
    
    const populatedVente = await VenteLocale.findById(vente._id)
      .populate('client', 'raisonSociale nom prenom')
      .populate('produit', 'nom code uniteMesure');
    
    res.json(populatedVente);
  } catch (err) {
    console.error('Erreur updateVenteLocale:', err);
    res.status(400).json({ message: err.message });
  }
};

// ==================== SUPPRIMER UNE VENTE ====================
exports.deleteVenteLocale = async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Seul l\'administrateur peut supprimer des ventes' });
    }
    
    const vente = await VenteLocale.findById(req.params.id);
    if (!vente) {
      return res.status(404).json({ message: 'Vente non trouvée' });
    }
    
    if (vente.statut === 'Facturée') {
      return res.status(400).json({ message: 'Impossible de supprimer une vente déjà facturée' });
    }
    
    await VenteLocale.findByIdAndDelete(req.params.id);
    res.json({ message: 'Vente supprimée avec succès' });
  } catch (err) {
    console.error('Erreur deleteVenteLocale:', err);
    res.status(500).json({ message: err.message });
  }
};

// ==================== EXPORT EXCEL ====================
exports.exportExcel = async (req, res) => {
  try {
    const ventes = await VenteLocale.find()
      .populate('client', 'raisonSociale nom prenom')
      .populate('produit', 'nom code')
      .sort({ dateCreation: -1 });
    
    const XLSX = require('xlsx');
    
    const data = ventes.map(v => ({
      'Numéro': v.numeroVente,
      'Client': v.client?.raisonSociale || `${v.client?.nom || ''} ${v.client?.prenom || ''}`,
      'Produit': v.produit?.nom,
      'Quantité': v.quantite,
      'Unité': v.produit?.uniteMesure || 'm³',
      'Prix Unitaire': v.prixUnitaire,
      'Montant Total': v.montantTotal,
      'Devise': v.devise,
      'Statut': v.statut,
      'Date Vente': new Date(v.dateVente).toLocaleDateString('fr-FR'),
      'Date Livraison Prévue': v.dateLivraisonPrevue ? new Date(v.dateLivraisonPrevue).toLocaleDateString('fr-FR') : '-',
      'Date Livraison Réelle': v.dateLivraisonReelle ? new Date(v.dateLivraisonReelle).toLocaleDateString('fr-FR') : '-'
    }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ventes Locales');
    
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=ventes_locales.xlsx');
    res.send(buffer);
  } catch (err) {
    console.error('Erreur exportExcel:', err);
    res.status(500).json({ message: err.message });
  }
};

// ==================== EXPORT PDF ====================
exports.exportPDF = async (req, res) => {
  try {
    const ventes = await VenteLocale.find()
      .populate('client', 'raisonSociale nom prenom adresse')
      .populate('produit', 'nom code')
      .sort({ dateCreation: -1 });
    
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks = [];
    
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=ventes_locales.pdf');
      res.send(pdfBuffer);
    });
    
    // En-tête
    doc.rect(0, 0, 612, 80).fill('#1a2c3e');
    doc.fillColor('#ffffff')
      .fontSize(20)
      .font('Helvetica-Bold')
      .text('VENTES LOCALES - GAZ NATUREL', 50, 25);
    
    doc.fontSize(10)
      .fillColor('#94a3b8')
      .text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, 400, 30);
    doc.text(`Total: ${ventes.length} ventes`, 400, 45);
    
    doc.moveDown(2);
    doc.fillColor('#1a2c3e');
    
    // Tableau
    let y = doc.y;
    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('N°', 50, y);
    doc.text('Client', 100, y);
    doc.text('Produit', 220, y);
    doc.text('Quantité', 320, y);
    doc.text('Montant', 380, y);
    doc.text('Statut', 450, y);
    doc.text('Date', 520, y);
    
    y += 20;
    doc.font('Helvetica');
    
    ventes.forEach((vente, index) => {
      if (y > 750) {
        doc.addPage();
        y = 50;
      }
      
      if (index % 2 === 0) {
        doc.rect(45, y - 5, 520, 20).fill('#f8fafc');
      }
      
      doc.fillColor('#1a2c3e');
      doc.text(vente.numeroVente, 50, y);
      doc.text((vente.client?.raisonSociale || vente.client?.nom || '-').substring(0, 25), 100, y);
      doc.text(vente.produit?.nom?.substring(0, 20) || '-', 220, y);
      doc.text(`${vente.quantite} ${vente.produit?.uniteMesure || 'm³'}`, 320, y);
      doc.text(`${vente.montantTotal?.toLocaleString()} ${vente.devise}`, 380, y);
      doc.text(vente.statut, 450, y);
      doc.text(new Date(vente.dateVente).toLocaleDateString(), 520, y);
      y += 20;
    });
    
    // Total général
    const totalGeneral = ventes.reduce((sum, v) => sum + (v.montantTotal || 0), 0);
    y += 20;
    doc.font('Helvetica-Bold').fontSize(11);
    doc.text(`Total général: ${totalGeneral.toLocaleString()} TND`, 350, y);
    
    doc.end();
  } catch (err) {
    console.error('Erreur exportPDF:', err);
    res.status(500).json({ message: err.message });
  }
};