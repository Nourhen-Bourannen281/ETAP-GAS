const Tiers = require('../models/Tiers');

// @desc    Obtenir tous les tiers
exports.getTiers = async (req, res) => {
  try {
    const tiers = await Tiers.find()
      .populate('pays', 'nom')
      .populate('banque', 'nom')
      .sort({ raisonSociale: 1 });
    res.json(tiers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Obtenir un tiers par ID
exports.getTiersById = async (req, res) => {
  try {
    const tiers = await Tiers.findById(req.params.id)
      .populate('pays', 'nom')
      .populate('banque', 'nom');
    if (!tiers) {
      return res.status(404).json({ message: 'Tiers non trouvé' });
    }
    res.json(tiers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Obtenir le client par utilisateur connecté
exports.getClientByUser = async (req, res) => {
  try {
    const client = await Tiers.findOne({ user: req.user.id, type: 0 })
      .populate('pays', 'nom')
      .populate('banque', 'nom');
    
    if (!client) {
      return res.status(404).json({ message: 'Client non trouvé' });
    }
    
    res.json(client);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Créer un tiers
exports.createTiers = async (req, res) => {
  try {
    const tiers = new Tiers(req.body);
    const savedTiers = await tiers.save();
    res.status(201).json(savedTiers);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// @desc    Mettre à jour un tiers
exports.updateTiers = async (req, res) => {
  try {
    const tiers = await Tiers.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!tiers) {
      return res.status(404).json({ message: 'Tiers non trouvé' });
    }
    res.json(tiers);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// @desc    Supprimer un tiers
exports.deleteTiers = async (req, res) => {
  try {
    const tiers = await Tiers.findByIdAndDelete(req.params.id);
    if (!tiers) {
      return res.status(404).json({ message: 'Tiers non trouvé' });
    }
    res.json({ message: 'Tiers supprimé avec succès' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};