const express = require("express");
const router = express.Router();
const {
  login,
  verifyAccount,
  rejectAccount,
  forgotPassword,
  resetPassword,
  createUser,
} = require("../controllers/authController");

// LOGIN
router.post("/login", login);

// VERIFY / REJECT
router.get("/verify/:token", verifyAccount);
router.get("/reject/:token", rejectAccount);

// CREATE USER (admin)
router.post("/create-user", createUser);

// FORGOT / RESET PASSWORD
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

module.exports = router;
