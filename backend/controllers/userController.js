const User = require('../models/User');
const Post = require('../models/Post');
const Connection = require('../models/Connection');
const { validationResult } = require('express-validator');

// @route   GET api/users
// @desc    Get all users
// @access  Private
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @route   GET api/users/:user_id
// @desc    Get user by ID
// @access  Private
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.user_id).select('-password');
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.status(500).send('Server error');
  }
};

// @route   PUT api/users/profile
// @desc    Update user profile
// @access  Private
exports.updateProfile = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    bio,
    tagline,
    location,
    skills,
    interests,
    availability,
    lookingFor,
    talents,
    social
  } = req.body;

  // Build profile object
  const profileFields = {};
  if (bio) profileFields.bio = bio;
  if (tagline) profileFields.tagline = tagline;
  if (location) profileFields.location = location;
  if (skills) profileFields.skills = skills.split(',').map(skill => skill.trim());
  if (interests) profileFields.interests = interests.split(',').map(interest => interest.trim());
  if (availability) profileFields.availability = availability;
  if (lookingFor) profileFields.lookingFor = lookingFor;
  if (talents) profileFields.talents = talents.split(',').map(talent => talent.trim());

  // Build social object
  if (social) profileFields.social = social;

  try {
    // Update user profile
    let user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: profileFields },
      { new: true }
    );

    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @route   PUT api/users/experience
// @desc    Add profile experience
// @access  Private
exports.addExperience = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    title,
    company,
    location,
    from,
    to,
    current,
    description
  } = req.body;

  const newExp = {
    title,
    company,
    location,
    from,
    to,
    current,
    description
  };

  try {
    const user = await User.findById(req.user.id);

    user.experience.unshift(newExp);

    await user.save();

    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @route   PUT api/users/education
// @desc    Add profile education
// @access  Private
exports.addEducation = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    school,
    degree,
    fieldOfStudy,
    from,
    to,
    current,
    description
  } = req.body;

  const newEdu = {
    school,
    degree,
    fieldOfStudy,
    from,
    to,
    current,
    description
  };

  try {
    const user = await User.findById(req.user.id);

    user.education.unshift(newEdu);

    await user.save();

    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @route   DELETE api/users/experience/:exp_id
// @desc    Delete experience from profile
// @access  Private
exports.deleteExperience = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    // Get remove index
    const removeIndex = user.experience
      .map(item => item.id)
      .indexOf(req.params.exp_id);

    if (removeIndex !== -1) {
      user.experience.splice(removeIndex, 1);
      await user.save();
    }

    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @route   DELETE api/users/education/:edu_id
// @desc    Delete education from profile
// @access  Private
exports.deleteEducation = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    // Get remove index
    const removeIndex = user.education
      .map(item => item.id)
      .indexOf(req.params.edu_id);

    if (removeIndex !== -1) {
      user.education.splice(removeIndex, 1);
      await user.save();
    }

    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @route   GET api/users/recommendations
// @desc    Get recommended users for connections
// @access  Private
exports.getRecommendations = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Get user's existing connections
    const connections = await Connection.find({
      $or: [
        { requester: req.user.id, status: 'accepted' },
        { recipient: req.user.id, status: 'accepted' }
      ]
    });
    
    // Extract connected user IDs
    const connectedUserIds = connections.map(conn => {
      return conn.requester.toString() === req.user.id.toString() 
        ? conn.recipient.toString() 
        : conn.requester.toString();
    });
    
    // Add current user to excluded list
    connectedUserIds.push(req.user.id);
    
    // Find users who are not already connected
    let recommendedUsers;
    
    // If user has location data, prioritize nearby users
    if (user.location && user.location.coordinates && 
        user.location.coordinates[0] !== 0 && user.location.coordinates[1] !== 0) {
      
      recommendedUsers = await User.find({
        _id: { $nin: connectedUserIds },
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: user.location.coordinates
            },
            $maxDistance: 50000 // 50 kilometers
          }
        }
      })
      .select('-password')
      .limit(50);
      
    } else {
      // Fallback to skill/interest matching
      
      // Get user skills and interests
      const userSkills = user.skills || [];
      const userInterests = user.interests || [];
      
      // Find users with matching skills or interests
      recommendedUsers = await User.find({
        _id: { $nin: connectedUserIds },
        $or: [
          { skills: { $in: userSkills } },
          { interests: { $in: userInterests } }
        ]
      })
      .select('-password')
      .limit(50);
    }
    
    // Get pending requests to exclude users already requested
    const pendingRequests = await Connection.find({
      requester: req.user.id,
      status: 'pending'
    });
    
    const pendingUserIds = pendingRequests.map(req => req.recipient.toString());
    
    // Filter out users with pending requests
    const filteredRecommendations = recommendedUsers.filter(
      user => !pendingUserIds.includes(user._id.toString())
    );
    
    res.json(filteredRecommendations);
    
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};