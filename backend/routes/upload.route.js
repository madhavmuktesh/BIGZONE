const express = require("express");
const upload = require("../middlewares/multer"); // You already have this file
const router = express.Router();

// POST /api/upload
router.post("/", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    const imageUrl = req.file.path; // Cloudinary URL
    res.json({ imageUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Upload failed" });
  }
});

module.exports = router;
