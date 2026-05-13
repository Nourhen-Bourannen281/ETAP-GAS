const mongoose = require('mongoose');

const actionLogSchema = new mongoose.Schema({
  utilisateur: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  action: { 
    type: String, 
    required: true 
  },
  details: { 
    type: String,
    default: ''
  },
  ipAddress: { 
    type: String,
    default: 'unknown'
  },
  dateAction: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('ActionLog', actionLogSchema);