const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// @route   GET api/messages
// @desc    Get all conversations for a user
// @access  Private
exports.getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user.id
    })
    .sort({ updatedAt: -1 })
    .populate('participants', ['name', 'profileImage'])
    .populate('lastSender', ['name']);
    
    // Format conversations for client
    const formattedConversations = conversations.map(convo => {
      const otherParticipants = convo.participants.filter(
        p => p._id.toString() !== req.user.id
      );
      
      return {
        _id: convo._id,
        participants: otherParticipants,
        lastMessage: convo.lastMessage,
        lastSender: convo.lastSender,
        isRead: convo.isRead,
        updatedAt: convo.updatedAt
      };
    });
    
    res.json(formattedConversations);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @route   GET api/messages/:conversation_id
// @desc    Get messages for a specific conversation
// @access  Private
exports.getMessages = async (req, res) => {
  try {
    // Check if conversation exists and user is a participant
    const conversation = await Conversation.findById(req.params.conversation_id);
    
    if (!conversation) {
      return res.status(404).json({ msg: 'Conversation not found' });
    }
    
    if (!conversation.participants.includes(req.user.id)) {
      return res.status(401).json({ msg: 'Not authorized' });
    }
    
    // Get messages
    const messages = await Message.find({ conversation: req.params.conversation_id })
      .sort({ createdAt: 1 })
      .populate('sender', ['name', 'profileImage']);
    
    // Mark messages as read
    await Message.updateMany(
      { 
        conversation: req.params.conversation_id,
        receiver: req.user.id,
        isRead: false
      },
      { $set: { isRead: true } }
    );
    
    // Update conversation read status
    await Conversation.findByIdAndUpdate(
      req.params.conversation_id,
      { isRead: true }
    );
    
    res.json(messages);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Conversation not found' });
    }
    res.status(500).send('Server error');
  }
};

// @route   POST api/messages
// @desc    Start a new conversation or send message to existing one
// @access  Private
exports.sendMessage = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { recipient, text, media, mediaType, conversationId } = req.body;
    
    let conversation;
    
    // Check if creating new conversation or using existing one
    if (conversationId) {
      // Find existing conversation
      conversation = await Conversation.findById(conversationId);
      
      if (!conversation) {
        return res.status(404).json({ msg: 'Conversation not found' });
      }
      
      // Verify user is a participant
      if (!conversation.participants.includes(req.user.id)) {
        return res.status(401).json({ msg: 'Not authorized' });
      }
    } else {
      // Find recipient user
      const recipientUser = await User.findById(recipient);
      
      if (!recipientUser) {
        return res.status(404).json({ msg: 'Recipient not found' });
      }
      
      // Check if conversation already exists
      const existingConvo = await Conversation.findOne({
        participants: { $all: [req.user.id, recipient] },
        $expr: { $eq: [{ $size: "$participants" }, 2] } // Only conversations with exactly 2 participants
      });
      
      if (existingConvo) {
        conversation = existingConvo;
      } else {
        // Create new conversation
        conversation = new Conversation({
          participants: [req.user.id, recipient],
          lastSender: req.user.id,
          isRead: false
        });
        
        await conversation.save();
      }
    }
    
    // Create message
    const newMessage = new Message({
      conversation: conversation._id,
      sender: req.user.id,
      receiver: conversation.participants.find(p => p.toString() !== req.user.id.toString()),
      text,
      media,
      mediaType: media ? (mediaType || 'image') : 'none',
      isRead: false
    });
    
    const message = await newMessage.save();
    
    // Update conversation with last message info
    conversation.lastMessage = text || (mediaType === 'image' ? 'Sent an image' : 'Sent an attachment');
    conversation.lastSender = req.user.id;
    conversation.isRead = false;
    conversation.updatedAt = Date.now();
    
    await conversation.save();
    
    // Return populated message
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', ['name', 'profileImage']);
    
    res.json({
      message: populatedMessage,
      conversation: conversation._id
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @route   DELETE api/messages/:message_id
// @desc    Delete a message
// @access  Private
exports.deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.message_id);
    
    if (!message) {
      return res.status(404).json({ msg: 'Message not found' });
    }
    
    // Check if user is the sender
    if (message.sender.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }
    
    await message.remove();
    
    res.json({ msg: 'Message removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Message not found' });
    }
    res.status(500).send('Server error');
  }
};

// @route   DELETE api/messages/conversations/:conversation_id
// @desc    Delete a conversation
// @access  Private
exports.deleteConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.conversation_id);
    
    if (!conversation) {
      return res.status(404).json({ msg: 'Conversation not found' });
    }
    
    // Check if user is a participant
    if (!conversation.participants.includes(req.user.id)) {
      return res.status(401).json({ msg: 'Not authorized' });
    }
    
    // Delete all messages
    await Message.deleteMany({ conversation: req.params.conversation_id });
    
    // Delete conversation
    await conversation.remove();
    
    res.json({ msg: 'Conversation removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Conversation not found' });
    }
    res.status(500).send('Server error');
  }
};