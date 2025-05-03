const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const auth = require('../../middleware/auth');
const jobController = require('../../controllers/jobController');

// @route   POST api/jobs
// @desc    Create a job/gig
// @access  Private
router.post(
    '/',
    [
        auth,
        [
            check('title', 'Title is required').not().isEmpty(),
            check('description', 'Description is required').not().isEmpty(),
            check('type', 'Job type is required').not().isEmpty(),
            check('category', 'Category is required').not().isEmpty(),
            check('budget', 'Budget is required').not().isEmpty()
        ]
    ],
    jobController.createJob
);

// @route   GET api/jobs
// @desc    Get all jobs
// @access  Private
router.get('/', auth, jobController.getJobs);

// @route   GET api/jobs/:id
// @desc    Get job by ID
// @access  Private
router.get('/:id', auth, jobController.getJobById);

// @route   PUT api/jobs/:id
// @desc    Update a job
// @access  Private
router.put(
    '/:id',
    [
        auth,
        [check('id', 'Job ID is required').not().isEmpty()]
    ],
    jobController.updateJob
);

// @route   DELETE api/jobs/:id
// @desc    Delete a job
// @access  Private
router.delete('/:id', auth, jobController.deleteJob);

// @route   POST api/jobs/:id/apply
// @desc    Apply for a job
// @access  Private
router.post(
    '/:id/apply',
    [
        auth,
        [
            check('id', 'Job ID is required').not().isEmpty(),
            check('coverLetter', 'Cover letter is required').not().isEmpty()
        ]
    ],
    jobController.applyForJob
);

// @route   GET api/jobs/applications
// @desc    Get all job applications
// @access  Private
router.get('/applications', auth, jobController.getJobApplications);

// @route   PUT api/jobs/:id/status
// @desc    Update job application status
// @access  Private
router.put(
    '/:id/status',
    [
        auth,
        [
            check('id', 'Job ID is required').not().isEmpty(),
            check('status', 'Status is required').not().isEmpty()
        ]
    ],
    jobController.updateApplicationStatus
);

module.exports = router; 