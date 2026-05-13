const mongoose = require('mongoose');

const venteLocaleSchema = new mongoose.Schema({
  numeroVente: { type: String, required: true, unique: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Tiers', required: true },
  produit: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantite: { type: Number, required: true, min: 0 },
  prixUnitaire: { type: Number, required: true },
  montantTotal: { type: Number, default: 0 },
  devise: { type: String, enum: ['TND', 'USD'], default: 'TND' },
  dateVente: { type: Date, default: Date.now },
  dateLivraisonPrevue: { type: Date },
  dateLivraisonReelle: { type: Date },
  statut: { 
    type: String, 
    enum: ['En attente', 'Validée', 'En livraison', 'Livrée', 'Facturée', 'Annulée'], 
    default: 'En attente' 
  },
  factureId: { type: mongoose.Schema.Types.ObjectId, ref: 'Facture' },
  commentaire: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  dateCreation: { type: Date, default: Date.now },
  dateModification: { type: Date }
});

// Calcul automatique du montant total
venteLocaleSchema.pre('save', function(next) {
  if (this.quantite && this.prixUnitaire) {
    this.montantTotal = this.quantite * this.prixUnitaire;
  }
  next();
});

module.exports = mongoose.model('VenteLocale', venteLocaleSchema);