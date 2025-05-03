const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ConversationSchema = new Schema({
  participants: [{
    type: Schema.Types.ObjectId,
    ref: 'user'
  }],
  lastMessage: {
    type: String
  },
  lastSender: {
    type: Schema.Types.ObjectId,
    ref: 'user'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  date: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = Conversation = mongoose.model('conversation', ConversationSchema);