const mongoose = require('mongoose');

const paiementSchema = new mongoose.Schema({
  numeroPaiement: { type: String, required: true, unique: true },
  commande: { type: mongoose.Schema.Types.ObjectId, ref: 'Commande' },
  facture: { type: mongoose.Schema.Types.ObjectId, ref: 'Facture' },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  clientNom: { type: String },
  tiers: { type: mongoose.Schema.Types.ObjectId, ref: 'Tiers' },
  montant: { type: Number, required: true },
  devise: { type: String, enum: ['TND', 'USD', 'EUR'], default: 'TND' },
  modePaiement: { 
    type: String, 
    required: true 
    // ENUM SUPPRIMÉ - maintenant accepte toutes les valeurs
  },
  statut: { 
    type: String, 
    enum: ['En attente', 'Validé', 'Rejeté', 'Payé', 'en_attente'], 
    default: 'En attente' 
  },
  datePaiement: { type: Date, default: Date.now },
  reference: String,
  description: String,
  validePar: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  dateValidation: Date,
  dateCreation: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Paiement', paiementSchema);