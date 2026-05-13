const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');
const contratController = require('../controllers/contratController');

// Toutes les routes nécessitent authentification
router.use(protect);

// Routes pour les commerciaux et admins
router.get('/', contratController.getContrats);
router.post('/', authorizeRoles('Commercial'), contratController.createContrat);
router.put('/:id', authorizeRoles('Commercial'), contratController.updateContrat);
router.delete('/:id', authorizeRoles('Commercial'), contratController.deleteContrat);
router.patch('/:id/valider', authorizeRoles('Commercial'), contratController.validerContrat);

// Routes d'export PDF
router.get('/:id/pdf', contratController.exportContratPDF);
router.get('/export/all/pdf', authorizeRoles('Admin'), contratController.exportAllContratsPDF);

module.exports = router;