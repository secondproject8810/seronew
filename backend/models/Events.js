const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const EventSchema = new Schema({
  organizer: {
    type: Schema.Types.ObjectId,
    ref: 'user'
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  image: {
    type: String
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  venue: {
    type: String,
    required: true
  },
  capacity: {
    type: Number
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0]
    },
    city: String,
    state: String
  },
  attendees: [
    {
      user: {
        type: Schema.Types.ObjectId,
        ref: 'user'
      },
      status: {
        type: String,
        enum: ['interested', 'going'],
        default: 'interested'
      },
      date: {
        type: Date,
        default: Date.now
      }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

EventSchema.index({ location: '2dsphere' });

module.exports = Event = mongoose.model('event', EventSchema);