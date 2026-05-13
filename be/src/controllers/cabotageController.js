const Cabotage = require('../models/Cabotage');
const Tiers = require('../models/Tiers');
const Product = require('../models/Product');
const User = require('../models/User');

// ==================== LISTER LES CABOTAGES ====================
exports.getCabotages = async (req, res) => {
  try {
    let query = {};
    const userRole = req.user.role;
    
    if (userRole === 'Client') {
      const tiers = await Tiers.findOne({ user: req.user._id, type: 0 });
      if (tiers) query.client = tiers._id;
    }
    
    const cabotages = await Cabotage.find(query)
      .populate('client', 'raisonSociale nom prenom email telephone adresse')
      .populate('produit', 'nom code prixUnitaire uniteMesure')
      .populate('transporteur', 'nom prenom email telephone')
      .populate('factureId', 'numeroFacture montantTotal')
      .populate('createdBy', 'nom prenom email')
      .sort({ dateCreation: -1 });
    
    res.json(cabotages);
  } catch (err) {
    console.error('Erreur getCabotages:', err);
    res.status(500).json({ message: err.message });
  }
};

// ==================== CRÉER UN CABOTAGE ====================
exports.createCabotage = async (req, res) => {
  try {
    if (req.user.role !== 'Commercial' && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }
    
    const { client, produit, quantite, prixUnitaire, devise, typeOperation, pointDepart, pointArrivee, transporteur, dateLivraisonPrevue, commentaire } = req.body;
    
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
    
    // Générer le numéro de cabotage
    const count = await Cabotage.countDocuments();
    const numeroCabotage = `CAB-${(count + 1).toString().padStart(4, '0')}`;
    
    const cabotage = await Cabotage.create({
      numeroCabotage,
      client,
      produit,
      quantite,
      prixUnitaire,
      devise: devise || 'TND',
      typeOperation: typeOperation || 'Vente',
      pointDepart,
      pointArrivee,
      transporteur,
      dateLivraisonPrevue,
      commentaire,
      createdBy: req.user._id,
      statut: 'En attente'
    });
    
    const populatedCabotage = await Cabotage.findById(cabotage._id)
      .populate('client', 'raisonSociale nom prenom')
      .populate('produit', 'nom code uniteMesure')
      .populate('transporteur', 'nom prenom')
      .populate('createdBy', 'nom prenom');
    
    res.status(201).json(populatedCabotage);
  } catch (err) {
    console.error('Erreur createCabotage:', err);
    res.status(400).json({ message: err.message });
  }
};

// ==================== METTRE À JOUR LE STATUT ====================
exports.updateStatut = async (req, res) => {
  try {
    const { statut, dateLivraisonReelle, numeroBonLivraison, numeroBonPesee } = req.body;
    
    const cabotage = await Cabotage.findById(req.params.id);
    if (!cabotage) {
      return res.status(404).json({ message: 'Cabotage non trouvé' });
    }
    
    cabotage.statut = statut;
    cabotage.dateModification = Date.now();
    
    if (dateLivraisonReelle) {
      cabotage.dateLivraisonReelle = dateLivraisonReelle;
    }
    
    if (numeroBonLivraison) {
      cabotage.numeroBonLivraison = numeroBonLivraison;
    }
    
    if (numeroBonPesee) {
      cabotage.numeroBonPesee = numeroBonPesee;
    }
    
    if (statut === 'Livrée' && !cabotage.dateLivraisonReelle) {
      cabotage.dateLivraisonReelle = Date.now();
    }
    
    await cabotage.save();
    
    const populatedCabotage = await Cabotage.findById(cabotage._id)
      .populate('client', 'raisonSociale nom prenom')
      .populate('produit', 'nom code uniteMesure')
      .populate('transporteur', 'nom prenom');
    
    res.json(populatedCabotage);
  } catch (err) {
    console.error('Erreur updateStatut:', err);
    res.status(400).json({ message: err.message });
  }
};

// ==================== MODIFIER UN CABOTAGE ====================
exports.updateCabotage = async (req, res) => {
  try {
    if (req.user.role !== 'Commercial' && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }
    
    const cabotage = await Cabotage.findById(req.params.id);
    if (!cabotage) {
      return res.status(404).json({ message: 'Cabotage non trouvé' });
    }
    
    if (cabotage.statut === 'Facturée' || cabotage.statut === 'Livrée') {
      return res.status(400).json({ message: 'Impossible de modifier un cabotage déjà facturé ou livré' });
    }
    
    const { quantite, prixUnitaire, pointDepart, pointArrivee, transporteur, dateLivraisonPrevue, commentaire } = req.body;
    
    if (quantite) cabotage.quantite = quantite;
    if (prixUnitaire) cabotage.prixUnitaire = prixUnitaire;
    if (pointDepart) cabotage.pointDepart = pointDepart;
    if (pointArrivee) cabotage.pointArrivee = pointArrivee;
    if (transporteur) cabotage.transporteur = transporteur;
    if (dateLivraisonPrevue) cabotage.dateLivraisonPrevue = dateLivraisonPrevue;
    if (commentaire) cabotage.commentaire = commentaire;
    cabotage.dateModification = Date.now();
    
    await cabotage.save();
    
    const populatedCabotage = await Cabotage.findById(cabotage._id)
      .populate('client', 'raisonSociale nom prenom')
      .populate('produit', 'nom code uniteMesure')
      .populate('transporteur', 'nom prenom');
    
    res.json(populatedCabotage);
  } catch (err) {
    console.error('Erreur updateCabotage:', err);
    res.status(400).json({ message: err.message });
  }
};

// ==================== SUPPRIMER UN CABOTAGE ====================
exports.deleteCabotage = async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Seul l\'administrateur peut supprimer des cabotages' });
    }
    
    const cabotage = await Cabotage.findById(req.params.id);
    if (!cabotage) {
      return res.status(404).json({ message: 'Cabotage non trouvé' });
    }
    
    if (cabotage.statut === 'Facturée' || cabotage.statut === 'Livrée') {
      return res.status(400).json({ message: 'Impossible de supprimer un cabotage déjà facturé ou livré' });
    }
    
    await Cabotage.findByIdAndDelete(req.params.id);
    res.json({ message: 'Cabotage supprimé avec succès' });
  } catch (err) {
    console.error('Erreur deleteCabotage:', err);
    res.status(500).json({ message: err.message });
  }
};

// ==================== EXPORT EXCEL ====================
exports.exportExcel = async (req, res) => {
  try {
    const cabotages = await Cabotage.find()
      .populate('client', 'raisonSociale nom prenom')
      .populate('produit', 'nom code')
      .populate('transporteur', 'nom prenom')
      .sort({ dateCreation: -1 });
    
    const XLSX = require('xlsx');
    
    const data = cabotages.map(c => ({
      'Numéro': c.numeroCabotage,
      'Client': c.client?.raisonSociale || `${c.client?.nom || ''} ${c.client?.prenom || ''}`,
      'Produit': c.produit?.nom,
      'Quantité (Barils)': c.quantite,
      'Prix Unitaire': c.prixUnitaire,
      'Montant Total': c.montantTotal,
      'Devise': c.devise,
      'Type Opération': c.typeOperation,
      'Point Départ': c.pointDepart || '-',
      'Point Arrivée': c.pointArrivee || '-',
      'Transporteur': c.transporteur?.nom || '-',
      'Statut': c.statut,
      'Date Opération': new Date(c.dateOperation).toLocaleDateString('fr-FR'),
      'Date Livraison Prévue': c.dateLivraisonPrevue ? new Date(c.dateLivraisonPrevue).toLocaleDateString('fr-FR') : '-',
      'Date Livraison Réelle': c.dateLivraisonReelle ? new Date(c.dateLivraisonReelle).toLocaleDateString('fr-FR') : '-'
    }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Cabotage');
    
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=cabotage.xlsx');
    res.send(buffer);
  } catch (err) {
    console.error('Erreur exportExcel:', err);
    res.status(500).json({ message: err.message });
  }
};

// ==================== EXPORT PDF ====================
exports.exportPDF = async (req, res) => {
  try {
    const cabotages = await Cabotage.find()
      .populate('client', 'raisonSociale nom prenom adresse')
      .populate('produit', 'nom code')
      .populate('transporteur', 'nom prenom')
      .sort({ dateCreation: -1 });
    
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks = [];
    
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=cabotage.pdf');
      res.send(pdfBuffer);
    });
    
    // En-tête
    doc.rect(0, 0, 612, 80).fill('#1a2c3e');
    doc.fillColor('#ffffff')
      .fontSize(20)
      .font('Helvetica-Bold')
      .text('CABOTAGE - PÉTROLE BRUT', 50, 25);
    
    doc.fontSize(10)
      .fillColor('#94a3b8')
      .text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, 400, 30);
    doc.text(`Total: ${cabotages.length} opérations`, 400, 45);
    doc.text(`Client: STIR`, 400, 60);
    
    doc.moveDown(2);
    doc.fillColor('#1a2c3e');
    
    // Tableau
    let y = doc.y;
    doc.fontSize(8).font('Helvetica-Bold');
    doc.text('N°', 40, y);
    doc.text('Client', 85, y);
    doc.text('Produit', 170, y);
    doc.text('Quantité', 260, y);
    doc.text('Montant', 330, y);
    doc.text('Statut', 400, y);
    doc.text('Date', 470, y);
    
    y += 18;
    doc.font('Helvetica');
    
    cabotages.forEach((cabotage, index) => {
      if (y > 750) {
        doc.addPage();
        y = 50;
      }
      
      if (index % 2 === 0) {
        doc.rect(35, y - 4, 540, 18).fill('#f8fafc');
      }
      
      doc.fillColor('#1a2c3e');
      doc.text(cabotage.numeroCabotage, 40, y);
      doc.text((cabotage.client?.raisonSociale || cabotage.client?.nom || '-').substring(0, 15), 85, y);
      doc.text(cabotage.produit?.nom?.substring(0, 15) || '-', 170, y);
      doc.text(`${cabotage.quantite} bl`, 260, y);
      doc.text(`${cabotage.montantTotal?.toLocaleString()} ${cabotage.devise}`, 330, y);
      doc.text(cabotage.statut, 400, y);
      doc.text(new Date(cabotage.dateOperation).toLocaleDateString(), 470, y);
      y += 18;
    });
    
    // Total général
    const totalGeneral = cabotages.reduce((sum, c) => sum + (c.montantTotal || 0), 0);
    y += 18;
    doc.font('Helvetica-Bold').fontSize(10);
    doc.text(`Total général: ${totalGeneral.toLocaleString()} TND`, 380, y);
    
    doc.end();
  } catch (err) {
    console.error('Erreur exportPDF:', err);
    res.status(500).json({ message: err.message });
  }
};

// ==================== RÉCUPÉRER LES TRANSPORTEURS ====================
exports.getTransporteurs = async (req, res) => {
  try {
    const transporteurs = await User.find({ role: 'Transporteur' })
      .select('nom prenom email telephone');
    res.json(transporteurs);
  } catch (err) {
    console.error('Erreur getTransporteurs:', err);
    res.status(500).json({ message: err.message });
  }
};