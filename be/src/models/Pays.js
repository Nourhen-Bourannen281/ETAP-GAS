const mongoose = require('mongoose');

const paysSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  nom: { type: String, required: true },
  dateCreation: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Pays', paysSchema);