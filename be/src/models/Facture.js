const mongoose = require('mongoose');

const factureSchema = new mongoose.Schema({
  numeroFacture: { type: String, required: true, unique: true },
  typeFacture: { type: mongoose.Schema.Types.ObjectId, ref: 'TypeFacture', required: true },
  contrat: { type: mongoose.Schema.Types.ObjectId, ref: 'Contrat', required: true },
  commande: { type: mongoose.Schema.Types.ObjectId, ref: 'Commande' },
  livraison: { type: mongoose.Schema.Types.ObjectId, ref: 'Livraison' },
  montantHT: { type: Number, required: true },
  montantTVA: { type: Number, required: true },
  montantTTC: { type: Number, required: true },
  devise: { type: String, enum: ['TND', 'USD'], required: true },
  dateEmission: { type: Date, default: Date.now },
  dateEcheance: { type: Date, required: true },
  statut: { type: String, enum: ['En attente', 'Payée', 'Annulée'], default: 'En attente' },
  pdfPath: { type: String },
  dateCreation: { type: Date, default: Date.now },
  dateModification: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Facture', factureSchema);