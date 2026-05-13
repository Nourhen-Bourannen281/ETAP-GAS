const Stock = require('../models/Stock');
const Product = require('../models/Product');

// @desc    Obtenir tout le stock (TOUS les produits, même sans stock)
const getStock = async (req, res) => {
  try {
    console.log('Récupération de tous les produits avec leur stock...');
    
    // Récupérer TOUS les produits
    const allProducts = await Product.find().lean();
    console.log(`📦 ${allProducts.length} produits trouvés`);
    
    // Récupérer tous les stocks existants
    const stocks = await Stock.find().lean();
    console.log(`📊 ${stocks.length} entrées de stock trouvées`);
    
    // Créer un Map des stocks par produit ID
    const stockMap = new Map();
    stocks.forEach(stock => {
      const productId = stock.product?.toString();
      stockMap.set(productId, stock);
    });
    
    // Fusionner: tous les produits + leurs stocks (ou stock par défaut)
    const enrichedStock = allProducts.map(product => {
      const existingStock = stockMap.get(product._id.toString());
      
      if (existingStock) {
        // Produit avec stock existant
        return {
          ...existingStock,
          product: product,
          _id: existingStock._id,
          quantity: existingStock.quantity,
          seuilMin: existingStock.seuilMin,
          alerteActive: existingStock.alerteActive,
          dateDerniereMiseAJour: existingStock.dateDerniereMiseAJour
        };
      } else {
        // Produit SANS stock - créer un stock virtuel avec quantité 0
        return {
          _id: `virtual_${product._id}`, // ID virtuel pour le frontend
          product: product,
          quantity: 0,
          seuilMin: product.seuilMin || 100,
          alerteActive: true,
          dateDerniereMiseAJour: product.dateCreation || new Date(),
          isVirtual: true // Marquer comme virtuel (pour info)
        };
      }
    });
    
    console.log(`✅ ${enrichedStock.length} éléments retournés (dont ${enrichedStock.filter(s => s.isVirtual).length} virtuels)`);
    res.status(200).json(enrichedStock);
  } catch (error) {
    console.error('Erreur getStock:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Obtenir un stock par ID
const getStockById = async (req, res) => {
  try {
    // Vérifier si c'est un ID virtuel
    if (req.params.id.startsWith('virtual_')) {
      const productId = req.params.id.replace('virtual_', '');
      const product = await Product.findById(productId).lean();
      
      if (!product) {
        return res.status(404).json({ message: 'Produit non trouvé' });
      }
      
      return res.status(200).json({
        _id: `virtual_${product._id}`,
        product: product,
        quantity: 0,
        seuilMin: product.seuilMin || 100,
        alerteActive: true,
        isVirtual: true
      });
    }
    
    const stock = await Stock.findById(req.params.id).lean();
    if (!stock) {
      return res.status(404).json({ message: 'Stock non trouvé' });
    }
    
    const product = await Product.findById(stock.product).lean();
    
    res.status(200).json({
      ...stock,
      product: product || null
    });
  } catch (error) {
    console.error('Erreur getStockById:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Obtenir le stock par produit
const getStockByProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId).lean();
    if (!product) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }
    
    let stock = await Stock.findOne({ product: req.params.productId }).lean();
    
    if (!stock) {
      // Retourner un stock virtuel
      return res.status(200).json({
        _id: `virtual_${product._id}`,
        product: product,
        quantity: 0,
        seuilMin: product.seuilMin || 100,
        alerteActive: true,
        isVirtual: true
      });
    }
    
    res.status(200).json({
      ...stock,
      product: product
    });
  } catch (error) {
    console.error('Erreur getStockByProduct:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Créer une entrée de stock (Admin seulement)
const createStock = async (req, res) => {
  try {
    const { product, quantity, seuilMin, alerteActive } = req.body;
    
    console.log('Création stock:', { product, quantity, seuilMin, alerteActive });
    
    // Validation
    if (!product) {
      return res.status(400).json({ message: 'L\'ID du produit est requis' });
    }
    
    // Vérifier si le produit existe
    const productExists = await Product.findById(product).lean();
    if (!productExists) {
      console.log('Produit non trouvé:', product);
      return res.status(404).json({ message: 'Produit non trouvé' });
    }
    
    // Vérifier si le stock existe déjà pour ce produit
    const existingStock = await Stock.findOne({ product });
    if (existingStock) {
      return res.status(400).json({ 
        message: 'Un stock existe déjà pour ce produit. Utilisez la mise à jour.' 
      });
    }
    
    const stock = new Stock({
      product,
      quantity: quantity !== undefined ? quantity : 0,
      seuilMin: seuilMin || productExists.seuilMin || 100,
      alerteActive: alerteActive !== undefined ? alerteActive : false
    });
    
    const savedStock = await stock.save();
    console.log('Stock créé:', savedStock._id);
    
    res.status(201).json({
      ...savedStock.toObject(),
      product: productExists
    });
  } catch (error) {
    console.error('Erreur createStock:', error);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Mettre à jour la quantité du stock
const updateStockQuantity = async (req, res) => {
  try {
    const { quantity, operation } = req.body;
    
    if (quantity === undefined) {
      return res.status(400).json({ message: 'La quantité est requise' });
    }
    
    // Vérifier si c'est un ID virtuel
    if (req.params.id.startsWith('virtual_')) {
      const productId = req.params.id.replace('virtual_', '');
      const product = await Product.findById(productId).lean();
      
      if (!product) {
        return res.status(404).json({ message: 'Produit non trouvé' });
      }
      
      // Créer un vrai stock à partir du virtuel
      let newQuantity = quantity;
      if (operation === 'add') {
        newQuantity = quantity;
      } else if (operation === 'subtract') {
        newQuantity = -quantity;
        if (newQuantity < 0) {
          return res.status(400).json({ message: 'La quantité ne peut pas être négative' });
        }
      }
      
      const newStock = new Stock({
        product: productId,
        quantity: newQuantity,
        seuilMin: product.seuilMin || 100,
        alerteActive: true
      });
      
      const savedStock = await newStock.save();
      
      return res.status(201).json({
        ...savedStock.toObject(),
        product: product
      });
    }
    
    const stock = await Stock.findById(req.params.id);
    if (!stock) {
      return res.status(404).json({ message: 'Stock non trouvé' });
    }
    
    let newQuantity = stock.quantity;
    
    if (operation === 'add') {
      newQuantity = stock.quantity + quantity;
    } else if (operation === 'subtract') {
      newQuantity = stock.quantity - quantity;
    } else {
      newQuantity = quantity;
    }
    
    if (newQuantity < 0) {
      return res.status(400).json({ message: 'La quantité ne peut pas être négative' });
    }
    
    stock.quantity = newQuantity;
    stock.dateDerniereMiseAJour = Date.now();
    
    const updatedStock = await stock.save();
    
    const product = await Product.findById(updatedStock.product).lean();
    
    res.status(200).json({
      ...updatedStock.toObject(),
      product: product || null
    });
  } catch (error) {
    console.error('Erreur updateStockQuantity:', error);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Mettre à jour le stock complet
const updateStock = async (req, res) => {
  try {
    const { quantity, seuilMin, alerteActive } = req.body;
    
    // Vérifier si c'est un ID virtuel
    if (req.params.id.startsWith('virtual_')) {
      const productId = req.params.id.replace('virtual_', '');
      const product = await Product.findById(productId).lean();
      
      if (!product) {
        return res.status(404).json({ message: 'Produit non trouvé' });
      }
      
      // Créer un vrai stock à partir du virtuel
      const newStock = new Stock({
        product: productId,
        quantity: quantity !== undefined ? quantity : 0,
        seuilMin: seuilMin !== undefined ? seuilMin : (product.seuilMin || 100),
        alerteActive: alerteActive !== undefined ? alerteActive : true
      });
      
      const savedStock = await newStock.save();
      
      return res.status(201).json({
        ...savedStock.toObject(),
        product: product
      });
    }
    
    const stock = await Stock.findById(req.params.id);
    if (!stock) {
      return res.status(404).json({ message: 'Stock non trouvé' });
    }
    
    if (quantity !== undefined) stock.quantity = quantity;
    if (seuilMin !== undefined) stock.seuilMin = seuilMin;
    if (alerteActive !== undefined) stock.alerteActive = alerteActive;
    stock.dateDerniereMiseAJour = Date.now();
    
    const updatedStock = await stock.save();
    
    const product = await Product.findById(updatedStock.product).lean();
    
    res.status(200).json({
      ...updatedStock.toObject(),
      product: product || null
    });
  } catch (error) {
    console.error('Erreur updateStock:', error);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Supprimer une entrée de stock
const deleteStock = async (req, res) => {
  try {
    // Ne pas supprimer les stocks virtuels
    if (req.params.id.startsWith('virtual_')) {
      return res.status(400).json({ message: 'Impossible de supprimer un stock virtuel' });
    }
    
    const stock = await Stock.findById(req.params.id);
    if (!stock) {
      return res.status(404).json({ message: 'Stock non trouvé' });
    }
    
    await stock.deleteOne();
    res.status(200).json({ message: 'Stock supprimé avec succès' });
  } catch (error) {
    console.error('Erreur deleteStock:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Obtenir les alertes de stock bas
const getStockBas = async (req, res) => {
  try {
    // Récupérer tous les produits
    const allProducts = await Product.find().lean();
    const stocks = await Stock.find().lean();
    
    const stockMap = new Map();
    stocks.forEach(stock => {
      const productId = stock.product?.toString();
      stockMap.set(productId, stock);
    });
    
    // Filtrer les produits avec stock bas (y compris ceux sans stock)
    const stockBas = allProducts.filter(product => {
      const stock = stockMap.get(product._id.toString());
      const quantity = stock?.quantity || 0;
      const seuilMin = stock?.seuilMin || product.seuilMin || 100;
      return quantity < seuilMin;
    });
    
    const enrichedStock = stockBas.map(product => {
      const stock = stockMap.get(product._id.toString());
      
      return {
        _id: stock?._id || `virtual_${product._id}`,
        product: product,
        quantity: stock?.quantity || 0,
        seuilMin: stock?.seuilMin || product.seuilMin || 100,
        alerteActive: stock?.alerteActive !== undefined ? stock.alerteActive : true,
        isVirtual: !stock
      };
    });
    
    res.status(200).json(enrichedStock);
  } catch (error) {
    console.error('Erreur getStockBas:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Synchroniser le stock (créer des entrées pour tous les produits)
const syncStock = async (req, res) => {
  try {
    const allProducts = await Product.find().lean();
    let created = 0;
    let existing = 0;
    
    for (const product of allProducts) {
      const existingStock = await Stock.findOne({ product: product._id });
      
      if (!existingStock) {
        await Stock.create({
          product: product._id,
          quantity: 0,
          seuilMin: product.seuilMin || 100,
          alerteActive: true,
          dateDerniereMiseAJour: new Date()
        });
        created++;
      } else {
        existing++;
      }
    }
    
    console.log(`✅ Synchronisation terminée: ${created} créés, ${existing} existants`);
    res.status(200).json({ 
      message: 'Synchronisation terminée', 
      created, 
      existing,
      total: allProducts.length 
    });
  } catch (error) {
    console.error('Erreur syncStock:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getStock,
  getStockById,
  getStockByProduct,
  createStock,
  updateStock,
  updateStockQuantity,
  deleteStock,
  getStockBas,
  syncStock
};