const mongoose = require('mongoose');

const cabotageSchema = new mongoose.Schema({
  numeroCabotage: { type: String, required: true, unique: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Tiers', required: true },
  produit: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantite: { type: Number, required: true, min: 0 },
  prixUnitaire: { type: Number, required: true },
  montantTotal: { type: Number, default: 0 },
  devise: { type: String, enum: ['TND', 'USD'], default: 'TND' },
  typeOperation: { 
    type: String, 
    enum: ['Vente', 'Transport', 'Stockage'], 
    default: 'Vente' 
  },
  pointDepart: { type: String },
  pointArrivee: { type: String },
  transporteur: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  dateOperation: { type: Date, default: Date.now },
  dateLivraisonPrevue: { type: Date },
  dateLivraisonReelle: { type: Date },
  statut: { 
    type: String, 
    enum: ['En attente', 'Validée', 'En transit', 'Livrée', 'Facturée', 'Annulée'], 
    default: 'En attente' 
  },
  factureId: { type: mongoose.Schema.Types.ObjectId, ref: 'Facture' },
  numeroBonLivraison: { type: String },
  numeroBonPesee: { type: String },
  commentaire: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  dateCreation: { type: Date, default: Date.now },
  dateModification: { type: Date }
});

// Calcul automatique du montant total
cabotageSchema.pre('save', function(next) {
  if (this.quantite && this.prixUnitaire) {
    this.montantTotal = this.quantite * this.prixUnitaire;
  }
  next();
});

module.exports = mongoose.model('Cabotage', cabotageSchema);