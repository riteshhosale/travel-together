const fs = require('fs');
const path = require('path');
const { v2: cloudinary } = require('cloudinary');

const uploadsDir = path.join(__dirname, '..', 'uploads');

const cloudinaryEnabled = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (cloudinaryEnabled) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

const isCloudinaryUrl = (value) => {
  return /^https?:\/\/res\.cloudinary\.com\//i.test(String(value || ''));
};

const getUploadedImageValue = ({ file, req, mode = 'absolute' }) => {
  if (!file) {
    return '';
  }

  if (file.path && /^https?:\/\//i.test(file.path)) {
    return file.path;
  }

  const filename = file.filename || path.basename(String(file.path || '').trim());

  if (!filename) {
    return '';
  }

  if (mode === 'relative') {
    return `/uploads/${filename}`;
  }

  const forwardedProto = req && req.headers ? req.headers['x-forwarded-proto'] : '';
  const forwardedHost = req && req.headers ? req.headers['x-forwarded-host'] : '';
  const protocol = forwardedProto || (req && req.protocol) || 'http';
  const host = forwardedHost || (req && req.get ? req.get('host') : '');

  if (!host) {
    return `/uploads/${filename}`;
  }

  return `${protocol}://${host}/uploads/${filename}`;
};

const extractCloudinaryPublicId = (imageUrl) => {
  try {
    const parsed = new URL(String(imageUrl));
    const uploadSegment = '/upload/';
    const uploadIndex = parsed.pathname.indexOf(uploadSegment);

    if (uploadIndex === -1) {
      return '';
    }

    let publicPath = parsed.pathname.slice(uploadIndex + uploadSegment.length);
    publicPath = publicPath.replace(/^v\d+\//, '');
    publicPath = publicPath.replace(/\.[^./]+$/, '');

    return publicPath;
  } catch (error) {
    return '';
  }
};

const deleteLocalUploadByUrl = (imageUrl) => {
  const filename = path.basename(String(imageUrl || ''));

  if (!filename) {
    return;
  }

  const filePath = path.join(uploadsDir, filename);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

const deleteStoredImageByUrl = async (imageUrl) => {
  if (!imageUrl || typeof imageUrl !== 'string') {
    return;
  }

  try {
    if (isCloudinaryUrl(imageUrl) && cloudinaryEnabled) {
      const publicId = extractCloudinaryPublicId(imageUrl);

      if (publicId) {
        await cloudinary.uploader.destroy(publicId, {
          resource_type: 'image',
        });
      }

      return;
    }

    deleteLocalUploadByUrl(imageUrl);
  } catch (error) {
    // Cleanup failures should not block profile updates.
  }
};

module.exports = {
  cloudinary,
  cloudinaryEnabled,
  deleteStoredImageByUrl,
  getUploadedImageValue,
};
