const mongoose = require('mongoose');

const sousProduitSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  typeProduit: { type: mongoose.Schema.Types.ObjectId, ref: 'TypeProduit', required: true },
  prixUnitaire: { type: Number, required: true },
  uniteMesure: { type: String, default: 'Litre' },
  seuilMin: { type: Number, default: 100 },
  dateCreation: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SousProduit', sousProduitSchema);