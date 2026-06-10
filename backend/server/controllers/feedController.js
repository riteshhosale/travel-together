const Feed = require('../models/Feed');
const { getUploadedImageValue } = require('../utils/imageStorage');

exports.createPost = async (req, res) => {
  try {
    const { image, caption } = req.body;
    const uploadedImage = getUploadedImageValue({ file: req.file, req, mode: 'absolute' });

    const imageValue = uploadedImage || (image ? String(image).trim() : '');

    if (!req.user || !req.user.id) {
      return res.status(401).json({
        message: 'Unauthorized',
      });
    }

    if (!imageValue && !caption) {
      return res.status(400).json({
        message: 'Either image or caption is required',
      });
    }

    const post = new Feed({
      user: req.user.id,
      image: imageValue,
      caption: caption ? String(caption).trim() : '',
    });

    await post.save();

    await post.populate('user', 'name');

    res.json(post);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to create post',
    });
  }
};

exports.getFeed = async (req, res) => {
  try {
    const posts = await Feed.find().populate('user', 'name').sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch feed',
    });
  }
};

exports.deletePost = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const post = await Feed.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (String(post.user) !== String(req.user.id)) {
      return res.status(403).json({ message: 'You can only delete your own posts' });
    }

    await Feed.findByIdAndDelete(req.params.id);

    res.json({ message: 'Post deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete post' });
  }
};
