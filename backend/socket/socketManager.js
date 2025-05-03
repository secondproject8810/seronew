const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const config = require('config');
const User = require('../models/User');
const messageHandlers = require('./messageHandlers');
const notificationHandlers = require('./notificationHandlers');

const onlineUsers = new Map();

module.exports = function(server) {
  const io = socketIO(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });
  
  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }
      
      const decoded = jwt.verify(token, config.get('jwtSecret'));
      
      if (!decoded.user || !decoded.user.id) {
        return next(new Error('Authentication error'));
      }
      
      const user = await User.findById(decoded.user.id).select('-password');
      
      if (!user) {
        return next(new Error('Authentication error'));
      }
      
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });
  
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.name} (${socket.user._id})`);
    
    // Add user to online users
    onlineUsers.set(socket.user._id.toString(), socket.id);
    
    // Join personal room for direct messages
    socket.join(socket.user._id.toString());
    
    // Emit online users list
    io.emit('users:online', Array.from(onlineUsers.keys()));
    
    // Message handlers
    messageHandlers(io, socket, onlineUsers);
    
    // Notification handlers
    notificationHandlers(io, socket, onlineUsers);
    
    // Disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.name} (${socket.user._id})`);
      onlineUsers.delete(socket.user._id.toString());
      io.emit('users:online', Array.from(onlineUsers.keys()));
    });
  });
  
  return io;
};