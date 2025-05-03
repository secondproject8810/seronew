const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  profileImage: {
    type: String,
    default: 'default-profile.png'
  },
  coverImage: {
    type: String,
    default: 'default-cover.png'
  },
  bio: {
    type: String
  },
  tagline: {
    type: String
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
    country: String
  },
  skills: [String],
  interests: [String],
  availability: {
    weekdays: { type: Boolean, default: false },
    weekends: { type: Boolean, default: false },
    fullTime: { type: Boolean, default: false },
    partTime: { type: Boolean, default: false }
  },
  lookingFor: {
    network: { type: Boolean, default: false },
    social: { type: Boolean, default: false },
    professional: { type: Boolean, default: false }
  },
  talents: [String],
  experience: [{
    title: String,
    company: String,
    location: String,
    from: Date,
    to: Date,
    current: Boolean,
    description: String
  }],
  education: [{
    school: String,
    degree: String,
    fieldOfStudy: String,
    from: Date,
    to: Date,
    current: Boolean,
    description: String
  }],
  social: {
    website: String,
    linkedin: String,
    instagram: String,
    twitter: String
  },
  rating: {
    type: Number,
    default: 0
  },
  userType: {
    type: String,
    enum: ['regular', 'freelancer', 'business', 'student'],
    default: 'regular'
  },
  membership: {
    type: String,
    enum: ['basic', 'pro', 'elite'],
    default: 'basic'
  },
  date: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Create index for geospatial queries
UserSchema.index({ location: '2dsphere' });

module.exports = User = mongoose.model('user', UserSchema);