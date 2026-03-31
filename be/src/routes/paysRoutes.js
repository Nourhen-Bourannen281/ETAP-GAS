const express = require('express');
const router = express.Router();
const {
  getPays,
  getPaysById,
  createPays,
  updatePays,
  deletePays
} = require('../controllers/paysController');

// Middleware d'authentification (à décommenter quand vous aurez l'auth)
// const { protect, authorize } = require('../middleware/authMiddleware');

// Routes
// GET /api/pays - Obtenir tous les pays
router.get('/', getPays);

// GET /api/pays/:id - Obtenir un pays par ID
router.get('/:id', getPaysById);

// POST /api/pays - Créer un pays (Admin seulement)
router.post('/', createPays);

// PUT /api/pays/:id - Mettre à jour un pays (Admin seulement)
router.put('/:id', updatePays);

// DELETE /api/pays/:id - Supprimer un pays (Admin seulement)
router.delete('/:id', deletePays);

module.exports = router;