const mongoose = require('mongoose');

const tiersSchema = new mongoose.Schema({
  raisonSociale: { type: String, required: true },
  type: { type: Number, enum: [0, 1], required: true }, // 0=Client, 1=Fournisseur
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  adresse: String,
  email: String,
  telephone: String,
  matriculeFiscale: String,
  pays: { type: mongoose.Schema.Types.ObjectId, ref: 'Pays' },
  banque: { type: mongoose.Schema.Types.ObjectId, ref: 'Banque' },
  dateCreation: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Tiers', tiersSchema);