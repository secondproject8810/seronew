const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const auth = require('../../middleware/auth');
const connectionController = require('../../controllers/connectionController');

// @route   GET api/connections
// @desc    Get all connections
// @access  Private
router.get('/', auth, connectionController.getConnections);

// @route   POST api/connections/:id
// @desc    Send connection request
// @access  Private
router.post(
    '/:id',
    [
        auth,
        [check('id', 'User ID is required').not().isEmpty()]
    ],
    connectionController.sendConnectionRequest
);

// @route   PUT api/connections/:id
// @desc    Accept connection request
// @access  Private
router.put(
    '/:id',
    [
        auth,
        [check('id', 'User ID is required').not().isEmpty()]
    ],
    connectionController.acceptConnectionRequest
);

// @route   DELETE api/connections/:id
// @desc    Remove connection
// @access  Private
router.delete(
    '/:id',
    [
        auth,
        [check('id', 'User ID is required').not().isEmpty()]
    ],
    connectionController.removeConnection
);

// @route   GET api/connections/requests
// @desc    Get all connection requests
// @access  Private
router.get('/requests', auth, connectionController.getConnectionRequests);

module.exports = router; 