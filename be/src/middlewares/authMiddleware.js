// middlewares/authMiddleware.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ message: "Pas de token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");

    const user = await User.findById(decoded.id).select("-motDePasse");

    if (!user) {
      return res.status(401).json({ message: "Utilisateur non trouvé" });
    }

    // S'assurer que l'utilisateur a un _id
    req.user = {
      _id: user._id,
      id: user._id, // Ajouter aussi id pour compatibilité
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      role: user.role
    };

    next();
  } catch (err) {
    console.error('Erreur auth:', err.message);
    return res.status(401).json({ message: "Token invalide" });
  }
};

module.exports = { protect };