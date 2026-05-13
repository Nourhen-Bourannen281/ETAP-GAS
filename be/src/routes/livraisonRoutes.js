const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');
const livraisonController = require('../controllers/livraisonController');

// Toutes les routes nécessitent authentification
router.use(protect);

// Routes publiques (lecture)
router.get('/', livraisonController.getLivraisons);
router.get('/transporteurs', authorizeRoles('Admin', 'Commercial'), livraisonController.getTransporteurs);

// Routes pour les commerciaux et admins
router.post('/from-commande/:commandeId', authorizeRoles('Commercial', 'Admin'), livraisonController.createLivraisonFromCommande);
router.patch('/:id/etat', authorizeRoles('Commercial', 'Admin', 'Transporteur'), livraisonController.updateEtatLivraison);
router.delete('/:id', authorizeRoles('Commercial', 'Admin'), livraisonController.deleteLivraison);

// Routes pour les admins uniquement
router.patch('/:id/assign-transporteur', authorizeRoles('Admin'), livraisonController.assignTransporteur);

// Route d'export PDF
router.get('/:id/pdf', livraisonController.generateBonLivraisonPDF);

module.exports = router;