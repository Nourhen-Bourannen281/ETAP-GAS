const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

// 🔥 Middlewares
app.use(express.json());
app.use(cors());

// ✅ Connexion MongoDB
mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/pfe-num2")
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// ✅ Routes
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/products", require("./routes/productRoutes"));
app.use('/api/pays', require('./routes/paysRoutes'));

app.use('/api/banques', require('./routes/banquesRoutes'));
app.use('/api/type-produits', require('./routes/typeProduitRoutes'));
app.use('/api/sous-produits', require('./routes/sousProduitRoutes'));
app.use('/api/referentiels', require('./routes/referentielsRoutes'));
app.use('/api/tiers', require('./routes/tiersRoutes'));
app.use('/api/stock', require('./routes/stockRoutes'));
app.use('/api/contrats', require('./routes/contratRoutes'));

app.use('/api/navires', require('./routes/naviresRoutes'));
app.use('/api/modes-paiement', require('./routes/modesPaiementRoutes'));
app.use('/api/types-facture', require('./routes/typesFactureRoutes'));

// ====================== SPRINT 3 ======================
app.use('/api/commandes', require('./routes/commandeRoutes'));
app.use('/api/livraisons', require('./routes/livraisonRoutes'));
app.use('/api/cargaisons', require('./routes/cargaisonRoutes'));
// ====================== SPRINT 4 ======================
app.use('/api/factures', require('./routes/factureRoutes'));
app.use('/api/emissions', require('./routes/emissionRoutes'));
app.use('/api/receptions', require('./routes/receptionRoutes'));
app.use('/api/conformites', require('./routes/conformiteRoutes'));
//app.use('/api/documents', require('./routes/documentRoutes')); 

app.use('/api/historique', require('./routes/historiqueRoutes'));
app.use('/api', require('./routes/exportImportRoutes'));
// ====================== SPRINT 5 ======================
app.use('/api/paiements', require('./routes/paiementRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/action-logs', require('./routes/actionLogRoutes'));
app.use('/api/rapports', require('./routes/rapportRoutes'));
// ✅ Gestion des erreurs 404
app.use((req, res, next) => {
  res.status(404).json({ message: "Route not found" });
});

// ✅ Middleware d'erreur global
app.use((err, req, res, next) => {
  console.error("❌ Server error:", err.stack);
  res.status(500).json({ message: "Internal server error" });
});

// 🚀 Lancement du serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
