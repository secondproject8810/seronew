const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

// Set up storage
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    let uploadPath;
    
    // Determine upload directory based on route
    if (req.originalUrl.includes('/upload/profile')) {
      uploadPath = path.join(__dirname, '../uploads/profile');
    } else if (req.originalUrl.includes('/upload/post')) {
      uploadPath = path.join(__dirname, '../uploads/posts');
    } else if (req.originalUrl.includes('/upload/event')) {
      uploadPath = path.join(__dirname, '../uploads/events');
    } else if (req.originalUrl.includes('/upload/message')) {
      uploadPath = path.join(__dirname, '../uploads/messages');
    } else {
      uploadPath = path.join(__dirname, '../uploads/others');
    }
    
    cb(null, uploadPath);
  },
  filename: function(req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/') || 
      file.mimetype.startsWith('video/') ||
      file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type'), false);
  }
};

// Set up multer with configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max file size
  }
});

// Export middleware
module.exports = {
  profileImage: upload.single('profileImage'),
  postMedia: upload.single('media'),
  eventImage: upload.single('eventImage'),
  messageAttachment: upload.single('attachment')
};