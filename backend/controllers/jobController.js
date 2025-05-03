const Job = require('../models/Job');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// @route   POST api/jobs
// @desc    Create a job or gig
// @access  Private
exports.createJob = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const newJob = new Job({
      poster: req.user.id,
      company: req.body.company || user.name,
      title: req.body.title,
      description: req.body.description,
      type: req.body.type,
      skills: req.body.skills,
      budget: req.body.budget,
      location: req.body.location || user.location,
      deadline: req.body.deadline
    });

    const job = await newJob.save();

    res.json(job);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @route   GET api/jobs
// @desc    Get all jobs and gigs
// @access  Private
exports.getJobs = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    let jobs;
    
    // Add filter options
    const filter = { status: 'open' };
    
    // Add job type filter if specified
    if (req.query.type) {
      filter.type = req.query.type;
    }
    
    // Add skill filter if specified
    if (req.query.skills) {
      const skills = req.query.skills.split(',');
      filter.skills = { $in: skills };
    }
    
    // If user has location data, prioritize nearby jobs
    if (user.location && user.location.coordinates && 
        user.location.coordinates[0] !== 0 && user.location.coordinates[1] !== 0) {
      
      jobs = await Job.find({
        ...filter,
        $or: [
          // Remote jobs
          { 'location.remote': true },
          // Nearby jobs (within 50km)
          {
            location: {
              $near: {
                $geometry: {
                  type: 'Point',
                  coordinates: user.location.coordinates
                },
                $maxDistance: 50000
              }
            }
          }
        ]
      })
      .sort({ date: -1 })
      .populate('poster', ['name', 'profileImage', 'rating']);
      
    } else {
      // Get all jobs
      jobs = await Job.find(filter)
        .sort({ date: -1 })
        .populate('poster', ['name', 'profileImage', 'rating']);
    }
    
    res.json(jobs);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @route   GET api/jobs/:id
// @desc    Get job by ID
// @access  Private
exports.getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('poster', ['name', 'profileImage', 'rating', 'bio'])
      .populate('applications.user', ['name', 'profileImage', 'skills']);

    if (!job) {
      return res.status(404).json({ msg: 'Job not found' });
    }

    res.json(job);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Job not found' });
    }
    res.status(500).send('Server error');
  }
};

// @route   PUT api/jobs/:id
// @desc    Update a job
// @access  Private
exports.updateJob = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    let job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ msg: 'Job not found' });
    }

    // Check user
    if (job.poster.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    // Update fields
    const updateFields = {};
    for (const [key, value] of Object.entries(req.body)) {
      if (value !== undefined) {
        updateFields[key] = value;
      }
    }

    job = await Job.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true }
    );

    res.json(job);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Job not found' });
    }
    res.status(500).send('Server error');
  }
};

// @route   DELETE api/jobs/:id
// @desc    Delete a job
// @access  Private
exports.deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ msg: 'Job not found' });
    }

    // Check user
    if (job.poster.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    await job.remove();

    res.json({ msg: 'Job removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Job not found' });
    }
    res.status(500).send('Server error');
  }
};

// @route   POST api/jobs/apply/:id
// @desc    Apply to a job
// @access  Private
exports.applyToJob = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ msg: 'Job not found' });
    }

    // Check if already applied
    if (job.applications.some(app => app.user.toString() === req.user.id)) {
      return res.status(400).json({ msg: 'Already applied to this job' });
    }

    // Add application
    const newApplication = {
      user: req.user.id,
      proposal: req.body.proposal,
      rate: req.body.rate
    };

    job.applications.unshift(newApplication);

    await job.save();

    res.json(job.applications);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Job not found' });
    }
    res.status(500).send('Server error');
  }
};

// @route   PUT api/jobs/applications/:id/:app_id
// @desc    Update application status
// @access  Private
exports.updateApplicationStatus = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ msg: 'Job not found' });
    }

    // Check user is job poster
    if (job.poster.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    // Find application
    const applicationIndex = job.applications
      .findIndex(app => app.id === req.params.app_id);

    if (applicationIndex === -1) {
      return res.status(404).json({ msg: 'Application not found' });
    }

    // Update status
    job.applications[applicationIndex].status = req.body.status;

    // If accepting application, mark job as assigned
    if (req.body.status === 'accepted') {
      job.status = 'assigned';
    }

    await job.save();

    res.json(job.applications);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Job or application not found' });
    }
    res.status(500).send('Server error');
  }
};

// @route