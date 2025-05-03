const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const authController = require('../../controllers/authController');
const { registerValidation, loginValidation } = require('../../middleware/validation');

// @route   POST api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', registerValidation, authController.registerUser);

// @route   POST api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', loginValidation, authController.loginUser);

// @route   GET api/auth
// @desc    Get authenticated user
// @access  Private
router.get('/', auth, authController.getAuthUser);

module.exports = router;