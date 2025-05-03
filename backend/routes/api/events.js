const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const auth = require('../../middleware/auth');
const eventController = require('../../controllers/eventController');

// @route   POST api/events
// @desc    Create an event
// @access  Private
router.post(
    '/',
    [
        auth,
        [
            check('title', 'Title is required').not().isEmpty(),
            check('description', 'Description is required').not().isEmpty(),
            check('date', 'Date is required').not().isEmpty(),
            check('location', 'Location is required').not().isEmpty()
        ]
    ],
    eventController.createEvent
);

// @route   GET api/events
// @desc    Get all events
// @access  Private
router.get('/', auth, eventController.getEvents);

// @route   GET api/events/:id
// @desc    Get event by ID
// @access  Private
router.get('/:id', auth, eventController.getEventById);

// @route   PUT api/events/:id
// @desc    Update an event
// @access  Private
router.put(
    '/:id',
    [
        auth,
        [check('id', 'Event ID is required').not().isEmpty()]
    ],
    eventController.updateEvent
);

// @route   DELETE api/events/:id
// @desc    Delete an event
// @access  Private
router.delete('/:id', auth, eventController.deleteEvent);

// @route   PUT api/events/attend/:id
// @desc    Attend an event
// @access  Private
router.put('/attend/:id', auth, eventController.attendEvent);

// @route   PUT api/events/unattend/:id
// @desc    Unattend an event
// @access  Private
router.put('/unattend/:id', auth, eventController.unattendEvent);

module.exports = router; 