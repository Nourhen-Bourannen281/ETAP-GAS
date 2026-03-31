// routes/contratRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');

const {
  getContrats,
  createContrat,
  updateContrat,
  deleteContrat,
  validerContrat,
  exportContratPDF,
  exportAllContratsPDF
} = require('../controllers/contratController');

// Liste contrats (tous rôles, filtrés dans le controller)
router.get('/', protect, getContrats);

// CRUD contrats : seulement Commercial (tu peux ajouter "Admin" si tu veux)
router.post('/', protect, authorizeRoles('Commercial'), createContrat);
router.put('/:id', protect, authorizeRoles('Commercial'), updateContrat);
router.delete('/:id', protect, authorizeRoles('Commercial'), deleteContrat);
router.patch('/:id/valider', protect, authorizeRoles('Commercial'), validerContrat);

// Export PDF d'un contrat : mêmes règles que dans le controller (Admin/Commercial ou tiers)
router.get('/:id/pdf', protect, exportContratPDF);

// Export tous les contrats : seulement Admin
router.get('/export/all/pdf', protect, authorizeRoles('Admin'), exportAllContratsPDF);

module.exports = router;