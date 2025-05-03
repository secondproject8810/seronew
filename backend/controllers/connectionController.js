const Connection = require('../models/Connection');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// @route   POST api/connections
// @desc    Create a connection request
// @access  Private
exports.createConnectionRequest = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { recipient } = req.body;
    
    // Check if user exists
    const recipientUser = await User.findById(recipient);
    if (!recipientUser) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Check if connection already exists
    const existingConnection = await Connection.findOne({
      $or: [
        { requester: req.user.id, recipient },
        { requester: recipient, recipient: req.user.id }
      ]
    });
    
    if (existingConnection) {
      return res.status(400).json({ msg: 'Connection already exists' });
    }
    
    // Create new connection request
    const newConnection = new Connection({
      requester: req.user.id,
      recipient,
      status: 'pending'
    });
    
    const connection = await newConnection.save();
    
    res.json(connection);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.status(500).send('Server error');
  }
};

// @route   PUT api/connections/:id
// @desc    Accept or reject connection request
// @access  Private
exports.respondToConnectionRequest = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { status } = req.body;
    
    if (status !== 'accepted' && status !== 'rejected') {
      return res.status(400).json({ msg: 'Invalid status value' });
    }
    
    // Find connection request
    const connection = await Connection.findById(req.params.id);
    
    if (!connection) {
      return res.status(404).json({ msg: 'Connection request not found' });
    }
    
    // Verify user is the recipient
    if (connection.recipient.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }
    
    // Update connection status
    connection.status = status;
    await connection.save();
    
    res.json(connection);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Connection not found' });
    }
    res.status(500).send('Server error');
  }
};

// @route   GET api/connections
// @desc    Get all user connections
// @access  Private
exports.getUserConnections = async (req, res) => {
  try {
    // Find all connections where user is either requester or recipient
    const connections = await Connection.find({
      $or: [
        { requester: req.user.id },
        { recipient: req.user.id }
      ],
      status: 'accepted'
    })
    .populate('requester', ['name', 'profileImage', 'tagline', 'userType'])
    .populate('recipient', ['name', 'profileImage', 'tagline', 'userType']);
    
    res.json(connections);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @route   GET api/connections/requests
// @desc    Get pending connection requests
// @access  Private
exports.getPendingRequests = async (req, res) => {
  try {
    // Find all connection requests where user is the recipient
    const requests = await Connection.find({
      recipient: req.user.id,
      status: 'pending'
    })
    .populate('requester', ['name', 'profileImage', 'tagline', 'userType']);
    
    res.json(requests);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @route   DELETE api/connections/:id
// @desc    Delete connection
// @access  Private
exports.deleteConnection = async (req, res) => {
  try {
    const connection = await Connection.findById(req.params.id);
    
    if (!connection) {
      return res.status(404).json({ msg: 'Connection not found' });
    }
    
    // Check if user is part of the connection
    if (connection.requester.toString() !== req.user.id && 
        connection.recipient.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }
    
    await connection.remove();
    
    res.json({ msg: 'Connection removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Connection not found' });
    }
    res.status(500).send('Server error');
  }
};

// @route   GET api/connections
// @desc    Get all connections
// @access  Private
exports.getConnections = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .populate('connections', ['name', 'profilePicture', 'bio', 'location'])
            .select('connections');

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        res.json(user.connections);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @route   POST api/connections/:id
// @desc    Send connection request
// @access  Private
exports.sendConnectionRequest = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const targetUser = await User.findById(req.params.id);
        if (!targetUser) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Check if already connected
        if (targetUser.connections.includes(req.user.id)) {
            return res.status(400).json({ msg: 'Already connected with this user' });
        }

        // Check if request already sent
        if (targetUser.connectionRequests.includes(req.user.id)) {
            return res.status(400).json({ msg: 'Connection request already sent' });
        }

        // Add to connection requests
        targetUser.connectionRequests.push(req.user.id);
        await targetUser.save();

        res.json({ msg: 'Connection request sent' });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.status(500).send('Server Error');
    }
};

// @route   PUT api/connections/:id
// @desc    Accept connection request
// @access  Private
exports.acceptConnectionRequest = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const targetUser = await User.findById(req.params.id);

        if (!user || !targetUser) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Check if request exists
        if (!user.connectionRequests.includes(req.params.id)) {
            return res.status(400).json({ msg: 'No connection request found' });
        }

        // Remove from connection requests
        user.connectionRequests = user.connectionRequests.filter(
            request => request.toString() !== req.params.id
        );

        // Add to connections
        user.connections.push(req.params.id);
        targetUser.connections.push(req.user.id);

        await user.save();
        await targetUser.save();

        res.json({ msg: 'Connection request accepted' });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.status(500).send('Server Error');
    }
};

// @route   DELETE api/connections/:id
// @desc    Remove connection
// @access  Private
exports.removeConnection = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const targetUser = await User.findById(req.params.id);

        if (!user || !targetUser) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Check if connected
        if (!user.connections.includes(req.params.id)) {
            return res.status(400).json({ msg: 'Not connected with this user' });
        }

        // Remove from connections
        user.connections = user.connections.filter(
            connection => connection.toString() !== req.params.id
        );
        targetUser.connections = targetUser.connections.filter(
            connection => connection.toString() !== req.user.id
        );

        await user.save();
        await targetUser.save();

        res.json({ msg: 'Connection removed' });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.status(500).send('Server Error');
    }
};

// @route   GET api/connections/requests
// @desc    Get all connection requests
// @access  Private
exports.getConnectionRequests = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .populate('connectionRequests', ['name', 'profilePicture', 'bio', 'location'])
            .select('connectionRequests');

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        res.json(user.connectionRequests);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};