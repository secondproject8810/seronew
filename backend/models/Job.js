const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const JobSchema = new Schema({
  poster: {
    type: Schema.Types.ObjectId,
    ref: 'user'
  },
  company: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['job', 'gig', 'project'],
    default: 'job'
  },
  skills: [String],
  budget: {
    min: Number,
    max: Number,
    currency: {
      type: String,
      default: 'INR'
    },
    type: {
      type: String,
      enum: ['fixed', 'hourly', 'daily'],
      default: 'fixed'
    }
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
    state: String,
    remote: {
      type: Boolean,
      default: false
    }
  },
  deadline: {
    type: Date
  },
  status: {
    type: String,
    enum: ['open', 'assigned', 'completed', 'cancelled'],
    default: 'open'
  },
  applications: [
    {
      user: {
        type: Schema.Types.ObjectId,
        ref: 'user'
      },
      proposal: String,
      rate: Number,
      status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
      },
      date: {
        type: Date,
        default: Date.now
      }
    }
  ],
  date: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

JobSchema.index({ location: '2dsphere' });

module.exports = Job = mongoose.model('job', JobSchema);