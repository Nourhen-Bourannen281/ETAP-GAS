const ModePaiement = require('../models/ModePaiement');

// @desc    Obtenir tous les modes de paiement actifs
// @route   GET /api/modes-paiement
// @access  Public (pour les clients) / Private (pour admin)
exports.getModesPaiement = async (req, res) => {
  try {
    // Si c'est un client, on renvoie seulement les modes actifs
    const filter = req.user?.role === 'Admin' ? {} : { actif: true };
    const modes = await ModePaiement.find(filter).sort({ nom: 1 });
    res.status(200).json(modes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Obtenir un mode de paiement par ID
// @route   GET /api/modes-paiement/:id
// @access  Private
exports.getModePaiementById = async (req, res) => {
  try {
    const mode = await ModePaiement.findById(req.params.id);
    if (!mode) {
      return res.status(404).json({ message: 'Mode de paiement non trouvé' });
    }
    res.status(200).json(mode);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Créer un nouveau mode de paiement
// @route   POST /api/modes-paiement
// @access  Private (Admin only)
exports.createModePaiement = async (req, res) => {
  try {
    const { nom, description } = req.body;
    
    // Vérifier si le nom existe déjà
    const existingMode = await ModePaiement.findOne({ 
      nom: { $regex: new RegExp(`^${nom}$`, 'i') } 
    });
    
    if (existingMode) {
      return res.status(400).json({ message: 'Ce mode de paiement existe déjà' });
    }
    
    const mode = new ModePaiement({ 
      nom: nom.trim(),
      description: description || ''
    });
    
    const savedMode = await mode.save();
    res.status(201).json(savedMode);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Mettre à jour un mode de paiement
// @route   PUT /api/modes-paiement/:id
// @access  Private (Admin only)
exports.updateModePaiement = async (req, res) => {
  try {
    const { nom, description, actif } = req.body;
    
    const mode = await ModePaiement.findById(req.params.id);
    if (!mode) {
      return res.status(404).json({ message: 'Mode de paiement non trouvé' });
    }
    
    // Vérifier si le nouveau nom n'est pas déjà utilisé
    if (nom && nom !== mode.nom) {
      const existingMode = await ModePaiement.findOne({ 
        nom: { $regex: new RegExp(`^${nom}$`, 'i') },
        _id: { $ne: req.params.id }
      });
      if (existingMode) {
        return res.status(400).json({ message: 'Ce mode de paiement existe déjà' });
      }
      mode.nom = nom.trim();
    }
    
    if (description !== undefined) mode.description = description;
    if (actif !== undefined) mode.actif = actif;
    
    const updatedMode = await mode.save();
    res.status(200).json(updatedMode);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Supprimer un mode de paiement
// @route   DELETE /api/modes-paiement/:id
// @access  Private (Admin only)
exports.deleteModePaiement = async (req, res) => {
  try {
    const mode = await ModePaiement.findById(req.params.id);
    if (!mode) {
      return res.status(404).json({ message: 'Mode de paiement non trouvé' });
    }
    
    await mode.deleteOne();
    res.status(200).json({ message: 'Mode de paiement supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Activer/Désactiver un mode de paiement
// @route   PATCH /api/modes-paiement/:id/toggle
// @access  Private (Admin only)
exports.toggleModePaiement = async (req, res) => {
  try {
    const mode = await ModePaiement.findById(req.params.id);
    if (!mode) {
      return res.status(404).json({ message: 'Mode de paiement non trouvé' });
    }
    
    mode.actif = !mode.actif;
    await mode.save();
    
    res.status(200).json({ 
      message: `Mode de paiement ${mode.actif ? 'activé' : 'désactivé'} avec succès`,
      actif: mode.actif 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};