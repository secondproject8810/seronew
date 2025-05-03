const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ConnectionSchema = new Schema({
  requester: {
    type: Schema.Types.ObjectId,
    ref: 'user'
  },
  recipient: {
    type: Schema.Types.ObjectId,
    ref: 'user'
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  date: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Create compound index to ensure uniqueness
ConnectionSchema.index({ requester: 1, recipient: 1 }, { unique: true });

module.exports = Connection = mongoose.model('connection', ConnectionSchema);