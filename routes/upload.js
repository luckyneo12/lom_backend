const express = require("express");
const router = express.Router();
const { upload, bucket } = require("../config/gcp");
const { verifyToken } = require("../middleware/auth");
const path = require('path');

// Upload single image
router.post("/", verifyToken, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "No image file provided",
      });
    }

    const timestamp = new Date().toISOString().replace(/[:.-]/g, "");
    const filename = `${timestamp}__${req.file.originalname}`;
    const filePath = `blog_images/${filename}`;

    const blob = bucket.file(filePath);
    const blobStream = blob.createWriteStream({
      metadata: {
        contentType: req.file.mimetype,
      },
    });

    blobStream.on("error", (error) => {
      console.error("Error uploading to GCP:", error);
      res.status(500).json({
        message: "Error uploading image",
        details: error.message,
      });
    });

    blobStream.on("finish", async () => {
      // Make the file public
      await blob.makePublic();

      // Get the public URL
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

      res.json({
        url: publicUrl,
        filename: filename,
        contentType: req.file.mimetype,
        size: req.file.size,
      });
    });

    blobStream.end(req.file.buffer);
  } catch (error) {
    console.error("Error uploading image:", error);
    res.status(500).json({
      message: "Error uploading image",
      details: error.message,
    });
  }
});

// Delete uploaded image
router.delete("/:filename", verifyToken, async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = `blog_images/${filename}`;
    
    const file = bucket.file(filePath);
    const [exists] = await file.exists();

    if (!exists) {
      return res.status(404).json({
        message: "Image not found",
        details: "The requested image does not exist",
      });
    }

    await file.delete();

    res.json({
      message: "Image deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting image:", error);
    res.status(500).json({
      message: "Error deleting image",
      details: error.message,
    });
  }
});

module.exports = router;
