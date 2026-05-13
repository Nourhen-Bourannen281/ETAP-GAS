const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  prenom: { type: String },
  email: { type: String, required: true, unique: true },
  motDePasse: { type: String, required: true },
  telephone: { type: String },
  role: { 
    type: String, 
    enum: ['Admin', 'Commercial', 'Client', 'Transporteur', 'Fournisseur'],
    default: 'Client'
  },
  actif: { type: Boolean, default: true },
  dateCreation: { type: Date, default: Date.now }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('motDePasse')) return next();
  this.motDePasse = await bcrypt.hash(this.motDePasse, 10);
  next();
});

// ✅ Méthode pour comparer les mots de passe (DOIT ÊTRE PRÉSENTE)
userSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.motDePasse);
};

// Generate JWT
userSchema.methods.generateToken = function() {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET || 'etapgas2026',
    { expiresIn: '7d' }
  );
};

module.exports = mongoose.model('User', userSchema);