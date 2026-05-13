const Pays = require('../models/Pays');

// @desc    Obtenir tous les pays
// @route   GET /api/pays
// @access  Private
const getPays = async (req, res) => {
  try {
    const pays = await Pays.find().sort({ nom: 1 });
    res.status(200).json(pays);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Obtenir un pays par ID
// @route   GET /api/pays/:id
// @access  Private
const getPaysById = async (req, res) => {
  try {
    const pays = await Pays.findById(req.params.id);
    if (!pays) {
      return res.status(404).json({ message: 'Pays non trouvé' });
    }
    res.status(200).json(pays);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Créer un nouveau pays
// @route   POST /api/pays
// @access  Private (Admin only)
const createPays = async (req, res) => {
  try {
    const { code, nom } = req.body;
    
    // Vérifier si le code existe déjà
    const existingPays = await Pays.findOne({ code });
    if (existingPays) {
      return res.status(400).json({ message: 'Ce code pays existe déjà' });
    }
    
    const pays = new Pays({
      code: code.toUpperCase(),
      nom
    });
    
    const savedPays = await pays.save();
    res.status(201).json(savedPays);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Mettre à jour un pays
// @route   PUT /api/pays/:id
// @access  Private (Admin only)
const updatePays = async (req, res) => {
  try {
    const { code, nom } = req.body;
    
    const pays = await Pays.findById(req.params.id);
    if (!pays) {
      return res.status(404).json({ message: 'Pays non trouvé' });
    }
    
    // Vérifier si le nouveau code n'est pas déjà utilisé par un autre pays
    if (code && code !== pays.code) {
      const existingPays = await Pays.findOne({ code: code.toUpperCase() });
      if (existingPays) {
        return res.status(400).json({ message: 'Ce code pays existe déjà' });
      }
      pays.code = code.toUpperCase();
    }
    
    if (nom) pays.nom = nom;
    
    const updatedPays = await pays.save();
    res.status(200).json(updatedPays);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Supprimer un pays
// @route   DELETE /api/pays/:id
// @access  Private (Admin only)
const deletePays = async (req, res) => {
  try {
    const pays = await Pays.findById(req.params.id);
    if (!pays) {
      return res.status(404).json({ message: 'Pays non trouvé' });
    }
    
    // Vérifier si le pays est utilisé par d'autres entités (optionnel)
    // const banques = await Banque.findOne({ pays: req.params.id });
    // if (banques) {
    //   return res.status(400).json({ message: 'Ce pays est utilisé par des banques, suppression impossible' });
    // }
    
    await pays.deleteOne();
    res.status(200).json({ message: 'Pays supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getPays,
  getPaysById,
  createPays,
  updatePays,
  deletePays
};