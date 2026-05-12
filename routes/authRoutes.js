const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Registration routes
router.get('/register', authController.getRegister);
router.post('/register', authController.postRegister);

// Login routes
router.get('/login', authController.getLogin);
router.post('/login', authController.postLogin);

// Logout route
router.get('/logout', authController.logout);
router.post('/logout', authController.logout);

// API endpoint to check current user
router.get('/me', authController.getCurrentUser);

module.exports = router;