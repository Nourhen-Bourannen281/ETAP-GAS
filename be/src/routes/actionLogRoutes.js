const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');
const actionLogController = require('../controllers/actionLogController');

router.get('/', protect, authorizeRoles('Admin'), actionLogController.getActionLogs);

module.exports = router;