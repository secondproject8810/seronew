const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const userController = require('../../controllers/userController');
const { profileValidation, experienceValidation, educationValidation } = require('../../middleware/validation');

// @route   GET api/users
// @desc    Get all users
// @access  Private
router.get('/', auth, userController.getAllUsers);

// @route   GET api/users/:user_id
// @desc    Get user by ID
// @access  Private
router.get('/:user_id', auth, userController.getUserById);

// @route   PUT api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', [auth, profileValidation], userController.updateProfile);

// @route   PUT api/users/experience
// @desc    Add profile experience
// @access  Private
router.put('/experience', [auth, experienceValidation], userController.addExperience);

// @route   PUT api/users/education
// @desc    Add profile education
// @access  Private
router.put('/education', [auth, educationValidation], userController.addEducation);

// @route   DELETE api/users/experience/:exp_id
// @desc    Delete experience from profile
// @access  Private
router.delete('/experience/:exp_id', auth, userController.deleteExperience);

// @route   DELETE api/users/education/:edu_id
// @desc    Delete education from profile
// @access  Private
router.delete('/education/:edu_id', auth, userController.deleteEducation);

// @route   GET api/users/recommendations
// @desc    Get recommended users for connections
// @access  Private
router.get('/recommendations', auth, userController.getRecommendations);

module.exports = router;