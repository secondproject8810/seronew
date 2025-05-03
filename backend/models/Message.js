const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MessageSchema = new Schema({
  conversation: {
    type: Schema.Types.ObjectId,
    ref: 'conversation'
  },
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'user'
  },
  receiver: {
    type: Schema.Types.ObjectId,
    ref: 'user'
  },
  text: {
    type: String
  },
  media: {
    type: String
  },
  mediaType: {
    type: String,
    enum: ['image', 'video', 'audio', 'file', 'none'],
    default: 'none'
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

module.exports = Message = mongoose.model('message', MessageSchema);