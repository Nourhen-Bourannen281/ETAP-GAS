// migration/updateModePaiementNames.js
const mongoose = require('mongoose');
const ModePaiement = require('./models/ModePaiement');

const updateModePaiementNames = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/votre_db');
    
    // Mettre à jour les noms pour correspondre à la norme
    const updates = [
      { search: /^cheque$/i, replacement: 'Chèque' },
      { search: /^espece$/i, replacement: 'Espèces' },
      { search: /^carte banquaire$/i, replacement: 'Carte bancaire' }
    ];
    
    for (const update of updates) {
      const result = await ModePaiement.updateMany(
        { nom: update.search },
        { $set: { nom: update.replacement } }
      );
      console.log(`Mis à jour ${result.modifiedCount} document(s) avec ${update.search} -> ${update.replacement}`);
    }
    
    console.log('Migration terminée avec succès !');
    await mongoose.disconnect();
  } catch (error) {
    console.error('Erreur lors de la migration:', error);
    process.exit(1);
  }
};

updateModePaiementNames();