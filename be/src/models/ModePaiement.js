const mongoose = require('mongoose');

const modePaiementSchema = new mongoose.Schema({
  nom: { 
    type: String, 
    required: true, 
    unique: true 
  },
  description: { 
    type: String, 
    default: '' 
  },
  actif: { 
    type: Boolean, 
    default: true 
  },
  dateCreation: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('ModePaiement', modePaiementSchema);