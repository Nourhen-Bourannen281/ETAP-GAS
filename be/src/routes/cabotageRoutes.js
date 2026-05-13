const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');
const cabotageController = require('../controllers/cabotageController');

router.use(protect);

// Routes de lecture
router.get('/', cabotageController.getCabotages);
router.get('/transporteurs', authorizeRoles('Admin', 'Commercial'), cabotageController.getTransporteurs);

// Routes d'écriture
router.post('/', authorizeRoles('Commercial', 'Admin'), cabotageController.createCabotage);
router.put('/:id', authorizeRoles('Commercial', 'Admin'), cabotageController.updateCabotage);
router.patch('/:id/statut', authorizeRoles('Commercial', 'Admin'), cabotageController.updateStatut);
router.delete('/:id', authorizeRoles('Admin'), cabotageController.deleteCabotage);

// Routes d'export
router.get('/export/excel', authorizeRoles('Commercial', 'Admin'), cabotageController.exportExcel);
router.get('/export/pdf', authorizeRoles('Commercial', 'Admin'), cabotageController.exportPDF);

module.exports = router;