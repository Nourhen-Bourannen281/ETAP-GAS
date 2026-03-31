const mongoose = require('mongoose');

const typeFactureSchema = new mongoose.Schema({
  nom: { type: String, required: true, unique: true },
  devise: { type: String, enum: ['TND', 'USD'], required: true },
  dateCreation: { type: Date, default: Date.now }
});

module.exports = mongoose.model('TypeFacture', typeFactureSchema);