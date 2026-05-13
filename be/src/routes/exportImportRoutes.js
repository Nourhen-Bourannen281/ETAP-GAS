const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const { protect } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');
const exportImportController = require('../controllers/exportImportController');

router.get('/export/:type/excel', protect, authorizeRoles('Admin', 'Commercial'), exportImportController.exportToExcel);
router.get('/export/:type/pdf', protect, authorizeRoles('Admin', 'Commercial'), exportImportController.exportToPDF);
router.post('/import/:type', protect, authorizeRoles('Admin'), upload.single('file'), exportImportController.importFromExcel);
router.patch('/associate/:type/:id', protect, authorizeRoles('Admin'), exportImportController.associateContrat);

module.exports = router;