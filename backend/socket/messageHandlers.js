const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

module.exports = function(io, socket, onlineUsers) {
  // Send message
  socket.on('message:send', async (data, callback) => {
    try {
      const { conversationId, recipient, text, media, mediaType } = data;
      
      let conversation;
      let newConversation = false;
      
      // Check if conversation exists
      if (conversationId) {
        conversation = await Conversation.findById(conversationId);
        
        if (!conversation) {
          return callback({
            status: 'error',
            message: 'Conversation not found'
          });
        }
        
        // Verify user is a participant
        if (!conversation.participants.includes(socket.user._id)) {
          return callback({
            status: 'error',
            message: 'Not authorized'
          });
        }
      } else {
        // Find recipient user
        if (!recipient) {
          return callback({
            status: 'error',
            message: 'Recipient is required'
          });
        }
        
        // Check if conversation already exists
        const existingConvo = await Conversation.findOne({
          participants: { $all: [socket.user._id, recipient] },
          $expr: { $eq: [{ $size: "$participants" }, 2] } // Only 2 participants
        });
        
        if (existingConvo) {
          conversation = existingConvo;
        } else {
          // Create new conversation
          conversation = new Conversation({
            participants: [socket.user._id, recipient],
            lastSender: socket.user._id,
            isRead: false
          });
          
          await conversation.save();
          newConversation = true;
        }
      }
      
      // Determine receiver
      const receiverId = conversation.participants.find(
        p => p.toString() !== socket.user._id.toString()
      );
      
      // Create message
      const newMessage = new Message({
        conversation: conversation._id,
        sender: socket.user._id,
        receiver: receiverId,
        text,
        media,
        mediaType: media ? (mediaType || 'image') : 'none',
        isRead: false
      });
      
      const message = await newMessage.save();
      
      // Update conversation with last message info
      conversation.lastMessage = text || (mediaType === 'image' ? 'Sent an image' : 'Sent an attachment');
      conversation.lastSender = socket.user._id;
      conversation.isRead = false;
      conversation.updatedAt = Date.now();
      
      await conversation.save();
      
      // Populate message
      const populatedMessage = await Message.findById(message._id)
        .populate('sender', ['name', 'profileImage']);
      
      // Emit to recipient if online
      if (onlineUsers.has(receiverId.toString())) {
        const recipientSocketId = onlineUsers.get(receiverId.toString());
        
        if (newConversation) {
          // Emit new conversation to recipient
          const populatedConvo = await Conversation.findById(conversation._id)
            .populate('participants', ['name', 'profileImage'])
            .populate('lastSender', ['name']);
          
          io.to(recipientSocketId).emit('conversation:new', {
            conversation: populatedConvo,
            otherUser: socket.user
          });
        }
        
        // Emit message to recipient
        io.to(recipientSocketId).emit('message:received', {
          message: populatedMessage,
          conversationId: conversation._id
        });
      }
      
      // Send response to sender
      callback({
        status: 'success',
        message: populatedMessage,
        conversationId: conversation._id,
        newConversation
      });
    } catch (err) {
      console.error('Message send error:', err);
      callback({
        status: 'error',
        message: 'Server error'
      });
    }
  });
  
  // Read messages
  socket.on('message:read', async ({ conversationId }) => {
    try {
      if (!conversationId) return;
      
      // Update messages as read
      await Message.updateMany(
        { 
          conversation: conversationId,
          receiver: socket.user._id,
          isRead: false
        },
        { $set: { isRead: true } }
      );
      
      // Update conversation read status
      await Conversation.findByIdAndUpdate(
        conversationId,
        { isRead: true }
      );
      
      // Get other participant
      const conversation = await Conversation.findById(conversationId);
      
      if (conversation) {
        const otherParticipantId = conversation.participants.find(
          p => p.toString() !== socket.user._id.toString()
        );
        
        // Notify other participant if online
        if (otherParticipantId && onlineUsers.has(otherParticipantId.toString())) {
          const otherSocketId = onlineUsers.get(otherParticipantId.toString());
          io.to(otherSocketId).emit('message:read', { conversationId });
        }
      }
    } catch (err) {
      console.error('Message read error:', err);
    }
  });
  
  // Typing indicator
  socket.on('message:typing', ({ conversationId, isTyping }) => {
    if (!conversationId) return;
    
    // Broadcast typing status to conversation participants
    socket.to(conversationId).emit('message:typing', {
      conversationId,
      user: socket.user._id,
      isTyping
    });
  });
};