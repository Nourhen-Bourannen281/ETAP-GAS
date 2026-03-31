const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// LOGIN
exports.login = async (req, res) => {
  const { email, motDePasse } = req.body;

  try {
    console.log('Login attempt for:', email);
    
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found');
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    console.log('User found:', user.email, 'Role:', user.role);
    console.log('Account active:', user.actif);

    if (!user.actif) {
      console.log('Account disabled');
      return res.status(401).json({ message: 'Compte désactivé' });
    }

    // ✅ Utilisez comparePassword (méthode du modèle)
    const isMatch = await user.comparePassword(motDePasse);
    console.log('Password match:', isMatch);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'etapgas2026',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: err.message });
  }
};

// LOGOUT
exports.logout = (req, res) => {
  res.json({ message: 'Déconnexion réussie' });
};

// VERIFY ACCOUNT
exports.verifyAccount = (req, res) => {
  const { token } = req.params;
  res.json({ message: `Compte vérifié avec le token ${token}` });
};

// REJECT ACCOUNT
exports.rejectAccount = (req, res) => {
  const { token } = req.params;
  res.json({ message: `Compte rejeté avec le token ${token}` });
};

// FORGOT PASSWORD
exports.forgotPassword = (req, res) => {
  const { email } = req.body;
  res.json({ message: `Lien de réinitialisation envoyé à ${email}` });
};

// RESET PASSWORD
exports.resetPassword = async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    res.json({ message: `Mot de passe réinitialisé avec le token ${token}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// CREATE USER (par un admin)
exports.createUser = async (req, res) => {
  try {
    const { nom, prenom, email, motDePasse, telephone, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Cet email est déjà utilisé" });
    }

    const newUser = new User({
      nom,
      prenom,
      email,
      motDePasse,
      telephone,
      role: role || 'Client',
      actif: true
    });

    await newUser.save();

    res.status(201).json({
      message: "Utilisateur créé avec succès",
      user: {
        id: newUser._id,
        nom: newUser.nom,
        prenom: newUser.prenom,
        email: newUser.email,
        role: newUser.role,
        telephone: newUser.telephone,
        actif: newUser.actif,
        dateCreation: newUser.dateCreation
      }
    });
  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).json({ message: err.message });
  }
};


//admin admin2@etap.com pass admin123
//client nourhenbouranen@gmail.com 123456