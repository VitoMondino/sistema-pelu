const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Ruta de login
router.post('/login', authController.login);

// Ruta de registro (opcional, si se implementa)
// router.post('/register', authController.register);

module.exports = router;
