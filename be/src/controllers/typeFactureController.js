const TypeFacture = require('../models/TypeFacture');

// @desc    Obtenir tous les types de facture
// @route   GET /api/types-facture
// @access  Private
const getTypesFacture = async (req, res) => {
  try {
    const types = await TypeFacture.find().sort({ nom: 1 });
    res.status(200).json(types);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Obtenir un type de facture par ID
// @route   GET /api/types-facture/:id
// @access  Private
const getTypeFactureById = async (req, res) => {
  try {
    const type = await TypeFacture.findById(req.params.id);
    if (!type) {
      return res.status(404).json({ message: 'Type de facture non trouvé' });
    }
    res.status(200).json(type);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Créer un nouveau type de facture
// @route   POST /api/types-facture
// @access  Private (Admin only)
const createTypeFacture = async (req, res) => {
  try {
    const { nom, devise } = req.body;
    
    // Vérifier si le nom existe déjà
    const existingType = await TypeFacture.findOne({ nom });
    if (existingType) {
      return res.status(400).json({ message: 'Ce type de facture existe déjà' });
    }
    
    const type = new TypeFacture({ nom, devise });
    const savedType = await type.save();
    res.status(201).json(savedType);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Mettre à jour un type de facture
// @route   PUT /api/types-facture/:id
// @access  Private (Admin only)
const updateTypeFacture = async (req, res) => {
  try {
    const { nom, devise } = req.body;
    
    const type = await TypeFacture.findById(req.params.id);
    if (!type) {
      return res.status(404).json({ message: 'Type de facture non trouvé' });
    }
    
    // Vérifier si le nouveau nom n'est pas déjà utilisé
    if (nom && nom !== type.nom) {
      const existingType = await TypeFacture.findOne({ nom });
      if (existingType) {
        return res.status(400).json({ message: 'Ce type de facture existe déjà' });
      }
      type.nom = nom;
    }
    
    if (devise) type.devise = devise;
    
    const updatedType = await type.save();
    res.status(200).json(updatedType);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Supprimer un type de facture
// @route   DELETE /api/types-facture/:id
// @access  Private (Admin only)
const deleteTypeFacture = async (req, res) => {
  try {
    const type = await TypeFacture.findById(req.params.id);
    if (!type) {
      return res.status(404).json({ message: 'Type de facture non trouvé' });
    }
    
    await type.deleteOne();
    res.status(200).json({ message: 'Type de facture supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getTypesFacture,
  getTypeFactureById,
  createTypeFacture,
  updateTypeFacture,
  deleteTypeFacture
};