const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  code: { type: String, unique: true },
  nom: { type: String, required: true },
  abreviation: { type: String },
  qualite: { type: String },
  description: { type: String },
  sousProduit: { type: mongoose.Schema.Types.ObjectId, ref: 'SousProduit', required: true },
  prixUnitaire: { type: Number, required: true },
  uniteMesure: { type: String, default: 'Litre' },
  seuilMin: { type: Number, default: 100 },
  stockActuel: { type: Number, default: 0 },
  dateCreation: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);