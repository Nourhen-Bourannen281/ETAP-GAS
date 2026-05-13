const express = require('express');
const router = express.Router();

const { protect } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');

const productController = require('../controllers/productController');

// Routes publiques (lecture) - Accessibles à tous les utilisateurs connectés
router.get('/', protect, productController.getProducts);
router.get('/:id', protect, productController.getProductById);

// Routes d'écriture - Réservées aux Admins (avec majuscule)
router.post('/', protect, authorizeRoles('Admin'), productController.createProduct);
router.put('/:id', protect, authorizeRoles('Admin'), productController.updateProduct);
router.delete('/:id', protect, authorizeRoles('Admin'), productController.deleteProduct);

module.exports = router;