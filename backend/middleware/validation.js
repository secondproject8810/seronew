const { check } = require('express-validator');

exports.registerValidation = [
  check('name', 'Name is required').not().isEmpty(),
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
];

exports.loginValidation = [
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password is required').exists()
];

exports.postValidation = [
  check('text', 'Text is required').not().isEmpty()
];

exports.commentValidation = [
  check('text', 'Text is required').not().isEmpty()
];

exports.profileValidation = [
  check('bio', 'Bio cannot be more than 300 characters').optional().isLength({ max: 300 }),
  check('tagline', 'Tagline cannot be more than 100 characters').optional().isLength({ max: 100 })
];

exports.experienceValidation = [
  check('title', 'Title is required').not().isEmpty(),
  check('company', 'Company is required').not().isEmpty(),
  check('from', 'From date is required').not().isEmpty()
];

exports.educationValidation = [
  check('school', 'School is required').not().isEmpty(),
  check('degree', 'Degree is required').not().isEmpty(),
  check('fieldOfStudy', 'Field of study is required').not().isEmpty(),
  check('from', 'From date is required').not().isEmpty()
];

exports.eventValidation = [
  check('title', 'Title is required').not().isEmpty(),
  check('description', 'Description is required').not().isEmpty(),
  check('date', 'Date is required').not().isEmpty(),
  check('time', 'Time is required').not().isEmpty(),
  check('venue', 'Venue is required').not().isEmpty()
];

exports.jobValidation = [
  check('title', 'Title is required').not().isEmpty(),
  check('description', 'Description is required').not().isEmpty(),
  check('type', 'Type is required').not().isEmpty()
];

exports.applicationValidation = [
  check('proposal', 'Proposal is required').not().isEmpty()
];

exports.messageValidation = [
  check('text', 'Text is required when no media is attached').custom((value, { req }) => {
    if (!value && !req.body.media) {
      throw new Error('Either text or media is required');
    }
    return true;
  })
];