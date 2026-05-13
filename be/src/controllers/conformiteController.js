const Conformite = require('../models/Conformite');
const { checkConformiteAuto } = require('../services/conformiteService');

exports.getConformites = async (req, res) => {
  try {
    const conformites = await Conformite.find()
      .populate('document', 'type filePath')
      .populate('verifiePar', 'nom email')
      .sort({ dateControle: -1 });
    res.json(conformites);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getConformiteById = async (req, res) => {
  try {
    const conformite = await Conformite.findById(req.params.id)
      .populate('document', 'type filePath')
      .populate('verifiePar', 'nom email');
    if (!conformite) return res.status(404).json({ message: 'Contrôle non trouvé' });
    res.json(conformite);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createConformite = async (req, res) => {
  try {
    const { document, typeControle, commentaire } = req.body;

    const conformite = await Conformite.create({
      document,
      typeControle,
      statut: req.body.statut || 'Conforme',
      commentaire,
      verifiePar: req.user.id
    });

    const populated = await Conformite.findById(conformite._id)
      .populate('document', 'type')
      .populate('verifiePar', 'nom');

    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const total = await Conformite.countDocuments();
    const conforme = await Conformite.countDocuments({ statut: 'Conforme' });
    const nonConforme = await Conformite.countDocuments({ statut: 'Non conforme' });
    const douane = await Conformite.countDocuments({ typeControle: 'Douane' });

    res.json({ total, conforme, nonConforme, douane });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Fonction à appeler automatiquement après création d'un document important
exports.checkConformiteAuto = checkConformiteAuto;