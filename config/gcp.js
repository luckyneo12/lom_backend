const { Storage } = require('@google-cloud/storage');
const multer = require('multer');
const path = require('path');
const {
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZE,
  BUCKET_NAME,
  GCP_SERVICE_ACCOUNT_KEY
} = require("./config");

// Decode base64 service account key
const serviceAccountKey = JSON.parse(
  Buffer.from(GCP_SERVICE_ACCOUNT_KEY, 'base64').toString('utf-8')
);

// GCP Storage configuration
const storage = new Storage({
  projectId: serviceAccountKey.project_id,
  credentials: serviceAccountKey,
});

const bucket = storage.bucket(BUCKET_NAME);

// Multer setup to use memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE || 20 * 1024 * 1024, // default 20MB
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  },
});

module.exports = {
  storage,
  bucket,
  upload,
}; 