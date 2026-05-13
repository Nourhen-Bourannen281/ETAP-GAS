const SousProduit = require('../models/SousProduit');

// ==================== LISTE (avec typeProduit) ====================
exports.getSousProduits = async (req, res) => {
  try {
    const sousProduits = await SousProduit.find()
      .populate('typeProduit', 'nom')
      .sort({ nom: 1 });
    res.json(sousProduits);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ==================== CRÉER ====================
exports.createSousProduit = async (req, res) => {
  try {
    const { nom, typeProduit, prixUnitaire, uniteMesure, seuilMin } = req.body;
    const sousProduit = await SousProduit.create({
      nom,
      typeProduit,
      prixUnitaire,
      uniteMesure,
      seuilMin
    });
    res.status(201).json(sousProduit);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ==================== MODIFIER ====================
exports.updateSousProduit = async (req, res) => {
  try {
    const sousProduit = await SousProduit.findByIdAndUpdate(
      req.params.id,
      {
        nom: req.body.nom,
        typeProduit: req.body.typeProduit,
        prixUnitaire: req.body.prixUnitaire,
        uniteMesure: req.body.uniteMesure,
        seuilMin: req.body.seuilMin
      },
      { new: true, runValidators: true }
    ).populate('typeProduit', 'nom');

    if (!sousProduit) return res.status(404).json({ message: 'Sous-produit non trouvé' });
    res.json(sousProduit);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ==================== SUPPRIMER ====================
exports.deleteSousProduit = async (req, res) => {
  try {
    const sousProduit = await SousProduit.findByIdAndDelete(req.params.id);
    if (!sousProduit) return res.status(404).json({ message: 'Sous-produit non trouvé' });
    res.json({ message: 'Sous-produit supprimé avec succès' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};