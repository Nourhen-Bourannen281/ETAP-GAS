const express = require('express');
const router = express.Router();
const {
  getTypesFacture,
  getTypeFactureById,
  createTypeFacture,
  updateTypeFacture,
  deleteTypeFacture
} = require('../controllers/typeFactureController');

// GET /api/types-facture - Obtenir tous les types de facture
router.get('/', getTypesFacture);

// GET /api/types-facture/:id - Obtenir un type de facture par ID
router.get('/:id', getTypeFactureById);

// POST /api/types-facture - Créer un type de facture (Admin seulement)
router.post('/', createTypeFacture);

// PUT /api/types-facture/:id - Mettre à jour un type de facture (Admin seulement)
router.put('/:id', updateTypeFacture);

// DELETE /api/types-facture/:id - Supprimer un type de facture (Admin seulement)
router.delete('/:id', deleteTypeFacture);

module.exports = router;