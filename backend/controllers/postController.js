const Post = require('../models/Post');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// @route   POST api/posts
// @desc    Create a post
// @access  Private
exports.createPost = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const user = await User.findById(req.user.id).select('-password');

    const newPost = new Post({
      text: req.body.text,
      name: user.name,
      avatar: user.profileImage,
      user: req.user.id,
      location: req.body.location || user.location
    });

    // If there are media attachments
    if (req.body.media && req.body.media.length > 0) {
      newPost.media = req.body.media;
      newPost.mediaType = req.body.mediaType || 'image';
    }

    const post = await newPost.save();

    res.json(post);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @route   GET api/posts
// @desc    Get all posts for feed
// @access  Private
exports.getPosts = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    // Get all connected user ids
    const connections = await Connection.find({
      $or: [
        { requester: req.user.id, status: 'accepted' },
        { recipient: req.user.id, status: 'accepted' }
      ]
    });
    
    const connectedUserIds = connections.map(conn => {
      return conn.requester.toString() === req.user.id.toString() 
        ? conn.recipient 
        : conn.requester;
    });
    
    // Add current user to the list
    connectedUserIds.push(req.user.id);
    
    // Get posts from connected users and nearby users
    let posts;
    
    // If user has location, include nearby posts
    if (user.location && user.location.coordinates && 
        user.location.coordinates[0] !== 0 && user.location.coordinates[1] !== 0) {
      
      posts = await Post.find({
        $or: [
          // Posts from connections
          { user: { $in: connectedUserIds } },
          // Nearby posts (within 25km)
          {
            location: {
              $near: {
                $geometry: {
                  type: 'Point',
                  coordinates: user.location.coordinates
                },
                $maxDistance: 25000
              }
            }
          }
        ]
      })
      .sort({ date: -1 })
      .populate('user', ['name', 'profileImage']);
      
    } else {
      // Just get posts from connections
      posts = await Post.find({ user: { $in: connectedUserIds } })
        .sort({ date: -1 })
        .populate('user', ['name', 'profileImage']);
    }
    
    res.json(posts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @route   GET api/posts/:id
// @desc    Get post by ID
// @access  Private
exports.getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('user', ['name', 'profileImage'])
      .populate('comments.user', ['name', 'profileImage']);

    if (!post) {
      return res.status(404).json({ msg: 'Post not found' });
    }

    res.json(post);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Post not found' });
    }
    res.status(500).send('Server error');
  }
};

// @route   DELETE api/posts/:id
// @desc    Delete a post
// @access  Private
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ msg: 'Post not found' });
    }

    // Check user
    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    await post.remove();

    res.json({ msg: 'Post removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Post not found' });
    }
    res.status(500).send('Server error');
  }
};

// @route   PUT api/posts/like/:id
// @desc    Like a post
// @access  Private
exports.likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ msg: 'Post not found' });
    }

    // Check if already liked
    if (post.likes.some(like => like.user.toString() === req.user.id)) {
      return res.status(400).json({ msg: 'Post already liked' });
    }

    // Remove from dislikes if disliked
    if (post.dislikes.some(dislike => dislike.user.toString() === req.user.id)) {
      post.dislikes = post.dislikes.filter(
        dislike => dislike.user.toString() !== req.user.id
      );
    }

    post.likes.unshift({ user: req.user.id });

    await post.save();

    res.json(post.likes);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Post not found' });
    }
    res.status(500).send('Server error');
  }
};

// @route   PUT api/posts/dislike/:id
// @desc    Dislike a post
// @access  Private
exports.dislikePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ msg: 'Post not found' });
    }

    // Check if already disliked
    if (post.dislikes.some(dislike => dislike.user.toString() === req.user.id)) {
      return res.status(400).json({ msg: 'Post already disliked' });
    }

    // Remove from likes if liked
    if (post.likes.some(like => like.user.toString() === req.user.id)) {
      post.likes = post.likes.filter(
        like => like.user.toString() !== req.user.id
      );
    }

    post.dislikes.unshift({ user: req.user.id });

    await post.save();

    res.json(post.dislikes);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Post not found' });
    }
    res.status(500).send('Server error');
  }
};

// @route   PUT api/posts/unlike/:id
// @desc    Unlike a post
// @access  Private
exports.unlikePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ msg: 'Post not found' });
    }

    // Check if post has been liked
    if (!post.likes.some(like => like.user.toString() === req.user.id)) {
      return res.status(400).json({ msg: 'Post has not yet been liked' });
    }

    // Remove the like
    post.likes = post.likes.filter(
      like => like.user.toString() !== req.user.id
    );

    await post.save();

    res.json(post.likes);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Post not found' });
    }
    res.status(500).send('Server error');
  }
};

// @route   PUT api/posts/undislike/:id
// @desc    Remove dislike from a post
// @access  Private
exports.undislikePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ msg: 'Post not found' });
    }

    // Check if post has been disliked
    if (!post.dislikes.some(dislike => dislike.user.toString() === req.user.id)) {
      return res.status(400).json({ msg: 'Post has not yet been disliked' });
    }

    // Remove the dislike
    post.dislikes = post.dislikes.filter(
      dislike => dislike.user.toString() !== req.user.id
    );

    await post.save();

    res.json(post.dislikes);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Post not found' });
    }
    res.status(500).send('Server error');
  }
};

// @route   POST api/posts/comment/:id
// @desc    Comment on a post
// @access  Private
exports.commentOnPost = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const user = await User.findById(req.user.id).select('-password');
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ msg: 'Post not found' });
    }

    const newComment = {
      text: req.body.text,
      name: user.name,
      avatar: user.profileImage,
      user: req.user.id
    };

    post.comments.unshift(newComment);

    await post.save();

    res.json(post.comments);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Post not found' });
    }
    res.status(500).send('Server error');
  }
};

// @route   DELETE api/posts/comment/:id/:comment_id
// @desc    Delete comment
// @access  Private
exports.deleteComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ msg: 'Post not found' });
    }

    // Pull out comment
    const comment = post.comments.find(
      comment => comment.id === req.params.comment_id
    );

    // Make sure comment exists
    if (!comment) {
      return res.status(404).json({ msg: 'Comment does not exist' });
    }

    // Check user
    if (comment.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    // Remove comment
    post.comments = post.comments.filter(
      comment => comment.id !== req.params.comment_id
    );

    await post.save();

    res.json(post.comments);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Post or comment not found' });
    }
    res.status(500).send('Server error');
  }
};

// @route   PUT api/posts/share/:id
// @desc    Share a post (increment share count)
// @access  Private
exports.sharePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ msg: 'Post not found' });
    }

    // Increment share count
    post.shareCount = post.shareCount + 1;

    await post.save();

    res.json({ shareCount: post.shareCount });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Post not found' });
    }
    res.status(500).send('Server error');
  }
};