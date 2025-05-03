const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const upload = require('../../middleware/upload');
const uploadController = require('../../controllers/uploadController');

// @route   POST api/uploads/profile
// @desc    Upload profile picture
// @access  Private
router.post(
    '/profile',
    [auth, upload.single('profilePicture')],
    uploadController.uploadProfilePicture
);

// @route   POST api/uploads/post
// @desc    Upload post media
// @access  Private
router.post(
    '/post',
    [auth, upload.array('media', 5)],
    uploadController.uploadPostMedia
);

// @route   POST api/uploads/event
// @desc    Upload event image
// @access  Private
router.post(
    '/event',
    [auth, upload.single('eventImage')],
    uploadController.uploadEventImage
);

// @route   POST api/uploads/job
// @desc    Upload job/gig image
// @access  Private
router.post(
    '/job',
    [auth, upload.single('jobImage')],
    uploadController.uploadJobImage
);

// @route   DELETE api/uploads/:id
// @desc    Delete uploaded file
// @access  Private
router.delete('/:id', auth, uploadController.deleteFile);

module.exports = router; 