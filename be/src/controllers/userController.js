const User = require('../models/User');
const bcrypt = require('bcryptjs');

// ==================== GET ALL USERS ====================
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-motDePasse').sort({ dateCreation: -1 });
    res.json(users);
  } catch (err) {
    console.error('Erreur getUsers:', err);
    res.status(500).json({ message: err.message });
  }
};

// ==================== GET TRANSPORTEURS ====================
exports.getTransporteurs = async (req, res) => {
  try {
    console.log('🔍 Récupération des transporteurs depuis Users...');
    
    const transporteurs = await User.find({ 
      role: 'Transporteur', 
      actif: true 
    }).select('nom prenom email telephone role actif').sort({ nom: 1 });
    
    console.log(`✅ ${transporteurs.length} transporteur(s) trouvé(s) dans Users:`, transporteurs);
    
    res.json(transporteurs);
  } catch (err) {
    console.error('❌ Erreur getTransporteurs:', err);
    res.status(500).json({ message: err.message });
  }
};

// ==================== GET USER BY ID ====================
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-motDePasse');
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    res.json(user);
  } catch (err) {
    console.error('Erreur getUserById:', err);
    res.status(500).json({ message: err.message });
  }
};

// ==================== CREATE USER ====================
exports.createUser = async (req, res) => {
  try {
    const { nom, prenom, email, motDePasse, telephone, role } = req.body;
    
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }
    
    const user = await User.create({
      nom,
      prenom,
      email,
      motDePasse,
      telephone,
      role: role || 'Client',
      actif: true
    });
    
    const userResponse = user.toObject();
    delete userResponse.motDePasse;
    
    res.status(201).json(userResponse);
  } catch (err) {
    console.error('Erreur createUser:', err);
    res.status(400).json({ message: err.message });
  }
};

// ==================== UPDATE USER ====================
exports.updateUser = async (req, res) => {
  try {
    const { nom, prenom, email, telephone, role } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    // Vérifier si l'email est déjà utilisé par un autre utilisateur
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Cet email est déjà utilisé' });
      }
    }
    
    if (nom) user.nom = nom;
    if (prenom) user.prenom = prenom;
    if (email) user.email = email;
    if (telephone) user.telephone = telephone;
    if (role) user.role = role;
    
    await user.save();
    
    const userResponse = user.toObject();
    delete userResponse.motDePasse;
    
    res.json(userResponse);
  } catch (err) {
    console.error('Erreur updateUser:', err);
    res.status(400).json({ message: err.message });
  }
};

// ==================== DELETE USER ====================
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    await user.deleteOne();
    res.json({ message: 'Utilisateur supprimé avec succès' });
  } catch (err) {
    console.error('Erreur deleteUser:', err);
    res.status(500).json({ message: err.message });
  }
};

// ==================== ACTIVATE USER ====================
exports.activateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    user.actif = true;
    await user.save();
    
    res.json({ message: 'Utilisateur activé avec succès', user });
  } catch (err) {
    console.error('Erreur activateUser:', err);
    res.status(500).json({ message: err.message });
  }
};

// ==================== DEACTIVATE USER ====================
exports.deactivateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    user.actif = false;
    await user.save();
    
    res.json({ message: 'Utilisateur désactivé avec succès', user });
  } catch (err) {
    console.error('Erreur deactivateUser:', err);
    res.status(500).json({ message: err.message });
  }
};