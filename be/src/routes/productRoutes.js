const express = require('express');
const router = express.Router();

const { protect } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');

const productController = require('../controllers/productController');

// Routes publiques (lecture)
router.get('/', protect, productController.getProducts);
router.get('/:id', protect, productController.getProductById);

// Routes admin seulement (écriture)
router.post('/', protect, authorizeRoles('admin'), productController.createProduct);
router.put('/:id', protect, authorizeRoles('admin'), productController.updateProduct);
router.delete('/:id', protect, authorizeRoles('admin'), productController.deleteProduct);

module.exports = router;