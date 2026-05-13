const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');
const venteLocaleController = require('../controllers/venteLocaleController');

router.use(protect);

// Routes de lecture
router.get('/', venteLocaleController.getVentesLocales);

// Routes d'écriture (Commercial et Admin)
router.post('/', authorizeRoles('Commercial', 'Admin'), venteLocaleController.createVenteLocale);
router.put('/:id', authorizeRoles('Commercial', 'Admin'), venteLocaleController.updateVenteLocale);
router.patch('/:id/statut', authorizeRoles('Commercial', 'Admin'), venteLocaleController.updateStatut);
router.delete('/:id', authorizeRoles('Admin'), venteLocaleController.deleteVenteLocale);

// Routes d'export
router.get('/export/excel', authorizeRoles('Commercial', 'Admin'), venteLocaleController.exportExcel);
router.get('/export/pdf', authorizeRoles('Commercial', 'Admin'), venteLocaleController.exportPDF);

module.exports = router;