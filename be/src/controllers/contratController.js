const Contrat = require('../models/Contrat');
const Tiers = require('../models/Tiers');

// ==================== LISTE ====================
exports.getContrats = async (req, res) => {
  try {
    let contrats;
    const userRole = req.user.role;
    const userId = req.user._id;

    if (userRole === 'Admin' || userRole === 'Commercial') {
      contrats = await Contrat.find()
        .populate('tiers', 'raisonSociale type email telephone adresse codeTVA')
        .populate('produits.sousProduit', 'nom prixUnitaire uniteMesure')
        .sort({ dateCreation: -1 });
    } else if (userRole === 'Client') {
      const tiers = await Tiers.findOne({ user: userId, type: 0 });
      if (!tiers) {
        contrats = [];
      } else {
        contrats = await Contrat.find({
          type: 'Vente',
          tiers: tiers._id
        })
          .populate('tiers', 'raisonSociale type email telephone adresse codeTVA')
          .populate('produits.sousProduit', 'nom prixUnitaire uniteMesure')
          .sort({ dateCreation: -1 });
      }
    } else if (userRole === 'Fournisseur') {
      const tiers = await Tiers.findOne({ user: userId, type: 1 });
      if (!tiers) {
        contrats = [];
      } else {
        contrats = await Contrat.find({
          type: 'Achat',
          tiers: tiers._id
        })
          .populate('tiers', 'raisonSociale type email telephone adresse codeTVA')
          .populate('produits.sousProduit', 'nom prixUnitaire uniteMesure')
          .sort({ dateCreation: -1 });
      }
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
    if (req.user.role !== 'Commercial') {
      return res.status(403).json({
        message: `Accès refusé. Seuls les commerciaux peuvent créer des contrats.`
      });
    }

    const contratData = {
      ...req.body,
      createdBy: req.user._id
    };

    const contrat = await Contrat.create(contratData);
    const populatedContrat = await Contrat.findById(contrat._id)
      .populate('tiers', 'raisonSociale type email telephone adresse codeTVA')
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
        message: `Accès refusé. Seuls les commerciaux peuvent modifier les contrats.`
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
      dateModification: Date.now()
    };

    const updatedContrat = await Contrat.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true, runValidators: true }
    )
      .populate('tiers', 'raisonSociale type email telephone adresse codeTVA')
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
        message: `Accès refusé. Seuls les commerciaux peuvent supprimer les contrats.`
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
        message: `Accès refusé. Seuls les commerciaux peuvent valider les contrats.`
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
      .populate('tiers', 'raisonSociale type email telephone adresse codeTVA')
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

// ==================== EXPORT PDF UNIQUE ====================
exports.exportContratPDF = async (req, res) => {
  try {
    console.log('📄 Export PDF - ID reçu:', req.params.id);

    // Vérifier si l'ID est valide
    if (!req.params.id || req.params.id.length !== 24) {
      return res.status(400).json({ message: 'ID de contrat invalide' });
    }

    const contrat = await Contrat.findById(req.params.id)
      .populate('tiers', 'raisonSociale type email telephone adresse codeTVA')
      .populate('produits.sousProduit', 'nom prixUnitaire uniteMesure');

    if (!contrat) {
      console.log('❌ Contrat non trouvé');
      return res.status(404).json({ message: 'Contrat non trouvé' });
    }

    console.log('✅ Contrat trouvé:', contrat.numeroContrat);

    // Vérification des droits
    const userRole = req.user.role;
    if (userRole !== 'Admin' && userRole !== 'Commercial') {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }

    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks = [];

    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=contrat_${contrat.numeroContrat}.pdf`);
      res.send(pdfBuffer);
    });

    // Calcul des montants
    const totalHT = contrat.montantTotal || 0;
    const tva = totalHT * 0.19;
    const totalTTC = totalHT + tva;

    const formatDate = (date) => {
      if (!date) return 'Non définie';
      return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
    };

    // ==================== EN-TÊTE ====================
    doc.rect(0, 0, 612, 100).fill('#1a2c3e');
    
    doc.fontSize(24)
      .font('Helvetica-Bold')
      .fillColor('#ffffff')
      .text('ETAP-GAS', 50, 35);
    
    doc.fontSize(10)
      .fillColor('#94a3b8')
      .text('Entreprise Tunisienne de produits pétroliers et gaziers', 50, 65);
    
    doc.fontSize(10)
      .fillColor('#94a3b8')
      .text('Tunis, Tunisie - Tél: +216 XX XXX XXX - Email: contact@etap-gas.com', 50, 80);
    
    doc.fontSize(16)
      .fillColor('#ffffff')
      .text('CONTRAT DE ' + (contrat.type === 'Vente' ? 'VENTE' : 'ACHAT'), 400, 35, { align: 'right' });
    
    doc.fontSize(12)
      .fillColor('#fbbf24')
      .text(`N° ${contrat.numeroContrat}`, 400, 65, { align: 'right' });
    
    doc.moveDown(3);

    // ==================== CADRE STATUT ====================
    const statutColor = contrat.statut === 'Validé' ? '#10b981' : '#f59e0b';
    const statutBg = contrat.statut === 'Validé' ? '#d1fae5' : '#fef3c7';
    
    doc.rect(50, doc.y, 512, 35).fill(statutBg);
    doc.fillColor(statutColor)
      .fontSize(14)
      .font('Helvetica-Bold')
      .text(`${contrat.statut === 'Validé' ? '✓ CONTRAT VALIDÉ' : '⏳ CONTRAT EN COURS'}`, 70, doc.y - 25);
    doc.fillColor('#475569')
      .fontSize(9)
      .font('Helvetica')
      .text(`Date: ${formatDate(contrat.dateCreation)}`, 400, doc.y - 25);
    
    doc.moveDown(2);

    // ==================== PRÉSENTATION ETAP-GAS ====================
    doc.fontSize(14)
      .font('Helvetica-Bold')
      .fillColor('#1a2c3e')
      .text('✧ PRÉSENTATION DE LA SOCIÉTÉ', { underline: true });
    doc.moveDown(0.5);
    
    doc.fontSize(10)
      .font('Helvetica')
      .fillColor('#475569')
      .text(`ETAP-GAS (Entreprise Tunisienne d'Activités Pétrolières - Gaz) est une société 
tunisienne spécialisée dans la commercialisation et la distribution de produits 
pétroliers et gaziers. Forte de son expertise et de son engagement envers la qualité, 
ETAP-GAS s'impose comme un partenaire de confiance pour les professionnels du secteur 
énergétique en Tunisie et à l'international.`, { align: 'justify', indent: 20 });
    
    doc.moveDown(1.5);

    // ==================== PARTIES PRENANTES ====================
    doc.fontSize(14)
      .font('Helvetica-Bold')
      .fillColor('#1a2c3e')
      .text('✧ LES PARTIES PRENANTES', { underline: true });
    doc.moveDown(0.5);
    
    // Cadre pour ETAP-GAS
    doc.rect(50, doc.y, 240, 80).fill('#f0f9ff');
    doc.rect(50, doc.y, 240, 25).fill('#3b82f6');
    doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold').text('LE VENDEUR', 60, doc.y + 8);
    doc.fillColor('#1a2c3e').fontSize(9).font('Helvetica');
    doc.text('ETAP-GAS', 60, doc.y + 35);
    doc.text('Tunis, Tunisie', 60, doc.y + 50);
    doc.text('Tél: +216 XX XXX XXX', 60, doc.y + 65);
    
    // Cadre pour le client/fournisseur
    doc.rect(320, doc.y - 80, 240, 80).fill('#fef3c7');
    doc.rect(320, doc.y - 80, 240, 25).fill('#f59e0b');
    doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold').text(contrat.type === 'Vente' ? "L'ACHETEUR" : "LE FOURNISSEUR", 330, doc.y - 72);
    doc.fillColor('#1a2c3e').fontSize(9).font('Helvetica');
    doc.text(contrat.tiers?.raisonSociale || '___________________', 330, doc.y - 45);
    doc.text(contrat.tiers?.adresse || 'Adresse non spécifiée', 330, doc.y - 30);
    if (contrat.tiers?.codeTVA) doc.text(`TVA: ${contrat.tiers.codeTVA}`, 330, doc.y - 15);
    
    doc.y += 20;
    doc.moveDown();

    // ==================== OBJET ====================
    doc.fontSize(14)
      .font('Helvetica-Bold')
      .fillColor('#1a2c3e')
      .text('✧ OBJET DU CONTRAT', { underline: true });
    doc.moveDown(0.5);
    
    doc.fontSize(10)
      .font('Helvetica')
      .fillColor('#475569')
      .text(`Le présent contrat a pour objet la ${contrat.type === 'Vente' ? 'cession et la livraison' : 'fourniture et l\'approvisionnement'} 
des produits détaillés ci-après, conformément aux spécifications techniques, qualités 
et quantités convenues entre les parties.`, { align: 'justify', indent: 20 });
    
    doc.moveDown(1.5);

    // ==================== DURÉE ====================
    doc.fontSize(12)
      .font('Helvetica-Bold')
      .fillColor('#1a2c3e')
      .text('✧ DURÉE DU CONTRAT', { underline: true });
    doc.moveDown(0.5);
    
    doc.fontSize(10)
      .font('Helvetica')
      .fillColor('#475569')
      .text(`Le présent contrat entre en vigueur à compter du ${formatDate(contrat.dateDebut)}`, { indent: 20 });
    if (contrat.dateFin) {
      doc.text(`et expirera le ${formatDate(contrat.dateFin)}.`, { indent: 20 });
    } else {
      doc.text(`et est conclu à durée indéterminée.`, { indent: 20 });
    }
    
    doc.moveDown(1.5);

    // ==================== TABLEAU DES PRODUITS ====================
    doc.fontSize(12)
      .font('Helvetica-Bold')
      .fillColor('#1a2c3e')
      .text('✧ DÉTAIL DES PRODUITS', { underline: true });
    doc.moveDown(0.5);
    
    let tableY = doc.y;
    
    // En-têtes du tableau
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#ffffff');
    doc.rect(50, tableY, 30, 22).fill('#3b82f6');
    doc.rect(80, tableY, 180, 22).fill('#3b82f6');
    doc.rect(260, tableY, 70, 22).fill('#3b82f6');
    doc.rect(330, tableY, 70, 22).fill('#3b82f6');
    doc.rect(400, tableY, 70, 22).fill('#3b82f6');
    doc.rect(470, tableY, 70, 22).fill('#3b82f6');
    
    doc.text('N°', 58, tableY + 7, { width: 20, align: 'center' });
    doc.text('Désignation', 90, tableY + 7, { width: 160, align: 'left' });
    doc.text('Quantité', 270, tableY + 7, { width: 60, align: 'center' });
    doc.text('Unité', 340, tableY + 7, { width: 60, align: 'center' });
    doc.text('Prix Unitaire', 410, tableY + 7, { width: 60, align: 'center' });
    doc.text('Total HT', 480, tableY + 7, { width: 60, align: 'center' });
    
    tableY += 22;
    doc.fillColor('#1a2c3e').font('Helvetica').fontSize(9);
    
    if (contrat.produits && contrat.produits.length > 0) {
      contrat.produits.forEach((prod, index) => {
        const produitNom = prod.sousProduit?.nom || prod.nom || 'Produit';
        const unite = prod.sousProduit?.uniteMesure || prod.uniteMesure || 'pièce';
        const total = (prod.quantite || 0) * (prod.prixUnitaire || 0);
        
        if (index % 2 === 0) {
          doc.rect(50, tableY, 490, 20).fill('#f8fafc');
        }
        
        doc.rect(50, tableY, 490, 20).stroke();
        doc.fillColor('#1a2c3e');
        doc.text(`${index + 1}`, 58, tableY + 6, { width: 20, align: 'center' });
        doc.text(produitNom.length > 22 ? produitNom.substring(0, 19) + '...' : produitNom, 90, tableY + 6, { width: 160 });
        doc.text(`${prod.quantite?.toLocaleString() || 0}`, 270, tableY + 6, { width: 60, align: 'center' });
        doc.text(unite, 340, tableY + 6, { width: 60, align: 'center' });
        doc.text(`${prod.prixUnitaire?.toLocaleString() || 0}`, 410, tableY + 6, { width: 60, align: 'center' });
        doc.text(`${total.toLocaleString()}`, 480, tableY + 6, { width: 60, align: 'right' });
        tableY += 20;
      });
    } else {
      doc.rect(50, tableY, 490, 20).stroke();
      doc.text('Aucun produit', 250, tableY + 6, { align: 'center' });
      tableY += 20;
    }
    
    tableY += 10;
    
    // Totaux
    doc.font('Helvetica-Bold').fontSize(10);
    doc.text('Total Hors Taxe (HT) :', 320, tableY, { width: 140, align: 'right' });
    doc.fillColor('#10b981').text(`${totalHT.toLocaleString()} ${contrat.devise}`, 480, tableY, { width: 70, align: 'right' });
    tableY += 20;
    doc.fillColor('#475569');
    doc.text('TVA (19%) :', 320, tableY, { width: 140, align: 'right' });
    doc.text(`${tva.toLocaleString()} ${contrat.devise}`, 480, tableY, { width: 70, align: 'right' });
    tableY += 20;
    doc.fontSize(11).fillColor('#1a2c3e');
    doc.text('Total Toutes Taxes Comprises (TTC) :', 300, tableY, { width: 160, align: 'right' });
    doc.fillColor('#10b981').font('Helvetica-Bold').fontSize(12)
      .text(`${totalTTC.toLocaleString()} ${contrat.devise}`, 480, tableY, { width: 70, align: 'right' });
    
    doc.y = tableY + 40;

    // ==================== CLAUSES LÉGALES ====================
    doc.fontSize(12)
      .font('Helvetica-Bold')
      .fillColor('#1a2c3e')
      .text('✧ CLAUSES LÉGALES', { underline: true });
    doc.moveDown(0.5);
    
    const legalClauses = [
      { title: 'Article 1 - Livraison', text: 'Les livraisons seront effectuées dans un délai maximum de 30 jours à compter de la date de commande, sauf accord contraire des parties.' },
      { title: 'Article 2 - Garanties', text: `Le ${contrat.type === 'Vente' ? 'vendeur' : 'fournisseur'} garantit la conformité des produits aux spécifications convenues.` },
      { title: 'Article 3 - Force Majeure', text: 'Les parties ne pourront être tenues responsables en cas de survenance d\'un événement de force majeure.' },
      { title: 'Article 4 - Résiliation', text: 'En cas de manquement grave aux obligations, le contrat pourra être résilié par lettre recommandée avec accusé de réception, après mise en demeure restée sans effet pendant 15 jours.' },
      { title: 'Article 5 - Loi Applicable', text: 'Le présent contrat est soumis à la législation tunisienne. Tout litige sera soumis aux tribunaux de Tunis.' }
    ];
    
    doc.fontSize(9).font('Helvetica');
    legalClauses.forEach(clause => {
      doc.font('Helvetica-Bold').fillColor('#1e40af').text(clause.title);
      doc.font('Helvetica').fillColor('#475569').text(clause.text, { indent: 20 });
      doc.moveDown(0.5);
    });

    // ==================== CONDITIONS PARTICULIÈRES ====================
    if (contrat.conditions && contrat.conditions.trim() !== '') {
      doc.moveDown();
      doc.fontSize(12)
        .font('Helvetica-Bold')
        .fillColor('#1a2c3e')
        .text('✧ CONDITIONS PARTICULIÈRES', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(9)
        .font('Helvetica')
        .fillColor('#475569')
        .text(contrat.conditions, { align: 'justify', indent: 20 });
    }

    // ==================== SIGNATURES ====================
    doc.moveDown();
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#1a2c3e');
    doc.text('✧ SIGNATURES', { underline: true });
    doc.moveDown();
    
    doc.fontSize(9).font('Helvetica').fillColor('#475569');
    doc.text('Fait à Tunis, le ' + formatDate(new Date()), { align: 'center' });
    doc.moveDown();
    
    const signY = doc.y;
    
    // Cadre signature ETAP-GAS
    doc.rect(70, signY, 200, 80).stroke();
    doc.fontSize(8).text('Signature pour ETAP-GAS', 170, signY + 35, { width: 180, align: 'center' });
    doc.text('(Cachet et signature obligatoire)', 170, signY + 50, { width: 180, align: 'center' });
    
    // Cadre signature client
    doc.rect(340, signY, 200, 80).stroke();
    doc.fontSize(8).text(`Signature pour ${contrat.tiers?.raisonSociale || 'le partenaire'}`, 440, signY + 35, { width: 180, align: 'center' });
    doc.text('(Cachet et signature obligatoire)', 440, signY + 50, { width: 180, align: 'center' });

    doc.end();
    console.log('✅ PDF généré avec succès');
    
  } catch (error) {
    console.error('❌ Erreur export PDF:', error);
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
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];

    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=tous_les_contrats.pdf');
      res.send(pdfBuffer);
    });

    // En-tête du rapport
    doc.rect(0, 0, 612, 80).fill('#1a2c3e');
    doc.fontSize(22).fillColor('#ffffff').text('RAPPORT DES CONTRATS', 50, 25);
    doc.fontSize(10).fillColor('#94a3b8').text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, 50, 55);
    doc.fontSize(10).fillColor('#94a3b8').text(`Total: ${contrats.length} contrats`, 400, 55);
    
    doc.moveDown(3);
    doc.fillColor('#1a2c3e');

    let totalGlobal = 0;

    for (let i = 0; i < contrats.length; i++) {
      const contrat = contrats[i];
      
      if (i > 0) doc.addPage();
      
      doc.fontSize(14).font('Helvetica-Bold').text(`Contrat N°: ${contrat.numeroContrat}`);
      doc.fontSize(10).font('Helvetica');
      doc.text(`Type: ${contrat.type}`);
      doc.text(`Statut: ${contrat.statut}`);
      doc.text(`Date de création: ${new Date(contrat.dateCreation).toLocaleDateString('fr-FR')}`);
      doc.text(`Tiers: ${contrat.tiers?.raisonSociale || '-'}`);
      doc.text(`Montant: ${contrat.montantTotal?.toLocaleString()} ${contrat.devise || 'TND'}`);
      doc.moveDown();
      
      totalGlobal += contrat.montantTotal || 0;
      
      if (contrat.produits && contrat.produits.length > 0) {
        doc.fontSize(9).text('Produits:');
        contrat.produits.forEach(p => {
          doc.text(`  - ${p.sousProduit?.nom || 'Produit'}: ${p.quantite} x ${p.prixUnitaire} = ${(p.quantite * p.prixUnitaire).toLocaleString()}`, { indent: 10 });
        });
      }
      
      doc.moveDown();
      doc.text('---', { align: 'center' });
    }

    doc.addPage();
    doc.fontSize(16).font('Helvetica-Bold').text('RÉCAPITULATIF GÉNÉRAL', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12);
    doc.text(`Nombre total de contrats: ${contrats.length}`);
    doc.text(`Montant total global: ${totalGlobal.toLocaleString()} TND`);

    doc.end();
  } catch (error) {
    console.error('Erreur export tous contrats:', error);
    res.status(500).json({ message: error.message });
  }
};