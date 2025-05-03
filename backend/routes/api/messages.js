const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const auth = require('../../middleware/auth');
const messageController = require('../../controllers/messageController');

// @route   POST api/messages
// @desc    Create a new conversation
// @access  Private
router.post(
    '/',
    [
        auth,
        [
            check('recipient', 'Recipient is required').not().isEmpty(),
            check('message', 'Message is required').not().isEmpty()
        ]
    ],
    messageController.createConversation
);

// @route   GET api/messages
// @desc    Get all conversations
// @access  Private
router.get('/', auth, messageController.getConversations);

// @route   GET api/messages/:id
// @desc    Get conversation by ID
// @access  Private
router.get('/:id', auth, messageController.getConversationById);

// @route   POST api/messages/:id
// @desc    Send a message in conversation
// @access  Private
router.post(
    '/:id',
    [
        auth,
        [check('message', 'Message is required').not().isEmpty()]
    ],
    messageController.sendMessage
);

// @route   PUT api/messages/:id/read
// @desc    Mark conversation as read
// @access  Private
router.put('/:id/read', auth, messageController.markAsRead);

// @route   DELETE api/messages/:id
// @desc    Delete a conversation
// @access  Private
router.delete('/:id', auth, messageController.deleteConversation);

// @route   DELETE api/messages/:id/:message_id
// @desc    Delete a message
// @access  Private
router.delete('/:id/:message_id', auth, messageController.deleteMessage);

module.exports = router; 