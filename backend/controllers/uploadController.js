const User = require('../models/User');
const fs = require('fs');
const path = require('path');

// @route   POST api/upload/profile
// @desc    Upload profile image
// @access  Private
exports.uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'No file uploaded' });
    }
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      // Remove uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Delete old profile image if it exists and is not the default
    if (user.profileImage && user.profileImage !== 'default-profile.png') {
      const oldImagePath = path.join(__dirname, '../uploads/profile', user.profileImage);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }
    
    // Update user profile with new image
    user.profileImage = req.file.filename;
    await user.save();
    
    res.json({
      msg: 'Profile image uploaded',
      filename: req.file.filename
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @route   POST api/upload/post
// @desc    Upload post media
// @access  Private
exports.uploadPostMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'No file uploaded' });
    }
    
    res.json({
      msg: 'Media uploaded',
      filename: req.file.filename
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @route   POST api/upload/event
// @desc    Upload event image
// @access  Private
exports.uploadEventImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'No file uploaded' });
    }
    
    res.json({
      msg: 'Event image uploaded',
      filename: req.file.filename
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @route   POST api/upload/message
// @desc    Upload message attachment
// @access  Private
exports.uploadMessageAttachment = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'No file uploaded' });
    }
    
    res.json({
      msg: 'Attachment uploaded',
      filename: req.file.filename
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};