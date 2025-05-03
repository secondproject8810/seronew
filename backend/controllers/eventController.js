const Event = require('../models/Event');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// @route   POST api/events
// @desc    Create an event
// @access  Private
exports.createEvent = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const newEvent = new Event({
      organizer: req.user.id,
      title: req.body.title,
      description: req.body.description,
      date: req.body.date,
      time: req.body.time,
      venue: req.body.venue,
      capacity: req.body.capacity,
      location: req.body.location,
      image: req.body.image
    });

    const event = await newEvent.save();

    res.json(event);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @route   GET api/events
// @desc    Get all events
// @access  Private
exports.getEvents = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    let events;
    
    // If user has location data, prioritize nearby events
    if (user.location && user.location.coordinates && 
        user.location.coordinates[0] !== 0 && user.location.coordinates[1] !== 0) {
      
      // Get current date to filter past events
      const currentDate = new Date();
      
      events = await Event.find({
        date: { $gte: currentDate },
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: user.location.coordinates
            },
            $maxDistance: 50000 // 50 kilometers
          }
        }
      })
      .sort({ date: 1 }) // Sort by date ascending (closest first)
      .populate('organizer', ['name', 'profileImage']);
      
    } else {
      // Fallback to all upcoming events
      const currentDate = new Date();
      
      events = await Event.find({
        date: { $gte: currentDate }
      })
      .sort({ date: 1 })
      .populate('organizer', ['name', 'profileImage']);
    }
    
    res.json(events);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @route   GET api/events/:id
// @desc    Get event by ID
// @access  Private
exports.getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer', ['name', 'profileImage'])
      .populate('attendees.user', ['name', 'profileImage']);

    if (!event) {
      return res.status(404).json({ msg: 'Event not found' });
    }

    res.json(event);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Event not found' });
    }
    res.status(500).send('Server error');
  }
};

// @route   PUT api/events/:id
// @desc    Update an event
// @access  Private
exports.updateEvent = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    let event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ msg: 'Event not found' });
    }

    // Check user is organizer
    if (event.organizer.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    // Update fields
    const updateFields = {};
    for (const [key, value] of Object.entries(req.body)) {
      if (value !== undefined) {
        updateFields[key] = value;
      }
    }

    event = await Event.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true }
    );

    res.json(event);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Event not found' });
    }
    res.status(500).send('Server error');
  }
};

// @route   DELETE api/events/:id
// @desc    Delete an event
// @access  Private
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ msg: 'Event not found' });
    }

    // Check user is organizer
    if (event.organizer.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    await event.remove();

    res.json({ msg: 'Event removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Event not found' });
    }
    res.status(500).send('Server error');
  }
};

// @route   PUT api/events/attend/:id
// @desc    Attend an event
// @access  Private
exports.attendEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ msg: 'Event not found' });
    }

    // Check if already attending
    if (event.attendees.some(a => a.user.toString() === req.user.id)) {
      return res.status(400).json({ msg: 'Already attending this event' });
    }

    // Check if event is full
    if (event.capacity && event.attendees.length >= event.capacity) {
      return res.status(400).json({ msg: 'Event is at full capacity' });
    }

    // Add user to attendees
    event.attendees.unshift({
      user: req.user.id,
      status: req.body.status || 'going'
    });

    await event.save();

    res.json(event.attendees);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Event not found' });
    }
    res.status(500).send('Server error');
  }
};

// @route   PUT api/events/unattend/:id
// @desc    Cancel attendance to an event
// @access  Private
exports.unattendEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ msg: 'Event not found' });
    }

    // Check if attending
    if (!event.attendees.some(a => a.user.toString() === req.user.id)) {
      return res.status(400).json({ msg: 'Not attending this event' });
    }

    // Remove user from attendees
    event.attendees = event.attendees.filter(
      a => a.user.toString() !== req.user.id
    );

    await event.save();

    res.json(event.attendees);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Event not found' });
    }
    res.status(500).send('Server error');
  }
};