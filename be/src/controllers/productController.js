const Product = require('../models/Product');
const Stock = require('../models/Stock');

// Lister tous les produits
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find().populate('sousProduit', 'nom');
    const transformedProducts = products.map(product => {
      const productObj = product.toObject();
      return {
        ...productObj,
        stock: productObj.stockActuel
      };
    });
    res.json(transformedProducts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Obtenir un produit par ID
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('sousProduit', 'nom');
    if (!product) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }
    const responseProduct = {
      ...product.toObject(),
      stock: product.stockActuel
    };
    res.json(responseProduct);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Ajouter un produit
exports.createProduct = async (req, res) => {
  try {
    const productData = { ...req.body };
    
    // Convertir le stock en stockActuel
    if (productData.stock !== undefined) {
      productData.stockActuel = Number(productData.stock);
      delete productData.stock;
    }
    
    // Convertir prixUnitaire en nombre
    if (productData.prixUnitaire) {
      productData.prixUnitaire = Number(productData.prixUnitaire);
    }
    
    const product = await Product.create(productData);
    
    // Créer automatiquement une entrée de stock
    await Stock.create({
      product: product._id,
      quantity: productData.stockActuel || 0,
      seuilMin: productData.seuilMin || 100,
      alerteActive: true
    });
    
    const responseProduct = product.toObject();
    responseProduct.stock = responseProduct.stockActuel;
    res.status(201).json(responseProduct);
  } catch (err) {
    console.error('Create product error:', err);
    res.status(400).json({ message: err.message });
  }
};

// Modifier un produit
exports.updateProduct = async (req, res) => {
  try {
    const updateData = { ...req.body };
    
    if (updateData.stock !== undefined) {
      updateData.stockActuel = Number(updateData.stock);
      delete updateData.stock;
    }
    
    if (updateData.prixUnitaire) {
      updateData.prixUnitaire = Number(updateData.prixUnitaire);
    }
    
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!product) return res.status(404).json({ message: 'Produit non trouvé' });
    
    // Mettre à jour le stock
    if (updateData.stockActuel !== undefined) {
      await Stock.findOneAndUpdate(
        { product: product._id },
        { quantity: updateData.stockActuel, dateDerniereMiseAJour: new Date() },
        { upsert: true }
      );
    }
    
    const responseProduct = product.toObject();
    responseProduct.stock = responseProduct.stockActuel;
    res.json(responseProduct);
  } catch (err) {
    console.error('Update product error:', err);
    res.status(400).json({ message: err.message });
  }
};

// Supprimer un produit
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }
    // Supprimer aussi le stock associé
    await Stock.deleteOne({ product: req.params.id });
    res.json({ message: 'Produit supprimé avec succès' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};